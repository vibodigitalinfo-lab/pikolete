import type { Metadata } from "next"
import Link from "next/link"

import { GUIDES } from "@/content/guides"
import { baseOpenGraph } from "@/lib/seo"

const TITLE = "Guías para comprar online sin sustos"
const DESCRIPTION =
  "Cómo detectar tiendas falsas, qué hacer si te han estafado, cómo reclamar una devolución y qué forma de pago te protege más. Guías claras y gratuitas."

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Pikolete` },
  description: DESCRIPTION,
  alternates: { canonical: "/guias" },
  openGraph: { ...baseOpenGraph, title: TITLE, description: DESCRIPTION, url: "/guias" },
}

export default function GuiasPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 pt-10 pb-24">
      <p className="text-sm font-bold tracking-[0.2em] text-badge-foreground uppercase">Guías</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-balance text-primary sm:text-5xl">{TITLE}</h1>
      <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">{DESCRIPTION}</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guias/${g.slug}`}
              className="block h-full rounded-2xl border bg-card p-6 transition-colors hover:border-primary"
            >
              <h2 className="text-lg font-bold text-primary">{g.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
