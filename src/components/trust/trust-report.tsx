import type { ReactNode } from "react"
import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert, ShieldCheck, XCircle } from "lucide-react"

import type { SignalStatus, TrustLevel, TrustResult } from "@/lib/trust/types"
import { cn } from "@/lib/utils"

export const LEVELS: Record<TrustLevel, { title: string; text: string; tone: string; Icon: typeof ShieldCheck }> = {
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

/** Resultado de una comprobación: veredicto, señales y aviso. Sirve tanto en el comprobador como en las páginas de dominio. */
export function TrustReport({ result, ad }: { result: TrustResult; ad?: ReactNode }) {
  const level = LEVELS[result.level]
  const signals = [...result.signals].sort((a, b) => ORDER[a.status] - ORDER[b.status])

  return (
    <div className="space-y-6">
      <div className={cn("flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center", level.tone)}>
        <level.Icon className="size-12 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold tracking-wide uppercase opacity-80">{result.host}</p>
          <p className="text-2xl font-extrabold">{level.title}</p>
          <p className="mt-1 text-foreground/80">{level.text}</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-extrabold">{result.level === "incompleto" ? "?" : result.score}</p>
          <p className="text-xs font-semibold uppercase opacity-80">de 100</p>
        </div>
      </div>

      {ad}

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
        Resultado automático basado en señales públicas, no una acusación ni una garantía. Una web puede tener buena nota
        y aun así fallar, o al revés. Ante la duda, paga con tarjeta o PayPal y busca opiniones de otros compradores.
      </p>
    </div>
  )
}
