"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import {
  CalendarDays,
  Download,
  ExternalLink,
  Loader2,
  LogOut,
  Mail,
  MailCheck,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { PikoleteBadge } from "@/components/brand/pikolete-logo"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Lead } from "@/lib/leads"
import { cn } from "@/lib/utils"

const PANEL_HEADERS = { "x-pikolete-panel": "1" }

const PROFILE_LABEL: Record<string, string> = {
  owner: "Su web / negocio",
  agency: "Agencia / freelance",
  looking: "Busca quien la arregle",
}

type State = { status: "loading" } | { status: "login" } | { status: "ready"; leads: Lead[] } | { status: "error"; message: string }

export function AdminApp() {
  const [state, setState] = useState<State>({ status: "loading" })

  const load = useCallback(async (): Promise<State> => {
    const res = await fetch("/api/admin/leads?format=json", { headers: PANEL_HEADERS, cache: "no-store" }).catch(() => null)
    if (!res) return { status: "error", message: "No se pudo conectar con el servidor." }
    if (res.status === 401) return { status: "login" }
    if (!res.ok) return { status: "error", message: `Error ${res.status} al cargar los contactos.` }
    return { status: "ready", leads: (await res.json()) as Lead[] }
  }, [])

  useEffect(() => {
    let cancelled = false
    void load().then((next) => {
      if (!cancelled) setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [load])

  const reload = async () => setState(await load())

  if (state.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }
  if (state.status === "login") return <Login onSuccess={reload} />
  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-medium text-danger">{state.message}</p>
        <Button className="mt-4" onClick={() => void reload()}>
          Reintentar
        </Button>
      </div>
    )
  }
  return (
    <Dashboard
      leads={state.leads}
      onReload={reload}
      onLogout={async () => {
        await fetch("/api/admin/session", { method: "DELETE" })
        setState({ status: "login" })
      }}
      onDeleted={(id) => setState({ status: "ready", leads: state.leads.filter((l) => l.id !== id) })}
    />
  )
}

function Login({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const password = new FormData(event.currentTarget).get("password")
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null)
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? "No se pudo iniciar sesión.")
      setPending(false)
      return
    }
    await onSuccess()
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-xl shadow-primary/5">
        <PikoleteBadge className="size-12" />
        <h1 className="mt-4 text-2xl font-extrabold text-primary">Panel de contactos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acceso solo para el equipo de Pikolete.</p>
        <label htmlFor="admin-password" className="mt-6 block text-sm font-medium">
          Contraseña
        </label>
        <Input id="admin-password" name="password" type="password" autoComplete="current-password" required className="mt-1.5" />
        {error && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <Button type="submit" className="mt-5 w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Entrar
        </Button>
      </form>
    </div>
  )
}

const dayKey = (iso: string) => iso.slice(0, 10)
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

function sourceLabel(lead: Lead): string {
  if (lead.source?.utmSource) return lead.source.utmSource
  if (lead.source?.referrer) {
    try {
      return new URL(lead.source.referrer).hostname.replace(/^www\./, "")
    } catch {
      return lead.source.referrer
    }
  }
  return "directo"
}

