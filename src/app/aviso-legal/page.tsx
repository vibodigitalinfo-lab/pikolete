import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import { siteConfig } from "@/lib/config"
import { baseOpenGraph } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Datos del titular de pikolete.com y condiciones de uso de sus herramientas gratuitas (LSSI-CE).",
  alternates: { canonical: "/aviso-legal" },
  openGraph: {
    ...baseOpenGraph,
    title: "Aviso legal · Pikolete Inspector",
    description: "Datos del titular de pikolete.com y condiciones de uso.",
    url: "/aviso-legal",
  },
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="mt-3 space-y-3 text-foreground/85">{children}</div>
    </section>
  )
}

export default function AvisoLegalPage() {
  const { legal, quoteEmail } = siteConfig
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14 leading-relaxed">
      <p className="text-sm font-bold tracking-[0.2em] text-badge-foreground uppercase">Legal</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-primary">Aviso legal</h1>

      <Section title="1. Titular del sitio web">
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio
          Electrónico (LSSI-CE), estos son los datos del titular de pikolete.com:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Titular: {legal.owner || "Pikolete (pikolete.com)"}</li>
          {legal.taxId && <li>NIF: {legal.taxId}</li>}
          {legal.address && <li>Domicilio: {legal.address}</li>}
          <li>
            Contacto:{" "}
            <a className="text-primary underline" href={`mailto:${quoteEmail}`}>
              {quoteEmail}
            </a>
          </li>
        </ul>
      </Section>

      <Section title="2. Qué ofrece pikolete.com">
        <p>
          Herramientas gratuitas para revisar páginas web: una auditoría SEO y técnica, y un comprobador de señales de
          confianza de tiendas online. El servicio se financia con publicidad de Google AdSense.
        </p>
      </Section>

      <Section title="3. Alcance de los resultados">
        <p>
          Los resultados se generan de forma automática a partir de información pública de cada web y del registro de
          dominios. Son orientativos: no constituyen una acusación, una garantía ni un asesoramiento profesional, y
          pueden contener errores. Si eres titular de una web analizada y crees que el resultado no es correcto,
          escríbenos y lo revisaremos.
        </p>
      </Section>

      <Section title="4. Uso aceptable">
        <p>
          No está permitido usar las herramientas de forma masiva o automatizada, ni para atacar o sobrecargar webs de
          terceros. Aplicamos límites de uso para evitarlo.
        </p>
      </Section>

      <Section title="5. Propiedad intelectual">
        <p>
          Los textos, el diseño y la marca Pikolete pertenecen a su titular. Las marcas y nombres de dominio de terceros
          que aparecen en los resultados pertenecen a sus respectivos propietarios.
        </p>
      </Section>

      <Section title="6. Datos personales">
        <p>
          El tratamiento de datos personales se explica en la{" "}
          <Link href="/privacidad" className="text-primary underline">
            política de privacidad
          </Link>
          .
        </p>
      </Section>

      <Section title="7. Legislación aplicable">
        <p>Este aviso legal se rige por la legislación española.</p>
      </Section>
    </article>
  )
}
