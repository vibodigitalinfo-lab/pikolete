"use client"

import { forwardRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { FileText, Gift, Loader2, Lock, Sparkles } from "lucide-react"

import { readVisitSource } from "@/components/site/source-tracker"
import { HoneypotField, Turnstile, turnstileToken } from "@/components/site/turnstile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AuditResult } from "@/lib/audit/types"
import { cn } from "@/lib/utils"

const PROFILES = [
  { value: "owner", label: "Es mi web / mi negocio" },
  { value: "agency", label: "Soy agencia o freelance" },
  { value: "looking", label: "Busco quien me la arregle" },
] as const

interface LeadGateProps {
  result: AuditResult
  lockedCount: number
  onUnlocked: () => void
}

/** El "pago" del informe completo: los datos de contacto del cliente, con consentimiento explícito. */
export const LeadGate = forwardRef<HTMLDivElement, LeadGateProps>(function LeadGate(
  { result, lockedCount, onUnlocked },
  ref
) {
  const [profile, setProfile] = useState<(typeof PROFILES)[number]["value"]>("owner")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)
    const fails = result.checks.filter((c) => c.status === "fail").length
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "report",
        email: form.get("email"),
        name: form.get("name"),
        company: form.get("company"),
        profile,
        privacyAccepted: form.get("privacy") === "on",
        marketingOptIn: form.get("marketing") === "on",
        auditedUrl: result.finalUrl,
        score: result.score,
        grade: result.grade,
        fails,
        warns: result.checks.filter((c) => c.status === "warn").length,
        source: readVisitSource(),
        website: form.get("website"),
        turnstileToken: turnstileToken(form),
      }),
    }).catch(() => null)

    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? "No pudimos enviar tus datos. Inténtalo de nuevo.")
      setPending(false)
      setAttempt((n) => n + 1)
      return
    }
    onUnlocked()
  }

  return (
    <div ref={ref} className="scroll-mt-24 overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
      <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold tracking-wider text-badge uppercase">
            <Lock className="size-4" /> {lockedCount > 0 ? `${lockedCount} soluciones bloqueadas` : "Informe oficial"}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-balance">
            Desbloquea gratis el informe completo y el PDF oficial
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/75">
            Sin tarjeta y sin coste. Solo te pedimos tus datos de contacto para enviarte novedades del informe y,
            si quieres, ayudarte a corregir los fallos.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-primary-foreground/85">
            <li className="flex items-center gap-2">
              <Sparkles className="size-4 text-badge" /> Guía paso a paso de cada fallo
            </li>
            <li className="flex items-center gap-2">
              <FileText className="size-4 text-badge" /> Código listo para copiar y PDF oficial
            </li>
            <li className="flex items-center gap-2">
              <Gift className="size-4 text-badge" /> 100% gratis, para siempre
            </li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-card p-5 text-card-foreground">
          <div className="space-y-1.5">
            <Label htmlFor="gate-email">Email *</Label>
            <Input id="gate-email" name="email" type="email" autoComplete="email" required placeholder="tu@empresa.com" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gate-name">Nombre</Label>
              <Input id="gate-name" name="name" autoComplete="given-name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gate-company">Empresa</Label>
              <Input id="gate-company" name="company" autoComplete="organization" />
            </div>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">¿Cuál es tu caso?</legend>
            <div className="flex flex-wrap gap-2">
              {PROFILES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={profile === p.value}
                  onClick={() => setProfile(p.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    profile === p.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="privacy" required className="mt-0.5 size-4 accent-[var(--primary)]" />
            <span>
              He leído y acepto la{" "}
              <Link href="/privacidad" target="_blank" className="font-medium text-primary underline">
                política de privacidad
              </Link>{" "}
              *
            </span>
          </label>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="marketing" className="mt-0.5 size-4 accent-[var(--primary)]" />
            <span>Quiero recibir consejos de SEO y ofertas de Pikolete por email (opcional).</span>
          </label>
          <HoneypotField />
          <Turnstile key={attempt} action="report" />
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="h-11 w-full bg-badge font-bold text-badge-foreground hover:bg-badge/90">
            {pending && <Loader2 className="animate-spin" />}
            Desbloquear informe gratis
          </Button>
        </form>
      </div>
    </div>
  )
})
