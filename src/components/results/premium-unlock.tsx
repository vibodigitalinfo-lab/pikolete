"use client"

import { forwardRef, useState } from "react"
import { FileText, Loader2, Lock, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { hostKey, paymentUrl, siteConfig } from "@/lib/config"

interface PremiumUnlockProps {
  url: string
  lockedCount: number
  onDemoUnlocked: () => void
}

/** Tarjeta de conversión: Stripe Payment Link, o desbloqueo de demo si no hay Stripe configurado. */
export const PremiumUnlock = forwardRef<HTMLDivElement, PremiumUnlockProps>(function PremiumUnlock(
  { url, lockedCount, onDemoUnlocked },
  ref
) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checkoutUrl = paymentUrl(hostKey(url))

  async function demoUnlock() {
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/unlock/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "No disponible")
      onDemoUnlocked()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      ref={ref}
      className="scroll-mt-24 overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20"
    >
      <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold tracking-wider text-badge uppercase">
            <Lock className="size-4" /> {lockedCount} soluciones bloqueadas
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-balance">
            Desbloquea la guía de solución en código/paso a paso y el informe PDF oficial por {siteConfig.price}
          </h2>
          <ul className="mt-4 grid gap-2 text-sm text-primary-foreground/80 sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <Sparkles className="size-4 text-badge" /> Código listo para copiar y pegar
            </li>
            <li className="flex items-center gap-2">
              <FileText className="size-4 text-badge" /> PDF oficial para tu equipo
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-stretch gap-2 md:min-w-56">
          {checkoutUrl ? (
            <Button asChild size="lg" className="h-12 bg-badge text-base font-bold text-badge-foreground hover:bg-badge/90">
              <a href={checkoutUrl}>Desbloquear por {siteConfig.price}</a>
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={demoUnlock}
              disabled={pending}
              className="h-12 bg-badge text-base font-bold text-badge-foreground hover:bg-badge/90"
            >
              {pending && <Loader2 className="animate-spin" />}
              Desbloquear (modo demo)
            </Button>
          )}
          <p className="text-center text-xs text-primary-foreground/60">
            {checkoutUrl ? "Pago seguro con Stripe · pago único" : "Stripe no configurado: desbloqueo de prueba"}
          </p>
          {error && <p className="text-center text-xs font-semibold text-badge">{error}</p>}
        </div>
      </div>
    </div>
  )
})
