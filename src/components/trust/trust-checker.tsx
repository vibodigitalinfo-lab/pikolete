"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { AlertTriangle, CheckCircle2, Globe, HelpCircle, Loader2, Search, ShieldAlert, ShieldCheck, XCircle } from "lucide-react"

import { AdSlot } from "@/components/site/ad-slot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { siteConfig } from "@/lib/config"
import type { SignalStatus, TrustLevel, TrustResult } from "@/lib/trust/types"
import { cn } from "@/lib/utils"

const DOMAIN_RE = /^(https?:\/\/)?[^\s/$.?#]+\.[^\s]{2,}$/i

const LEVELS: Record<TrustLevel, { title: string; text: string; tone: string; Icon: typeof ShieldCheck }> = {
  fiable: {
    title: "Pinta fiable",
    text: "Las señales que hemos revisado son buenas. Aun así, paga siempre con un método que te proteja.",
    tone: "text-success border-success/40 bg-success/10",
    Icon: ShieldCheck,
  },
  precaucion: {
    title: "Ve con cuidado",
    text: "Hay señales que no nos convencen. Busca opiniones de otros compradores antes de pagar.",
    tone: "text-warning border-warning/40 bg-warning/10",
    Icon: AlertTriangle,
  },
  riesgo: {
    title: "Señales de riesgo",
    text: "Esta web tiene varias señales típicas de webs fraudulentas. Nosotros no compraríamos aquí.",
    tone: "text-danger border-danger/40 bg-danger/10",
    Icon: ShieldAlert,
  },
  incompleto: {
    title: "No hemos podido revisarla a fondo",
    text: "La web no deja que la leamos entera. En lo que sí hemos visto no hay señales graves, pero revisa tú el aviso legal y las opiniones antes de pagar.",
    tone: "text-primary border-border bg-card",
    Icon: HelpCircle,
  },
}

const STATUS_ICON: Record<SignalStatus, { Icon: typeof CheckCircle2; className: string; label: string }> = {
  good: { Icon: CheckCircle2, className: "text-success", label: "Bien" },
  warn: { Icon: AlertTriangle, className: "text-warning", label: "Atención" },
  bad: { Icon: XCircle, className: "text-danger", label: "Mal" },
  unknown: { Icon: HelpCircle, className: "text-muted-foreground", label: "Sin datos" },
}

const ORDER: Record<SignalStatus, number> = { bad: 0, warn: 1, unknown: 2, good: 3 }

export function TrustChecker() {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<TrustResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  async function check(value: string) {
    setError(null)
    setPending(true)
    setResult(null)
    try {
      const res = await fetch("/api/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      })
      const data = (await res.json()) as TrustResult | { error: string }
      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "No pudimos comprobar esta web.")
        return
      }
      setResult(data)
      window.history.replaceState(null, "", `?url=${encodeURIComponent(value)}`)
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
    } catch {
      setError("No pudimos conectar con Pikolete. Revisa tu conexión e inténtalo de nuevo.")
    } finally {
      setPending(false)
    }
  }

  // Permite compartir el enlace: /es-fiable?url=tienda.com lanza la comprobación al entrar.
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("url")
    if (!shared || !DOMAIN_RE.test(shared.trim())) return
    const timer = setTimeout(() => {
      setUrl(shared)
      void check(shared.trim())
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = url.trim()
    if (!DOMAIN_RE.test(value)) {
      setError("Pega una dirección válida, por ejemplo tienda.com")
      return
    }
    void check(value)
  }

  const level = result ? LEVELS[result.level] : null
  const signals = result ? [...result.signals].sort((a, b) => ORDER[a.status] - ORDER[b.status]) : []

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} noValidate className="max-w-2xl">
        <div
          className={cn(
            "flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-lg shadow-primary/5 sm:flex-row sm:items-center",
            error && "border-danger/60"
          )}
        >
          <label htmlFor="trust-url" className="sr-only">
            Dirección de la web o tienda
          </label>
          <div className="relative flex-1">
            <Globe className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="trust-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="Pega aquí la web o tienda: tienda.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "trust-url-error" : undefined}
              className="h-12 border-0 bg-transparent pl-10 text-base shadow-none focus-visible:ring-0 md:text-lg"
            />
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="h-12 rounded-xl bg-badge px-6 text-base font-bold text-badge-foreground hover:bg-badge/90"
          >
            {pending ? <Loader2 className="animate-spin" /> : <Search />}
            ¿Es fiable?
          </Button>
        </div>
        {error && (
          <p id="trust-url-error" role="alert" className="mt-2 px-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        {pending && (
          <p className="mt-3 px-2 text-sm text-muted-foreground" aria-live="polite">
            Pikolete está mirando la web, el dominio y sus datos legales…
          </p>
        )}
      </form>

      {result && level && (
        <div ref={resultRef} className="mt-10 scroll-mt-24 space-y-6" aria-live="polite">
          <div className={cn("flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center", level.tone)}>
            <level.Icon className="size-12 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold tracking-wide uppercase opacity-80">{result.host}</p>
              <h2 className="text-2xl font-extrabold">{level.title}</h2>
              <p className="mt-1 text-foreground/80">{level.text}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-extrabold">{result.level === "incompleto" ? "?" : result.score}</p>
              <p className="text-xs font-semibold uppercase opacity-80">de 100</p>
            </div>
          </div>

          <AdSlot slot={siteConfig.adsense.slots.results} />

          <ul className="divide-y rounded-2xl border bg-card">
            {signals.map((s) => {
              const icon = STATUS_ICON[s.status]
              return (
                <li key={s.id} className="flex gap-3 px-5 py-4">
                  <icon.Icon className={cn("mt-0.5 size-5 shrink-0", icon.className)} aria-label={icon.label} />
                  <div>
                    <p className="font-semibold">{s.label}</p>
                    <p className="text-sm text-muted-foreground">{s.detail}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          <p className="text-xs text-muted-foreground">
            Resultado automático basado en señales públicas, no una acusación ni una garantía. Una web puede tener buena
            nota y aun así fallar, o al revés. Ante la duda, paga con tarjeta o PayPal y busca opiniones de otros
            compradores.
          </p>
        </div>
      )}
    </div>
  )
}
