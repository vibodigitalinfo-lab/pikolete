import type { Metadata } from "next"
import Link from "next/link"

import { TrustChecker } from "@/components/trust/trust-checker"
import { siteConfig } from "@/lib/config"
import { baseOpenGraph, jsonLd } from "@/lib/seo"
import { publishedPopularStores } from "@/lib/trust/report"

const TITLE = "¿Son fiables estas tiendas online? Las más populares en España"
const DESCRIPTION =
  "Revisamos las tiendas online más usadas en España: antigüedad del dominio, aviso legal, CIF, contacto, devoluciones y formas de pago. Consulta la ficha de cada una."

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Pikolete` },
  description: DESCRIPTION,
  alternates: { canonical: "/es-fiable/tiendas" },
  openGraph: { ...baseOpenGraph, title: TITLE, description: DESCRIPTION, url: "/es-fiable/tiendas" },
}

export default async function TiendasPage() {
  const groups = await publishedPopularStores()

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: TITLE,
    itemListElement: groups
      .flatMap((g) => g.domains)
      .map((d, i) => ({ "@type": "ListItem", position: i + 1, url: `${siteConfig.url}/es-fiable/${d}`, name: d })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <section className="mx-auto w-full max-w-4xl px-4 pt-10 pb-12">
        <nav aria-label="Migas de pan" className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>{" "}
          ›{" "}
          <Link href="/es-fiable" className="hover:text-foreground">
            ¿Es fiable esta web?
          </Link>{" "}
          › <span className="text-foreground">Tiendas populares</span>
        </nav>
        <h1 className="text-4xl font-extrabold tracking-tight text-balance text-primary sm:text-5xl">
          ¿Son fiables estas tiendas online?
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">
          Hemos pasado por Pikolete las tiendas más usadas en España. Entra en cada una para ver qué señales tiene y desde
          cuándo existe. ¿No está la que buscas? Compruébala tú abajo.
        </p>
      </section>

      <section className="mx-auto w-full max-w-4xl space-y-10 px-4 pb-16">
        {groups.map((g) => (
          <div key={g.category}>
            <h2 className="text-2xl font-extrabold tracking-tight text-primary">{g.category}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {g.domains.map((d) => (
                <li key={d}>
                  <Link
                    href={`/es-fiable/${d}`}
                    className="inline-block rounded-full border bg-card px-3 py-1 text-sm hover:border-primary hover:text-primary"
                  >
                    ¿Es fiable {d}?
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-24">
        <h2 className="text-2xl font-extrabold tracking-tight text-primary">Comprueba otra tienda</h2>
        <div className="mt-6">
          <TrustChecker />
        </div>
      </section>
    </>
  )
}
