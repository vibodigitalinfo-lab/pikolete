import { ChevronDown } from "lucide-react"

import { siteConfig } from "@/lib/config"

export const FAQS = [
  {
    q: "¿Necesito instalar algo o dar acceso a mi web?",
    a: "No. Pikolete solo visita tu página pública, igual que haría Google o cualquier visitante. No tocamos nada.",
  },
  {
    q: "¿De verdad es gratis?",
    a: "Sí. La inspección es gratis y sin registro. Para ver todas las soluciones y descargar el PDF oficial solo te pedimos tu email: no hay tarjeta ni pagos.",
  },
  {
    q: "¿Qué hacéis con mis datos?",
    a: `Los usamos para darte acceso al informe y, si lo pides, prepararte un presupuesto. Solo te enviamos ofertas si marcas la casilla. No los vendemos ni los cedemos, y puedes pedir que los borremos escribiendo a ${siteConfig.quoteEmail}.`,
  },
  {
    q: "¿Sustituye a una auditoría SEO completa?",
    a: "Es una inspección express de la página que indicas: detecta los fallos más habituales y con más impacto. Para auditorías profundas de todo el sitio, solicita presupuesto.",
  },
  {
    q: "¿Cómo se calcula la nota?",
    a: "Cada control tiene un peso según su impacto. Un control superado suma su peso completo, una advertencia la mitad y una infracción grave nada. La nota final va de 0 a 100.",
  },
]

export function Faq() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-24">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-primary">Preguntas frecuentes</h2>
      <div className="mt-10 divide-y rounded-2xl border bg-card">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {q}
              <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
