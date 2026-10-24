import type { AuditCheck, AuditResult, CheckCategory } from "@/lib/audit/types"
import { rankIssues } from "@/lib/audit/gating"
import { hostKey, siteConfig } from "@/lib/config"

type RGB = [number, number, number]

const NAVY: RGB = [33, 46, 97]
const AMBER: RGB = [244, 184, 20]
const INK: RGB = [35, 40, 60]
const MUTED: RGB = [110, 115, 135]
const STATUS_COLOR: Record<AuditCheck["status"], RGB> = {
  fail: [204, 51, 51],
  warn: [212, 138, 0],
  pass: [30, 150, 95],
}
const STATUS_LABEL: Record<AuditCheck["status"], string> = {
  fail: "INFRACCION",
  warn: "ADVERTENCIA",
  pass: "EN REGLA",
}
const CATEGORY_LABEL: Record<CheckCategory, string> = {
  seo: "SEO",
  performance: "Velocidad y Seguridad",
  structure: "Estructura",
}

/** Las fuentes estándar de jsPDF solo cubren Latin-1: normalizamos el resto. */
function latin1(text: string): string {
  return text
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/×/g, "x")
    .replace(/→/g, "->")
    .replace(/[^\x00-\xFF]/g, "")
}

/**
 * Construye el informe en PDF (navegador o servidor). Si el informe está desbloqueado es el "Informe oficial"
 * con todas las soluciones; si no, el básico con diagnósticos y las soluciones gratuitas.
 */
export async function buildReportPdf(result: AuditResult) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 48
  const contentW = W - M * 2
  const official = result.unlocked
  let y = 0

  const setColor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2])
  const ensure = (needed: number) => {
    if (y + needed > H - 56) {
      doc.addPage()
      y = 56
    }
  }
  const paragraph = (text: string, size: number, color: RGB, font: "helvetica" | "courier" = "helvetica", indent = 0) => {
    doc.setFont(font, "normal")
    doc.setFontSize(size)
    setColor(color)
    const lines = doc.splitTextToSize(latin1(text), contentW - indent) as string[]
    for (const line of lines) {
      ensure(size + 4)
      doc.text(line, M + indent, y)
      y += size + 4
    }
  }

  // Cabecera
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 110, "F")
  doc.setFillColor(...AMBER)
  doc.rect(0, 110, W, 4, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  setColor(AMBER)
  doc.text("PIKOLETE INSPECTOR  ·  BOLETIN DE DENUNCIA", M, 40)
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.text(official ? "Informe oficial de inspeccion" : "Informe basico de inspeccion", M, 70)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(
    latin1(`N. ${result.ticketId}  ·  ${result.finalUrl}  ·  ${new Date(result.inspectedAt).toLocaleString("es-ES")}`),
    M,
    92
  )

  // Nota
  y = 160
  const tone: RGB = result.score >= 80 ? STATUS_COLOR.pass : result.score >= 50 ? STATUS_COLOR.warn : STATUS_COLOR.fail
  doc.setDrawColor(...tone)
  doc.setLineWidth(7)
  doc.circle(M + 40, y, 36, "S")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(26)
  setColor(INK)
  doc.text(String(result.score), M + 40, y + 9, { align: "center" })
  doc.setFontSize(16)
  doc.text(`Nota ${result.grade} · ${result.score}/100`, M + 100, y - 8)
  const issues = rankIssues(result.checks)
  const fails = issues.filter((c) => c.status === "fail").length
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  setColor(MUTED)
  doc.text(
    latin1(`${fails} infracciones graves y ${issues.length - fails} advertencias en ${result.checks.length} controles.`),
    M + 100,
    y + 12
  )
  const m = result.metrics
  doc.text(
    latin1(`Respuesta ${m.responseTimeMs} ms · HTML ${m.htmlSizeKb} KB · ${m.https ? "HTTPS valido" : "Sin HTTPS valido"} · ${m.imagesTotal} imagenes`),
    M + 100,
    y + 28
  )
  y += 70

  // Infracciones por categoría
  for (const category of ["seo", "performance", "structure"] as CheckCategory[]) {
    const checks = result.checks
      .filter((c) => c.category === category)
      .sort((a, b) => ({ fail: 0, warn: 1, pass: 2 })[a.status] - ({ fail: 0, warn: 1, pass: 2 })[b.status])

    ensure(48)
    y += 10
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    setColor(NAVY)
    doc.text(latin1(CATEGORY_LABEL[category]), M, y)
    doc.setDrawColor(...AMBER)
    doc.setLineWidth(2)
    doc.line(M, y + 6, M + 40, y + 6)
    y += 26

    for (const check of checks) {
      ensure(40)
      const color = STATUS_COLOR[check.status]
      doc.setFillColor(...color)
      doc.roundedRect(M, y - 9, 74, 13, 3, 3, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7)
      doc.setTextColor(255, 255, 255)
      doc.text(STATUS_LABEL[check.status], M + 37, y - 0.5, { align: "center" })
      doc.setFontSize(11)
      setColor(INK)
      doc.text(latin1(check.title + (check.value ? `  (${check.value})` : "")), M + 84, y)
      y += 16
      paragraph(check.diagnosis, 9.5, MUTED, "helvetica", 84)

      if (check.fix && check.status !== "pass") {
        y += 2
        check.fix.steps.forEach((step, i) => paragraph(`${i + 1}. ${step}`, 9.5, INK, "helvetica", 84))
        if (check.fix.code) {
          doc.setFont("courier", "normal")
          doc.setFontSize(8)
          const lines = doc.splitTextToSize(latin1(check.fix.code), contentW - 100) as string[]
          const boxH = lines.length * 11 + 12
          ensure(boxH + 6)
          doc.setFillColor(242, 244, 250)
          doc.roundedRect(M + 84, y - 4, contentW - 84, boxH, 4, 4, "F")
          setColor(NAVY)
          lines.forEach((line, i) => doc.text(line, M + 92, y + 8 + i * 11))
          y += boxH + 4
        }
      } else if (check.locked) {
        paragraph(
          `Solucion bloqueada. Desbloquea gratis el informe oficial en ${siteConfig.url.replace("https://", "")}`,
          9,
          AMBER,
          "helvetica",
          84
        )
      }
      y += 10
    }
  }

  if (!official) {
    ensure(80)
    y += 10
    doc.setFillColor(...NAVY)
    doc.roundedRect(M, y, contentW, 64, 6, 6, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text(latin1("Desbloquea gratis todas las soluciones"), M + 16, y + 26)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    doc.text(latin1(`Guia paso a paso, codigo listo para copiar e informe oficial en ${siteConfig.url.replace("https://", "")}`), M + 16, y + 44)
  }

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    setColor(MUTED)
    doc.text(latin1(`pikolete.com · ${result.ticketId}`), M, H - 28)
    doc.text(`${i} / ${pages}`, W - M, H - 28, { align: "right" })
  }

  return doc
}

export function reportPdfFilename(result: AuditResult): string {
  return `pikolete-${hostKey(result.finalUrl) || "informe"}-${result.ticketId}.pdf`
}

/** Genera el PDF en el navegador y lo descarga. */
export async function downloadReportPdf(result: AuditResult): Promise<void> {
  const doc = await buildReportPdf(result)
  doc.save(reportPdfFilename(result))
}
