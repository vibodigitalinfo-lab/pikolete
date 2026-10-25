import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { AdSlot } from "@/components/site/ad-slot"
import { TrustChecker } from "@/components/trust/trust-checker"
import { GUIDES, guideBySlug } from "@/content/guides"
import { siteConfig } from "@/lib/config"
import { baseOpenGraph, jsonLd } from "@/lib/seo"

type Props = PageProps<"/guias/[slug]">

export function generateStaticParams() {
  return GUIDES.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = guideBySlug((await params).slug)
  if (!guide) return {}
  return {
    title: { absolute: `${guide.title} · Pikolete` },
    description: guide.description,
    alternates: { canonical: `/guias/${guide.slug}` },
    openGraph: { ...baseOpenGraph, type: "article", title: guide.title, description: guide.description, url: `/guias/${guide.slug}` },
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" })

export default async function GuidePage({ params }: Props) {
  const guide = guideBySlug((await params).slug)
  if (!guide) notFound()

  const url = `${siteConfig.url}/guias/${guide.slug}`
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        inLanguage: "es",
        datePublished: guide.updated,
        dateModified: guide.updated,
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Guías", item: `${siteConfig.url}/guias` },
          { "@type": "ListItem", position: 3, name: guide.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        inLanguage: "es",
        mainEntity: guide.faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  }
  const others = GUIDES.filter((g) => g.slug !== guide.slug)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <article className="mx-auto w-full max-w-3xl px-4 pt-10 pb-12 leading-relaxed">
        <nav aria-label="Migas de pan" className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>{" "}
          ›{" "}
          <Link href="/guias" className="hover:text-foreground">
            Guías
          </Link>
        </nav>
        <h1 className="text-4xl font-extrabold tracking-tight text-balance text-primary sm:text-5xl">{guide.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Actualizado el {formatDate(guide.updated)}</p>
        <p className="mt-6 text-lg text-pretty text-foreground/85">{guide.intro}</p>

        <div className="mt-8 rounded-2xl border bg-card p-6">
          <p className="font-bold text-primary">¿Dudas de una tienda? Compruébala antes de pagar</p>
          <div className="mt-4">
            <TrustChecker />
          </div>
        </div>

        {guide.sections.map((section, i) => (
          <section key={section.title} className="mt-10">
            <h2 className="text-2xl font-extrabold tracking-tight text-primary">{section.title}</h2>
            <div className="mt-3 space-y-3 text-foreground/85">
              {section.blocks.map((block, j) =>
                Array.isArray(block) ? (
                  <ul key={j} className="list-disc space-y-2 pl-5">
                    {block.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={j}>{block}</p>
                )
              )}
            </div>
            {i === 0 && <AdSlot slot={siteConfig.adsense.slots.results} className="mt-8" />}
          </section>
        ))}

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-primary">Preguntas frecuentes</h2>
          <div className="mt-4 divide-y rounded-2xl border bg-card">
            {guide.faqs.map(({ q, a }) => (
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
      </article>

      <section className="mx-auto w-full max-w-3xl px-4 pb-24">
        <h2 className="text-2xl font-extrabold tracking-tight text-primary">Más guías</h2>
        <ul className="mt-4 space-y-2">
          {others.map((g) => (
            <li key={g.slug}>
              <Link href={`/guias/${g.slug}`} className="font-semibold text-primary underline underline-offset-4">
                {g.title}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/es-fiable/tiendas" className="font-semibold text-primary underline underline-offset-4">
              ¿Son fiables las tiendas más populares?
            </Link>
          </li>
        </ul>
      </section>
    </>
  )
}
