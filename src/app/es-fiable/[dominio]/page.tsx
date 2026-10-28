import type { Metadata } from "next"
import Link from "next/link"
import { notFound, permanentRedirect, redirect } from "next/navigation"
import { ChevronDown, RefreshCw } from "lucide-react"

import { AdSlot } from "@/components/site/ad-slot"
import { LEVELS, TrustReport } from "@/components/trust/trust-report"
import { TrustChecker } from "@/components/trust/trust-checker"
import { TrustGuide } from "@/components/trust/trust-guide"
import { siteConfig } from "@/lib/config"
import { baseOpenGraph, jsonLd } from "@/lib/seo"
import { isIndexable, isKnownDomain, isPublishableResult, isValidDomainSlug, recentDomains } from "@/lib/trust/recent"
import { storeName } from "@/lib/trust/popular"
import { getDomainReport } from "@/lib/trust/report"
import type { TrustResult } from "@/lib/trust/types"

type Props = PageProps<"/es-fiable/[dominio]">

// La primera visita a un dominio espera a la página completa (es la que ve Googlebot) y luego queda cacheada.
export const ensureStatic = "navigation"

/**
 * En el build se generan las últimas webs comprobadas; el resto se crea con la primera visita y se cachea un día.
 * Cache Components exige al menos un resultado, de ahí el dominio de reserva.
 */
export async function generateStaticParams() {
  const recent = await recentDomains(20)
  return (recent.length ? recent : ["amazon.es"]).map((dominio) => ({ dominio }))
}

function canonicalSlug(raw: string): string {
  let value = raw
  try {
    value = decodeURIComponent(raw)
  } catch {
    // Un % mal formado no es un dominio: isValidDomainSlug lo rechaza después.
  }
  return value.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "")
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" })

function summary(domain: string, r: TrustResult): string {
  const bad = r.signals.filter((s) => s.status === "bad").length
  const warn = r.signals.filter((s) => s.status === "warn").length
  const good = r.signals.filter((s) => s.status === "good").length
  const age =
    r.domainAgeDays === null
      ? ""
      : r.domainAgeDays < 365
        ? ` El dominio tiene menos de un año.`
        : ` El dominio lleva ${Math.floor(r.domainAgeDays / 365)} años registrado.`
  if (r.level === "incompleto") {
    return `${domain} no deja que la revisemos entera, así que solo hemos podido comprobar la conexión y el dominio.${age}`
  }
  return `Hemos revisado ${domain} y encontramos ${good} señales buenas, ${warn} de atención y ${bad} de alerta.${age}`
}

// Solo hay página para resultados "fiable" o "precaucion" (ver isPublishableResult), así que no hace falta el caso "riesgo".
// Evitamos la palabra "estafa" junto al nombre de la tienda: Google la asociaría a la marca.
function faqs(domain: string, r: TrustResult) {
  const trust =
    r.level === "fiable"
      ? `En ${domain} no vemos las señales que suelen tener las webs fraudulentas: ${LEVELS.fiable.text.toLowerCase()}`
      : `No vemos señales graves en ${domain}, pero tampoco todas las que tiene una tienda de confianza. Revisa su aviso legal y busca opiniones antes de comprar.`
  const list = [
    { q: `¿Es de fiar ${domain}?`, a: trust },
    {
      q: `¿Es seguro comprar en ${domain}?`,
      a: `Nuestra nota para ${domain} es «${LEVELS[r.level].title}». Sea cual sea la web, paga con tarjeta o PayPal, que te permiten reclamar el dinero si el pedido no llega.`,
    },
  ]
  if (r.domainAgeDays !== null) {
    list.push({
      q: `¿Desde cuándo existe ${domain}?`,
      a: `Según el registro público de dominios, ${domain} se registró hace ${
        r.domainAgeDays < 60 ? `${r.domainAgeDays} días` : r.domainAgeDays < 730 ? `${Math.round(r.domainAgeDays / 30)} meses` : `${Math.floor(r.domainAgeDays / 365)} años`
      }.`,
    })
  }
  list.push({
    q: `¿Qué hago si he tenido un problema con ${domain}?`,
    a: "Contacta primero con la tienda por escrito. Si no responde, pide a tu banco la devolución del cargo, guarda capturas del pedido y denúncialo. En España puedes llamar gratis al 017 del INCIBE.",
  })
  return list
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const domain = canonicalSlug((await params).dominio)
  if (!isValidDomainSlug(domain)) return {}
  if (!(await isKnownDomain(domain))) return { robots: { index: false } }
  const report = await getDomainReport(domain)
  if (report.status === "missing" || (report.status === "ok" && !isPublishableResult(domain, report.result))) {
    return { robots: { index: false } }
  }

  // La gente busca la marca («druni es fiable»), así que va delante cuando la conocemos.
  const name = storeName(domain)
  const title = name
    ? `¿Es fiable ${name}? Comprobamos si ${domain} es seguro para comprar`
    : `¿Es fiable ${domain}? Comprobamos si es seguro comprar`
  const description =
    report.status === "ok"
      ? `${LEVELS[report.result.level].title}: ${summary(domain, report.result)} Antigüedad, aviso legal, CIF, contacto y devoluciones.`
      : `Comprueba gratis si ${domain} es fiable: antigüedad del dominio, aviso legal, CIF, contacto y devoluciones.`
  return {
    title: { absolute: `${title} · Pikolete` },
    description,
    alternates: { canonical: `/es-fiable/${domain}` },
    openGraph: { ...baseOpenGraph, title, description, url: `/es-fiable/${domain}` },
    // Una caída temporal no debe llegar al índice, ni una ficha que solo ha pedido una persona (ver isIndexable).
    robots: { index: report.status === "ok" && (await isIndexable(domain)), follow: true },
  }
}

