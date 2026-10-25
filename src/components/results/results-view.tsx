"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CircleCheck, CircleX, FileDown, Gauge, LayoutTemplate, Lock, PartyPopper, RotateCcw, Search, TriangleAlert } from "lucide-react"

import { PikoleteMascot } from "@/components/brand/pikolete-logo"
import { InspectForm } from "@/components/landing/inspect-form"
import { InspectionLoader } from "@/components/results/inspection-loader"
import { IssueItem } from "@/components/results/issue-item"
import { LeadGate } from "@/components/results/lead-gate"
import { ScoreGauge } from "@/components/results/score-gauge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FREE_FIXES, rankIssues } from "@/lib/audit/gating"
import type { AuditErrorBody, AuditResult, CheckCategory } from "@/lib/audit/types"
import { downloadReportPdf } from "@/lib/pdf"

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; result: AuditResult }

const TABS: Array<{ value: CheckCategory; label: string; icon: typeof Search }> = [
  { value: "seo", label: "SEO", icon: Search },
  { value: "performance", label: "Velocidad & Seguridad", icon: Gauge },
  { value: "structure", label: "Estructura", icon: LayoutTemplate },
]

async function fetchAudit(url: string): Promise<State> {
  try {
    const res = await fetch("/api/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    const body = (await res.json()) as AuditResult | AuditErrorBody
    if (!res.ok || "error" in body) {
      return { status: "error", message: "error" in body ? body.error : "Error inesperado." }
    }
    return { status: "ready", result: body }
  } catch {
    return { status: "error", message: "No pudimos contactar con el inspector. Revisa tu conexión." }
  }
}

export function ResultsView({ url }: { url: string }) {
  const [state, setState] = useState<State>({ status: "loading" })
  const [justUnlocked, setJustUnlocked] = useState(false)
  const gateRef = useRef<HTMLDivElement>(null)

  const inspect = useCallback(
    async (showLoader: boolean) => {
      if (showLoader) setState({ status: "loading" })
      setState(await fetchAudit(url))
    },
    [url]
  )

  useEffect(() => {
    // El estado inicial ya es "loading" (el componente se monta con key={url}).
    if (!url) return
    let cancelled = false
    void fetchAudit(url).then((next) => {
      if (!cancelled) setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  if (!url) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
        <PikoleteMascot className="mx-auto size-24" />
        <h1 className="mt-4 text-3xl font-extrabold text-primary">¿Qué web inspeccionamos?</h1>
        <InspectForm className="mt-8" />
      </section>
    )
  }

  if (state.status === "loading") return <InspectionLoader url={url} />

  if (state.status === "error") {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
        <PikoleteMascot className="mx-auto size-24 grayscale-[40%]" />
        <h1 className="mt-4 text-2xl font-extrabold text-primary">Inspección interrumpida</h1>
        <p className="mt-2 text-muted-foreground">{state.message}</p>
        <InspectForm defaultValue={url} className="mt-8" />
      </section>
    )
  }

  const { result } = state
  const issues = rankIssues(result.checks)
  const fails = issues.filter((c) => c.status === "fail").length
  const warns = issues.length - fails
  const passes = result.checks.length - issues.length
  const lockedCount = result.checks.filter((c) => c.locked).length
  const scrollToGate = () => gateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      {justUnlocked && result.unlocked && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium">
          <PartyPopper className="size-5 text-success" />
          ¡Gracias! Ya tienes desbloqueadas todas las soluciones y el informe PDF oficial.
        </div>
      )}

      {/* Cabecera tipo boletín de multa */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl bg-card shadow-xl shadow-primary/10 ring-1 ring-border"
      >
        <div className="flex flex-col gap-2 bg-primary px-6 py-5 text-primary-foreground sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.25em] text-badge uppercase">La Multa de Pikolete</p>
            <h1 className="mt-1 truncate text-xl font-extrabold sm:text-2xl">{new URL(result.finalUrl).hostname}</h1>
            <p className="truncate font-mono text-xs opacity-70">{result.finalUrl}</p>
          </div>
          <p className="font-mono text-sm opacity-80">
            Nº {result.ticketId} · {new Date(result.inspectedAt).toLocaleString("es-ES")}
          </p>
        </div>
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-center">
          <ScoreGauge score={result.score} grade={result.grade} />
          <div>
            <div className="grid grid-cols-3 gap-3">
              <Stat icon={CircleX} tone="text-danger" value={fails} label="Infracciones" />
              <Stat icon={TriangleAlert} tone="text-warning" value={warns} label="Advertencias" />
              <Stat icon={CircleCheck} tone="text-success" value={passes} label="En regla" />
            </div>
            <dl className="mt-4 flex flex-wrap gap-2 text-xs">
              <Metric label="Respuesta" value={`${result.metrics.responseTimeMs} ms`} />
              <Metric label="Carga total" value={`${result.metrics.downloadTimeMs} ms`} />
              <Metric label="HTML" value={`${result.metrics.htmlSizeKb} KB`} />
              <Metric label="SSL" value={result.metrics.https ? "Válido" : "No"} />
              <Metric label="Imágenes" value={`${result.metrics.imagesTotal}`} />
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              {result.unlocked ? (
                <Button onClick={() => void downloadReportPdf(result)}>
                  <FileDown /> Descargar informe PDF oficial
                </Button>
              ) : (
                <Button onClick={scrollToGate}>
                  <Lock /> Informe completo gratis
                </Button>
              )}
              <Button variant="outline" onClick={() => void inspect(true)}>
                <RotateCcw /> Volver a inspeccionar
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/#inspeccion">Otra web</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="ticket-edge rotate-180 bg-background" />
      </motion.section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          <Tabs defaultValue="seo" className="gap-5">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 sm:w-fit">
              {TABS.map(({ value, label, icon: Icon }) => {
                const count = issues.filter((c) => c.category === value).length
                return (
                  <TabsTrigger key={value} value={value} className="px-3 py-2">
                    <Icon /> {label}
                    {count > 0 && (
                      <span className="ml-1 rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">{count}</span>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {TABS.map(({ value }) => {
              const tabIssues = issues.filter((c) => c.category === value)
              const passed = result.checks.filter((c) => c.category === value && c.status === "pass")
              return (
                <TabsContent key={value} value={value} className="space-y-4">
                  {tabIssues.length === 0 ? (
                    <p className="rounded-xl border border-success/25 bg-success/5 p-5 text-sm font-medium">
                      Sin infracciones en esta sección. ¡Pikolete te deja seguir circulando!
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {tabIssues.map((check) => (
                        <IssueItem key={check.id} check={check} onUnlock={scrollToGate} />
                      ))}
                    </ul>
                  )}
                  {passed.length > 0 && (
                    <details className="group rounded-xl border bg-card">
                      <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-success">
                        <CircleCheck className="mr-2 inline size-4" />
                        {passed.length} controles en regla
                      </summary>
                      <ul className="space-y-3 px-3 pb-3">
                        {passed.map((check) => (
                          <IssueItem key={check.id} check={check} onUnlock={scrollToGate} />
                        ))}
                      </ul>
                    </details>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>

          {!result.unlocked && lockedCount > 0 && (
            <LeadGate
              ref={gateRef}
              result={result}
              lockedCount={lockedCount}
              onUnlocked={() => {
                setJustUnlocked(true)
                window.scrollTo({ top: 0, behavior: "smooth" })
                void inspect(false)
              }}
            />
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {result.unlocked ? (
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-bold">Tu informe oficial</h2>
              <p className="mt-1 text-sm text-muted-foreground">Todas las soluciones, listo para compartir con tu equipo.</p>
              <Button className="mt-4 w-full" onClick={() => void downloadReportPdf(result)}>
                <FileDown /> Descargar PDF
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-badge bg-badge/10 p-6">
              <h2 className="font-bold">Informe completo gratis</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Desbloquea las {lockedCount} soluciones restantes y el PDF oficial solo con tu email.
              </p>
              <Button className="mt-4 w-full" onClick={scrollToGate}>
                <Lock /> Desbloquear gratis
              </Button>
            </div>
          )}
          <div className="rounded-2xl border bg-card p-6 text-sm">
            <h2 className="font-bold">Cómo se lee tu multa</h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <CircleX className="size-4 shrink-0 text-danger" /> Infracción: impacto alto, corrígelo primero.
              </li>
              <li className="flex gap-2">
                <TriangleAlert className="size-4 shrink-0 text-warning" /> Advertencia: mejora recomendada.
              </li>
              <li className="flex gap-2">
                <Lock className="size-4 shrink-0 text-primary" /> Las {FREE_FIXES} soluciones más urgentes se ven sin registrarte.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, tone, value, label }: { icon: typeof CircleX; tone: string; value: number; label: string }) {
  return (
    <div className="rounded-xl border bg-background p-3 text-center sm:p-4">
      <Icon className={`mx-auto size-5 ${tone}`} />
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 rounded-md bg-muted px-2.5 py-1">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
