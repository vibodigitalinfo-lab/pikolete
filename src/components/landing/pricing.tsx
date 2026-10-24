import Link from "next/link"
import { Check, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"

const PLANS = [
  {
    name: "Inspección express",
    price: "Gratis",
    note: "sin registro",
    features: ["Nota de 0 a 100", "Todas las infracciones con diagnóstico", "Las 3 soluciones más urgentes"],
    featured: false,
  },
  {
    name: "Informe completo",
    price: "Gratis",
    note: "solo con tu email",
    features: [
      "Todo lo de la inspección express",
      "Guía de solución paso a paso de cada fallo",
      "Código listo para copiar y pegar",
      "Informe PDF oficial descargable",
    ],
    featured: true,
  },
]

export function Pricing() {
  return (
    <section id="precios" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">Gratis. De verdad.</h2>
        <p className="mt-3 text-muted-foreground">
          Sin tarjeta y sin letra pequeña. Para el informe completo solo te pedimos tu email.
        </p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-card p-7 shadow-sm",
              plan.featured && "border-primary ring-2 ring-primary"
            )}
          >
            {plan.featured && (
              <span className="absolute -top-3 left-7 rounded-full bg-badge px-3 py-1 text-xs font-bold text-badge-foreground">
                El más completo
              </span>
            )}
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="mt-3">
              <span className="text-4xl font-extrabold text-primary">{plan.price}</span>{" "}
              <span className="text-sm text-muted-foreground">{plan.note}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-7" variant={plan.featured ? "default" : "outline"} size="lg">
              <Link href="/#inspeccion">Inspeccionar mi web</Link>
            </Button>
          </article>
        ))}
        <article className="flex flex-col rounded-2xl bg-primary p-7 text-primary-foreground shadow-sm">
          <Wrench className="size-8 text-badge" />
          <h3 className="mt-4 text-lg font-bold">Lo arreglamos por ti</h3>
          <p className="mt-3 text-4xl font-extrabold">A medida</p>
          <p className="mt-4 flex-1 text-sm text-primary-foreground/75">
            ¿Sin tiempo para tocar código? El equipo de Pikolete corrige todas las infracciones de tu informe y te
            devuelve la web en regla.
          </p>
          <Button asChild size="lg" className="mt-7 bg-badge font-bold text-badge-foreground hover:bg-badge/90">
            <a href={`mailto:${siteConfig.quoteEmail}?subject=${encodeURIComponent("Presupuesto Pikolete")}`}>
              Solicitar presupuesto
            </a>
          </Button>
        </article>
      </div>
    </section>
  )
}
