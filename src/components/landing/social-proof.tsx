import { FileCheck2, Gauge, ListChecks, Timer } from "lucide-react"

import { siteConfig } from "@/lib/config"

const STATS = [
  { icon: FileCheck2, value: siteConfig.auditedCount, label: "webs auditadas" },
  { icon: ListChecks, value: "26", label: "controles por inspección" },
  { icon: Timer, value: "< 15 s", label: "por informe" },
  { icon: Gauge, value: "0–100", label: "nota ponderada" },
]

const BADGES = ["WordPress", "Shopify", "Wix", "Webflow", "Next.js", "PrestaShop", "Squarespace", "HTML a mano"]

export function SocialProof() {
  return (
    <section className="border-y border-border/60 bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Icon className="size-5" />
              </span>
              <div className="flex flex-col-reverse">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-2xl font-extrabold text-primary">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="mr-2 text-muted-foreground">Inspeccionamos webs hechas con</span>
          {BADGES.map((b) => (
            <span key={b} className="rounded-full border bg-background px-3 py-1 font-medium text-foreground/80">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
