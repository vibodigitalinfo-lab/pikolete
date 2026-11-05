import type { Metadata } from "next"
import Link from "next/link"

import { GUIDES, guideTopic, type GuideTopic } from "@/content/guides"
import { baseOpenGraph } from "@/lib/seo"

const TITLE = "Guías para comprar online y mejorar tu web"
const DESCRIPTION =
  "Cómo detectar tiendas falsas, reclamar una devolución o elegir la forma de pago más segura, y cómo mejorar el SEO, la velocidad y la seguridad de tu web. Guías claras y gratuitas."

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Pikolete` },
  description: DESCRIPTION,
  alternates: { canonical: "/guias" },
  openGraph: { ...baseOpenGraph, title: TITLE, description: DESCRIPTION, url: "/guias" },
}

const SECTIONS: Array<{ topic: GuideTopic; title: string; intro: string }> = [
  {
    topic: "compras",
    title: "Para comprar online sin sustos",
    intro: "Tiendas falsas, devoluciones, formas de pago y qué hacer si algo sale mal.",
  },
  {
    topic: "web",
    title: "Para mejorar tu web",
    intro: "SEO, velocidad y seguridad explicados sin tecnicismos para pequeños negocios.",
  },
]

export default function GuiasPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 pt-10 pb-24">
      <p className="text-sm font-bold tracking-[0.2em] text-badge-foreground uppercase">Guías</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-balance text-primary sm:text-5xl">{TITLE}</h1>
      <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">{DESCRIPTION}</p>
      {SECTIONS.map(({ topic, title, intro }) => (
        <div key={topic} className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-primary">{title}</h2>
          <p className="mt-1 text-muted-foreground">{intro}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {GUIDES.filter((g) => guideTopic(g) === topic).map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guias/${g.slug}`}
                  className="block h-full rounded-2xl border bg-card p-6 transition-colors hover:border-primary"
                >
                  <h3 className="text-lg font-bold text-primary">{g.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
