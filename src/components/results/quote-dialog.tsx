"use client"

import { useState, type FormEvent } from "react"
import { CircleCheck, Loader2, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { readVisitSource } from "@/components/site/source-tracker"
import { HoneypotField, Turnstile, turnstileToken } from "@/components/site/turnstile"
import Link from "next/link"
import type { AuditResult } from "@/lib/audit/types"
import { siteConfig } from "@/lib/config"

export function QuoteCta({ result }: { result: AuditResult }) {
  const issues = result.checks.filter((c) => c.status !== "pass").length
  const [state, setState] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setState("sending")
    setError(null)
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "quote",
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        company: form.get("company"),
        message: form.get("message"),
        privacyAccepted: form.get("privacy") === "on",
        marketingOptIn: form.get("marketing") === "on",
        profile: "looking",
        auditedUrl: result.finalUrl,
        score: result.score,
        grade: result.grade,
        source: readVisitSource(),
        website: form.get("website"),
        turnstileToken: turnstileToken(form),
      }),
    }).catch(() => null)
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? "No pudimos enviar la solicitud.")
      setState("idle")
      setAttempt((n) => n + 1)
      return
    }
    setState("done")
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/60 p-6 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-badge">
        <Wrench className="size-6" />
      </span>
      <div className="flex-1">
        <h2 className="text-lg font-bold">¿Quieres que el equipo de Pikolete corrija estas fallas por ti?</h2>
        <p className="text-sm text-muted-foreground">
          Arreglamos las {issues} incidencias detectadas y te devolvemos la web en regla.
        </p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button size="lg" className="font-bold">
            Solicitar Presupuesto
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar presupuesto</DialogTitle>
            <DialogDescription>
              Te respondemos en menos de 24 h laborables con una propuesta para {new URL(result.finalUrl).hostname}.
            </DialogDescription>
          </DialogHeader>
          {state === "done" ? (
            <p className="flex items-center gap-2 py-6 font-medium text-success">
              <CircleCheck className="size-5" /> ¡Recibido! El equipo de Pikolete te escribirá muy pronto.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="quote-name">Nombre</Label>
                <Input id="quote-name" name="name" autoComplete="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quote-email">Email</Label>
                <Input id="quote-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="quote-phone">Teléfono (opcional)</Label>
                  <Input id="quote-phone" name="phone" type="tel" autoComplete="tel" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-company">Empresa (opcional)</Label>
                  <Input id="quote-company" name="company" autoComplete="organization" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quote-message">¿Algo que debamos saber? (opcional)</Label>
                <Textarea id="quote-message" name="message" rows={3} placeholder="CMS, plazos, presupuesto aproximado…" />
              </div>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" name="privacy" required className="mt-0.5 size-4 accent-[var(--primary)]" />
                <span>
                  Acepto la{" "}
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
              <Turnstile key={attempt} action="quote" />
              {error && (
                <p role="alert" className="text-sm font-medium text-danger">
                  {error}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <a href={`mailto:${siteConfig.quoteEmail}`} className="text-sm text-muted-foreground hover:text-foreground">
                  o escríbenos a {siteConfig.quoteEmail}
                </a>
                <Button type="submit" disabled={state === "sending"}>
                  {state === "sending" && <Loader2 className="animate-spin" />}
                  Enviar solicitud
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
