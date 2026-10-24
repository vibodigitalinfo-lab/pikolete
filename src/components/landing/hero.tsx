import { BadgeCheck, Clock, Lock } from "lucide-react"

import { PikoleteMascot } from "@/components/brand/pikolete-logo"
import { InspectForm } from "@/components/landing/inspect-form"
import { TicketPreview } from "@/components/landing/ticket-preview"
import { siteConfig } from "@/lib/config"

export function Hero() {
  return (
    <section id="inspeccion" className="relative overflow-hidden scroll-mt-20">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-badge/50 bg-badge/15 px-3 py-1 text-sm font-semibold text-badge-foreground">
            <PikoleteMascot className="-my-2 size-7" />
            El agente Pikolete está de servicio
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-balance text-primary sm:text-5xl lg:text-6xl">
            Inspecciona tu sitio web antes de que lo haga tu competencia
          </h1>
          <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
            En menos de 15 segundos revisamos tu SEO, velocidad, certificado SSL y estructura.
            Te ponemos la multa con un diagnóstico claro… y te decimos cómo librarte de ella.
          </p>
          <InspectForm className="mt-8 max-w-2xl" />
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-success" /> 100% gratis
            </li>
            <li className="flex items-center gap-1.5">
              <Clock className="size-4 text-primary" /> Resultado en segundos
            </li>
            <li className="flex items-center gap-1.5">
              <Lock className="size-4 text-primary" /> Solo leemos tu web pública
            </li>
          </ul>
        </div>
        <TicketPreview auditedCount={siteConfig.auditedCount} />
      </div>
    </section>
  )
}