export default async function DomainTrustPage({ params }: Props) {
  const raw = (await params).dominio
  const domain = canonicalSlug(raw)
  if (!isValidDomainSlug(domain)) notFound()
  if (domain !== raw) permanentRedirect(`/es-fiable/${domain}`)
  // Un dominio que nadie ha comprobado se manda al comprobador, que tiene límite por IP.
  if (!(await isKnownDomain(domain))) redirect(`/es-fiable?url=${encodeURIComponent(domain)}`)

  const report = await getDomainReport(domain)
  if (report.status === "missing") notFound()

  const result = report.status === "ok" ? report.result : null
  // Blogs, webs que no se dejan leer y resultados con señales de riesgo no tienen página pública:
  // se muestran en el comprobador, sin guardar nada.
  if (result && !isPublishableResult(domain, result)) redirect(`/es-fiable?url=${encodeURIComponent(domain)}`)
  const questions = result ? faqs(domain, result) : []

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "¿Es fiable esta web?", item: `${siteConfig.url}/es-fiable` },
          { "@type": "ListItem", position: 3, name: domain, item: `${siteConfig.url}/es-fiable/${domain}` },
        ],
      },
      ...(questions.length
        ? [
            {
              "@type": "FAQPage",
              inLanguage: "es",
              mainEntity: questions.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            },
          ]
        : []),
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <section className="mx-auto w-full max-w-3xl px-4 pt-10 pb-12">
        <nav aria-label="Migas de pan" className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>{" "}
          ›{" "}
          <Link href="/es-fiable" className="hover:text-foreground">
            ¿Es fiable esta web?
          </Link>{" "}
          › <span className="text-foreground">{domain}</span>
        </nav>
        <h1 className="text-4xl font-extrabold tracking-tight break-words text-primary sm:text-5xl">
          ¿Es fiable {storeName(domain) ?? domain}?
        </h1>
        {result ? (
          <>
            <p className="mt-4 text-lg text-pretty text-muted-foreground">{summary(domain, result)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Revisado el {formatDate(result.checkedAt)}.</p>
            <div className="mt-8">
              <TrustReport result={result} ad={<AdSlot slot={siteConfig.adsense.slots.results} />} />
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              ¿Es tu web y crees que el resultado no es correcto? Escríbenos a{" "}
              <a href={`mailto:${siteConfig.quoteEmail}`} className="font-semibold text-primary underline">
                {siteConfig.quoteEmail}
              </a>{" "}
              y la revisamos.
            </p>
          </>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-lg text-muted-foreground">
            <RefreshCw className="size-5" /> Ahora mismo {domain} no responde. Vuelve a probar en unos minutos.
          </p>
        )}
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 pb-16">
        <h2 className="text-2xl font-extrabold tracking-tight text-primary">Comprueba otra web</h2>
        <div className="mt-6">
          <TrustChecker />
        </div>
      </section>

      {questions.length > 0 && (
        <section className="mx-auto w-full max-w-3xl px-4 pb-16">
          <h2 className="text-2xl font-extrabold tracking-tight text-primary">Preguntas sobre {domain}</h2>
          <div className="mt-6 divide-y rounded-2xl border bg-card">
            {questions.map(({ q, a }) => (
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
      )}

      <TrustGuide title={`Cómo comprobar tú mismo si ${domain} es fiable`} />
    </>
  )
}
