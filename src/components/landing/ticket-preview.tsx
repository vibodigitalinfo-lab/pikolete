import { CircleAlert, CircleX, TriangleAlert } from "lucide-react"

import { PikoleteMascot } from "@/components/brand/pikolete-logo"

const SAMPLE = [
  { icon: CircleX, tone: "text-danger", label: "Sin meta description" },
  { icon: TriangleAlert, tone: "text-warning", label: "3 imágenes sin atributo alt" },
  { icon: CircleAlert, tone: "text-warning", label: "Servidor lento: 1.240 ms" },
]

/** Ejemplo visual de una "multa" para el hero. */
export function TicketPreview({ auditedCount }: { auditedCount: string }) {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <PikoleteMascot className="absolute -top-16 -right-2 z-10 size-28 rotate-6 drop-shadow-md" />
      <div className="rotate-[-2deg] rounded-2xl bg-card shadow-2xl shadow-primary/15 ring-1 ring-border">
        <div className="rounded-t-2xl bg-primary px-5 py-4 text-primary-foreground">
          <p className="text-xs font-semibold tracking-[0.25em] text-badge uppercase">Boletín de denuncia</p>
          <p className="mt-1 font-mono text-sm opacity-80">Nº PK-7Q2X9M · miweb.com</p>
        </div>
        <div className="flex items-center gap-4 px-5 pt-5">
          <div className="relative grid size-20 place-items-center rounded-full border-[6px] border-warning/80">
            <span className="text-2xl font-black text-foreground">62</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nota de inspección</p>
            <p className="text-lg font-bold">Necesita mejoras</p>
          </div>
        </div>
        <ul className="space-y-2.5 px-5 py-5">
          {SAMPLE.map(({ icon: Icon, tone, label }) => (
            <li key={label} className="flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium">
              <Icon className={`size-4 shrink-0 ${tone}`} />
              {label}
            </li>
          ))}
          <li className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground blur-[3px]">
            Solución paso a paso bloqueada
          </li>
        </ul>
        <div className="flex items-center justify-between border-t border-dashed px-5 py-3 text-xs text-muted-foreground">
          <span>{auditedCount} webs auditadas</span>
          <span className="rounded border-2 border-danger px-1.5 py-0.5 font-black tracking-wider text-danger uppercase -rotate-6">
            Multado
          </span>
        </div>
      </div>
    </div>
  )
}
