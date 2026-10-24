"use client"

import { useState, type FormEvent } from "react"
import { CircleCheck, FileDown, Loader2, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AuditResult } from "@/lib/audit/types"
import { downloadReportPdf } from "@/lib/pdf"

export function EmailCapture({ result }: { result: AuditResult }) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState("sending")
    setError(null)
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "report", email, url: result.finalUrl, score: result.score }),
    }).catch(() => null)
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? "No pudimos guardar tu email. Inténtalo de nuevo.")
      setState("idle")
      return
    }
    setState("done")
    await downloadReportPdf(result)
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-2">
        <Mail className="size-5 text-primary" />
        <h2 className="font-bold">Recibe el informe básico gratis</h2>
      </div>
      {state === "done" ? (
        <div className="mt-3 space-y-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-success">
            <CircleCheck className="size-4" /> ¡Apuntado! Tu informe se ha descargado.
          </p>
          <Button variant="outline" size="sm" onClick={() => void downloadReportPdf(result)}>
            <FileDown /> Descargar de nuevo
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            Déjanos tu email y descarga el resumen en PDF para revisarlo con calma.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="lead-email" className="sr-only">
              Email
            </label>
            <Input
              id="lead-email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={state === "sending"}>
              {state === "sending" ? <Loader2 className="animate-spin" /> : <FileDown />}
              Enviar informe
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
