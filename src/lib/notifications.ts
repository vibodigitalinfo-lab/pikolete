import "server-only"

import { runAudit } from "@/lib/audit/engine"
import { gateChecks, rankIssues } from "@/lib/audit/gating"
import type { AuditResult } from "@/lib/audit/types"
import { hostKey, siteConfig } from "@/lib/config"
import type { Lead } from "@/lib/leads"
import { sendMail, type MailResult } from "@/lib/mailer"
import { buildReportPdf, reportPdfFilename } from "@/lib/pdf"
import { rateLimit } from "@/lib/rate-limit"

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const NAVY = "#212e61"
const AMBER = "#f4b814"

function layout(title: string, body: string, internal = false): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f6f4ef;font-family:Arial,Helvetica,sans-serif;color:#23283c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:${NAVY};padding:22px 28px;border-bottom:4px solid ${AMBER}">
<p style="margin:0;color:${AMBER};font-size:11px;font-weight:bold;letter-spacing:3px">PIKOLETE INSPECTOR</p>
<h1 style="margin:6px 0 0;color:#ffffff;font-size:22px">${title}</h1></td></tr>
<tr><td style="padding:26px 28px;font-size:15px;line-height:1.55">${body}</td></tr>
<tr><td style="padding:16px 28px;background:#f2f4fa;font-size:12px;color:#6e7387">
Pikolete Inspector · <a href="${siteConfig.url}" style="color:${NAVY}">pikolete.com</a> ·
<a href="${siteConfig.url}/privacidad" style="color:${NAVY}">Privacidad</a><br>
${internal ? "Aviso interno del panel de Pikolete." : "Recibes este email porque solicitaste tu informe en pikolete.com."}</td></tr>
</table></td></tr></table></body></html>`
}

/**
 * Evita usar el formulario para bombardear un buzón ajeno: el mismo informe una vez al día
 * y como mucho 3 informes al día por destinatario.
 */
async function recipientBlocked(email: string, host: string): Promise<string | null> {
  if (!(await rateLimit(`mail:report:${email}|${host}`, 1, 86_400_000))) return "ya enviado"
  if (!(await rateLimit(`mail:to:${email}`, 3, 86_400_000))) return "demasiados informes a este email hoy"
  return null
}

/** Vuelve a auditar la web en el servidor (no confiamos en datos del cliente) y envía el informe completo en PDF. */
export async function sendReportEmail(lead: Lead): Promise<MailResult> {
  if (!lead.auditedUrl) return { sent: false, reason: "sin URL auditada" }
  const blocked = await recipientBlocked(lead.email, hostKey(lead.auditedUrl))
  if (blocked) return { sent: false, reason: blocked }

  const audit = await runAudit(lead.auditedUrl)
  const result: AuditResult = { ...audit, unlocked: true, checks: gateChecks(audit.checks, true) }
  const doc = await buildReportPdf(result)
  const pdfBase64 = Buffer.from(doc.output("arraybuffer")).toString("base64")

  const host = new URL(result.finalUrl).hostname
  const issues = rankIssues(result.checks)
  const fails = issues.filter((c) => c.status === "fail").length
  const top = issues.slice(0, 3)
  const greeting = lead.name ? `Hola ${esc(lead.name)},` : "Hola,"
  const scoreColor = result.score >= 80 ? "#1e965f" : result.score >= 50 ? "#d48a00" : "#cc3333"

  const html = layout(
    `Tu informe de ${esc(host)}`,
    `<p>${greeting}</p>
<p>El agente Pikolete ha terminado la inspección de <strong>${esc(host)}</strong>. Te adjuntamos el <strong>informe oficial en PDF</strong> con la solución paso a paso de cada fallo.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;width:100%;background:#f6f4ef;border-radius:10px"><tr>
<td style="padding:16px 18px;width:90px"><span style="font-size:38px;font-weight:bold;color:${scoreColor}">${result.score}</span><span style="color:#6e7387">/100</span></td>
<td style="padding:16px 18px;color:#23283c">Nota <strong>${result.grade}</strong><br><span style="color:#6e7387;font-size:13px">${fails} infracciones · ${issues.length - fails} advertencias</span></td>
</tr></table>
${
  top.length
    ? `<p style="margin-bottom:6px"><strong>Lo más urgente:</strong></p><ul style="padding-left:20px;margin-top:0">${top
        .map((c) => `<li style="margin-bottom:6px"><strong>${esc(c.title)}</strong>: ${esc(c.diagnosis)}</li>`)
        .join("")}</ul>`
    : `<p>¡Enhorabuena! No hemos encontrado infracciones.</p>`
}
<p style="margin:24px 0 8px"><a href="${siteConfig.url}/resultados?url=${encodeURIComponent(result.finalUrl)}" style="background:${NAVY};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;display:inline-block">Ver el informe online</a></p>
<p style="color:#6e7387;font-size:13px">— El equipo de Pikolete</p>`
  )

  const text = [
    lead.name ? `Hola ${lead.name},` : "Hola,",
    "",
    `Tu informe de ${host}: nota ${result.score}/100 (${result.grade}). ${fails} infracciones y ${issues.length - fails} advertencias.`,
    "Adjuntamos el informe oficial en PDF con la solución paso a paso de cada fallo.",
    ...top.map((c) => `- ${c.title}: ${c.diagnosis}`),
    "",
    `${siteConfig.url}`,
  ].join("\n")

  return sendMail({
    to: lead.email,
    subject: `Tu informe Pikolete: ${host} ha sacado un ${result.score}/100`,
    html,
    text,
    attachments: [{ content: pdfBase64, filename: reportPdfFilename(result), type: "application/pdf" }],
  })
}

/** Aviso interno al equipo cuando alguien pide presupuesto. */
export async function notifyQuoteRequest(lead: Lead): Promise<MailResult> {
  const to = process.env.NOTIFY_EMAIL
  if (!to) return { sent: false, reason: "NOTIFY_EMAIL no configurado" }

  const rows: Array<[string, string | undefined]> = [
    ["Email", lead.email],
    ["Nombre", lead.name],
    ["Empresa", lead.company],
    ["Teléfono", lead.phone],
    ["Web", lead.auditedUrl],
    ["Nota", lead.score !== undefined ? `${lead.score}/100 (${lead.grade ?? "?"})` : undefined],
    ["Mensaje", lead.message],
    ["Origen", lead.source.utmSource || lead.source.referrer],
  ]
  const table = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6e7387;vertical-align:top">${k}</td><td style="padding:6px 0">${esc(v as string)}</td></tr>`
    )
    .join("")

  return sendMail({
    to,
    subject: `🚨 Nuevo presupuesto: ${lead.auditedUrl ? new URL(lead.auditedUrl).hostname : lead.email}`,
    html: layout(
      "Nueva solicitud de presupuesto",
      `<table role="presentation" cellpadding="0" cellspacing="0">${table}</table>
<p style="margin-top:20px"><a href="${siteConfig.url}/admin" style="color:${NAVY};font-weight:bold">Abrir el panel de contactos →</a></p>`,
      true
    ),
    text: rows
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
  })
}
