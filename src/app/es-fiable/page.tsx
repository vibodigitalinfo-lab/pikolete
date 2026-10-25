import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, ChevronDown, Clock, Lock } from "lucide-react"

import { PikoleteMascot } from "@/components/brand/pikolete-logo"
import { AdSlot } from "@/components/site/ad-slot"
import { TrustChecker } from "@/components/trust/trust-checker"
import { siteConfig } from "@/lib/config"
import { baseOpenGraph, jsonLd } from "@/lib/seo"

const TITLE = "¿Es fiable esta web? Comprueba gratis si una tienda online es segura"
const DESCRIPTION =
  "Pega la dirección de una web o tienda online y en segundos te decimos si es fiable: antigüedad del dominio, aviso legal, CIF, contacto, devoluciones y señales de estafa. Gratis y sin registro."

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Pikolete` },
  description: DESCRIPTION,
  alternates: { canonical: "/es-fiable" },
  openGraph: { ...baseOpenGraph, title: TITLE, description: DESCRIPTION, url: "/es-fiable" },
}

const CHECKS = [
  {
    title: "Antigüedad del dominio",
    text: "Consultamos el registro público del dominio. La mayoría de tiendas falsas tienen pocas semanas o meses de vida.",
  },
  {
    title: "Aviso legal y empresa",
    text: "En España toda tienda debe identificarse con su razón social y CIF. Buscamos el aviso legal y el número fiscal.",
  },
  {
    title: "Contacto real",
    text: "Una tienda seria da email, teléfono y dirección. Si solo hay un formulario, desconfía.",
  },
  {
    title: "Devoluciones y pagos",
    text: "Miramos si explica cómo devolver un pedido y si acepta pagos con protección como tarjeta, PayPal o Bizum.",
  },
  {
    title: "Precios imposibles",
    text: "Descuentos del 70 % o más en marcas conocidas son el gancho más habitual de las estafas online.",
  },
  {
    title: "Conexión y dominio",
    text: "Comprobamos el certificado HTTPS, las redirecciones y si el nombre del dominio tiene rasgos sospechosos.",
  },
]

const FAQS = [
  {
    q: "¿Cómo saber si una página web es fiable?",
    a: "Fíjate en cinco cosas: que el dominio no sea de hace pocos meses, que tenga aviso legal con el nombre y el CIF de la empresa, que dé un teléfono y una dirección, que explique las devoluciones y que acepte pagos con protección. Pikolete revisa todo eso por ti en segundos.",
  },
  {
    q: "¿Cómo saber si una tienda online es una estafa?",
    a: "Las señales más claras son precios muy por debajo del mercado, un dominio recién creado, ningún dato de la empresa y pagar solo por transferencia o Bizum a un particular. Si ves varias juntas, no compres.",
  },
  {
    q: "¿Que una web tenga candado (HTTPS) significa que es segura?",
    a: "No. El candado solo indica que la conexión va cifrada. Cualquiera puede conseguir un certificado gratis en minutos, y casi todas las webs fraudulentas lo tienen.",
  },
  {
    q: "¿Qué hago si ya he comprado en una web falsa?",
    a: "Llama a tu banco cuanto antes para bloquear la tarjeta y pedir la devolución del cargo, guarda capturas del pedido y denúncialo en la Policía o la Guardia Civil. En España también puedes avisar al INCIBE en el 017, gratis y confidencial.",
  },
  {
    q: "¿El resultado es seguro al 100 %?",
    a: "No. Es una revisión automática de señales públicas, no una garantía ni una acusación. Sirve para detectar las alertas más comunes, pero la decisión final es tuya.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Nada. Es gratis, sin registro y sin límite razonable de uso. Pikolete se mantiene gracias a los anuncios.",
  },
]

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${siteConfig.url}/es-fiable#app`,
      name: "¿Es fiable esta web? · Pikolete",
      url: `${siteConfig.url}/es-fiable`,
      description: DESCRIPTION,
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      inLanguage: "es",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteConfig.url}/es-fiable#faq`,
      inLanguage: "es",
      mainEntity: FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
}

export default function EsFiablePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED_DATA) }} />

      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-4 pt-14 pb-16 lg:pt-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-badge/50 bg-badge/15 px-3 py-1 text-sm font-semibold text-badge-foreground">
            <PikoleteMascot className="-my-2 size-7" />
            Antes de comprar, pregunta a Pikolete
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-balance text-primary sm:text-5xl">
            ¿Es fiable esta web?
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
            Pega la dirección de cualquier tienda online o página web y en segundos te decimos si tiene señales de
            estafa: antigüedad del dominio, aviso legal, CIF, contacto, devoluciones y precios sospechosos.
          </p>
          <div className="mt-8">
            <TrustChecker />
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-success" /> Gratis y sin registro
            </li>
            <li className="flex items-center gap-1.5">
              <Clock className="size-4 text-primary" /> Resultado en segundos
            </li>
            <li className="flex items-center gap-1.5">
              <Lock className="size-4 text-primary" /> No guardamos lo que compruebas
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-primary">Qué revisa Pikolete</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHECKS.map((c) => (
            <div key={c.title} className="rounded-2xl border bg-card p-6">
              <h3 className="font-bold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      <AdSlot slot={siteConfig.adsense.slots.landing} className="mx-auto max-w-6xl px-4 pb-16" />

      <section className="mx-auto w-full max-w-3xl px-4 pb-16">
        <h2 className="text-3xl font-extrabold tracking-tight text-primary">
          Cómo saber si una tienda online es fiable en 5 pasos
        </h2>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Mira la dirección con lupa.</strong> Las copias usan nombres parecidos a
            marcas conocidas, con guiones o palabras como «outlet» u «ofertas».
          </li>
          <li>
            <strong className="text-foreground">Busca el aviso legal.</strong> Debe aparecer el nombre de la empresa, su
            CIF y una dirección física. Copia el CIF en Google: si no sale ninguna empresa, mala señal.
          </li>
          <li>
            <strong className="text-foreground">Desconfía de los chollos.</strong> Nadie vende zapatillas de marca al 80 %
            de descuento todo el año.
          </li>
          <li>
            <strong className="text-foreground">Lee opiniones fuera de la web.</strong> Busca «nombre de la tienda +
            opiniones» o «+ estafa». Las reseñas de la propia web no cuentan.
          </li>
          <li>
            <strong className="text-foreground">Paga con protección.</strong> Tarjeta o PayPal te permiten reclamar el
            dinero. Nunca pagues por transferencia a una tienda que no conoces.
          </li>
        </ol>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 pb-16">
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

      <section className="mx-auto w-full max-w-3xl px-4 pb-24 text-center">
        <p className="text-muted-foreground">
          ¿Tienes una web y quieres saber qué falla?{" "}
          <Link href="/" className="font-semibold text-primary underline underline-offset-4">
            Pasa la auditoría SEO gratis de Pikolete
          </Link>
          .
        </p>
      </section>
    </>
  )
}