function hostOf(url?: string) {
  if (!url) return ""
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function Dashboard({
  leads,
  onReload,
  onLogout,
  onDeleted,
}: {
  leads: Lead[]
  onReload: () => Promise<void>
  onLogout: () => Promise<void>
  onDeleted: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<"all" | "report" | "quote">("all")
  const [onlyMarketing, setOnlyMarketing] = useState(false)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  // Momento de referencia para "últimos 7/14 días"; se fija al montar el panel.
  const [now] = useState(() => Date.now())

  const stats = useMemo(() => {
    const emails = new Set(leads.map((l) => l.email))
    const weekAgo = now - 7 * 864e5
    const scores = leads.map((l) => l.score).filter((s): s is number => typeof s === "number")
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now - (13 - i) * 864e5)
      const key = d.toISOString().slice(0, 10)
      return { key, label: d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }), count: 0 }
    })
    for (const lead of leads) {
      const day = days.find((d) => d.key === dayKey(lead.createdAt))
      if (day) day.count += 1
    }
    const tally = (values: string[]) =>
      Object.entries(values.reduce<Record<string, number>>((acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }), {}))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    return {
      contacts: emails.size,
      lastWeek: leads.filter((l) => new Date(l.createdAt).getTime() > weekAgo).length,
      optIn: leads.length ? Math.round((leads.filter((l) => l.marketingOptIn).length / leads.length) * 100) : 0,
      quotes: leads.filter((l) => l.type === "quote").length,
      avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      days,
      maxDay: Math.max(1, ...days.map((d) => d.count)),
      profiles: tally(leads.map((l) => PROFILE_LABEL[l.profile ?? ""] ?? "Sin indicar")),
      sources: tally(leads.map(sourceLabel)),
      countries: tally(leads.map((l) => l.country ?? "—")),
    }
  }, [leads, now])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter(
      (l) =>
        (type === "all" || l.type === type) &&
        (!onlyMarketing || l.marketingOptIn) &&
        (!q || [l.email, l.name, l.company, l.auditedUrl, l.phone].some((v) => v?.toLowerCase().includes(q)))
    )
  }, [leads, query, type, onlyMarketing])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-badge-foreground uppercase">Comisaría central</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Panel de contactos</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              setRefreshing(true)
              await onReload()
              setRefreshing(false)
            }}
          >
            <RefreshCw className={cn(refreshing && "animate-spin")} /> Actualizar
          </Button>
          <Button asChild variant="outline">
            <a href="/api/admin/leads">
              <Download /> Exportar CSV
            </a>
          </Button>
          <Button variant="ghost" onClick={() => void onLogout()}>
            <LogOut /> Salir
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi icon={Users} label="Contactos únicos" value={stats.contacts} />
        <Kpi icon={CalendarDays} label="Últimos 7 días" value={stats.lastWeek} />
        <Kpi icon={MailCheck} label="Aceptan marketing" value={`${stats.optIn}%`} />
        <Kpi icon={Wrench} label="Presupuestos" value={stats.quotes} />
        <Kpi icon={Search} label="Nota media webs" value={stats.avgScore ?? "—"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Panel title="Contactos por día (14 días)">
          <div className="flex h-32 items-end gap-1" role="img" aria-label="Contactos por día">
            {stats.days.map((d) => (
              <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="rounded-t bg-primary transition-colors group-hover:bg-badge"
                  style={{ height: `${(d.count / stats.maxDay) * 100}%`, minHeight: d.count ? 4 : 1 }}
                />
                <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] whitespace-nowrap text-background group-hover:block">
                  {d.label}: {d.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{stats.days[0].label}</span>
            <span>Hoy</span>
          </div>
        </Panel>
        <Panel title="Perfil">
          <Tally rows={stats.profiles} total={leads.length} />
        </Panel>
        <Panel title="Origen">
          <Tally rows={stats.sources} total={leads.length} />
        </Panel>
        <Panel title="País">
          <Tally rows={stats.countries} total={leads.length} />
        </Panel>
      </div>

      <div className="mt-8 rounded-2xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por email, nombre, empresa o web…"
              className="pl-9"
              aria-label="Buscar contactos"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "Todos"],
                ["report", "Informe"],
                ["quote", "Presupuesto"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={type === value}
                onClick={() => setType(value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium",
                  type === value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {label}
              </button>
            ))}
            <label className="ml-1 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyMarketing}
                onChange={(e) => setOnlyMarketing(e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Solo aceptan marketing
            </label>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {leads.length === 0 ? "Aún no hay contactos. ¡Comparte pikolete.com!" : "Ningún contacto coincide con el filtro."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/60 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Web auditada</th>
                  <th className="px-4 py-3 font-semibold">Nota</th>
                  <th className="px-4 py-3 font-semibold">Marketing</th>
                  <th className="px-4 py-3 font-semibold">Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className="cursor-pointer transition-colors hover:bg-secondary/60"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{lead.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {[lead.name, lead.company].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          lead.type === "quote" ? "bg-badge/25 text-badge-foreground" : "bg-secondary text-primary"
                        )}
                      >
                        {lead.type === "quote" ? "Presupuesto" : "Informe"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{hostOf(lead.auditedUrl) || "—"}</td>
                    <td className="px-4 py-3">
                      {typeof lead.score === "number" ? <ScorePill score={lead.score} /> : "—"}
                    </td>
                    <td className="px-4 py-3">{lead.marketingOptIn ? <MailCheck className="size-4 text-success" /> : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sourceLabel(lead)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">
          {filtered.length} de {leads.length} registros
        </p>
      </div>

      <LeadDetail lead={selected} onClose={() => setSelected(null)} onDeleted={onDeleted} />
    </div>
  )
}

function Kpi({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Tally({ rows, total }: { rows: Array<[string, number]>; total: number }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sin datos</p>
  return (
    <ul className="space-y-2">
      {rows.map(([label, count]) => (
        <li key={label}>
          <div className="flex justify-between text-xs">
            <span className="truncate pr-2">{label}</span>
            <span className="font-semibold tabular-nums">{count}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(count / total) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ScorePill({ score }: { score: number }) {
  const tone = score >= 80 ? "bg-success/15 text-success" : score >= 50 ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger"
  return <span className={cn("rounded-md px-2 py-0.5 font-mono text-xs font-bold", tone)}>{score}</span>
}

function LeadDetail({ lead, onClose, onDeleted }: { lead: Lead | null; onClose: () => void; onDeleted: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function remove() {
    if (!lead) return
    setDeleting(true)
    const res = await fetch(`/api/admin/leads?id=${lead.id}`, { method: "DELETE", headers: PANEL_HEADERS })
    setDeleting(false)
    setConfirming(false)
    if (res.ok) {
      onDeleted(lead.id)
      onClose()
    }
  }

  const rows: Array<[string, React.ReactNode]> = lead
    ? [
        ["Fecha", new Date(lead.createdAt).toLocaleString("es-ES")],
        ["Tipo", lead.type === "quote" ? "Solicitud de presupuesto" : "Desbloqueo de informe"],
        ["Nombre", lead.name],
        ["Empresa", lead.company],
        ["Teléfono", lead.phone && <a className="text-primary underline" href={`tel:${lead.phone}`}>{lead.phone}</a>],
        ["Perfil", PROFILE_LABEL[lead.profile ?? ""]],
        [
          "Web auditada",
          lead.auditedUrl && (
            <a className="inline-flex items-center gap-1 text-primary underline" href={lead.auditedUrl} target="_blank" rel="noreferrer">
              {hostOf(lead.auditedUrl)} <ExternalLink className="size-3" />
            </a>
          ),
        ],
        ["Nota", typeof lead.score === "number" ? `${lead.score}/100 (${lead.grade ?? "?"})` : undefined],
        ["Fallos", lead.fails !== undefined ? `${lead.fails} infracciones · ${lead.warns ?? 0} advertencias` : undefined],
        ["Mensaje", lead.message],
        ["Marketing", lead.marketingOptIn ? "Acepta recibir ofertas" : "No acepta"],
        ["Ubicación", [lead.city, lead.country].filter(Boolean).join(", ")],
        ["Idioma / dispositivo", [lead.language, lead.device].filter(Boolean).join(" · ")],
        ["Origen", sourceLabel(lead)],
        ["Campaña", [lead.source?.utmMedium, lead.source?.utmCampaign].filter(Boolean).join(" · ")],
        ["Página de entrada", lead.source?.landingPath],
      ]
    : []

  return (
    <Dialog
      open={lead !== null}
      onOpenChange={(open) => {
        if (!open) {
          setConfirming(false)
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {lead && (
          <>
            <DialogHeader>
              <DialogTitle className="break-all">{lead.email}</DialogTitle>
              <DialogDescription>Ficha del contacto</DialogDescription>
            </DialogHeader>
            <dl className="divide-y text-sm">
              {rows
                .filter(([, v]) => v !== undefined && v !== null && v !== "")
                .map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[130px_1fr] gap-3 py-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="break-words">{value}</dd>
                  </div>
                ))}
            </dl>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
              {confirming ? (
                <Button variant="destructive" onClick={() => void remove()} disabled={deleting}>
                  {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Confirmar borrado
                </Button>
              ) : (
                <Button variant="ghost" className="text-danger hover:text-danger" onClick={() => setConfirming(true)}>
                  <Trash2 /> Borrar (RGPD)
                </Button>
              )}
              <Button asChild>
                <a href={`mailto:${lead.email}?subject=${encodeURIComponent("Tu informe de Pikolete")}`}>
                  <Mail /> Escribir email
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
