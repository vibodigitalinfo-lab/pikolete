import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/config";
import { baseOpenGraph, jsonLd } from "@/lib/seo";

const TITLE = "Sobre Pikolete";
const DESCRIPTION =
  "Quién está detrás de Pikolete, por qué es gratis, cómo se financia y cómo contactar con nosotros.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Pikolete` },
  description: DESCRIPTION,
  alternates: { canonical: "/sobre-pikolete" },
  openGraph: {
    ...baseOpenGraph,
    title: TITLE,
    description: DESCRIPTION,
    url: "/sobre-pikolete",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: `${siteConfig.url}/sobre-pikolete`,
  inLanguage: "es",
  mainEntity: {
    "@type": "Organization",
    name: "Pikolete",
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.svg`,
    email: siteConfig.quoteEmail,
    areaServed: "ES",
  },
};

export default function SobrePage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14 leading-relaxed">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      <p className="text-sm font-bold tracking-[0.2em] text-badge-foreground uppercase">
        Quiénes somos
      </p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
        {TITLE}
      </h1>

      <div className="mt-6 space-y-4 text-lg text-foreground/85">
        <p>
          Pikolete es un proyecto independiente hecho en España. Empezó como un
          auditor web gratuito para quien tiene una página y no sabe por qué no
          aparece en Google, y ha crecido con herramientas para compradores:
          comprobar una tienda antes de pagar y guías para no llevarse sustos
          comprando online.
        </p>
        <p>
          Todo es gratis y no hace falta crear una cuenta. Pikolete se paga con
          anuncios de Google AdSense. Ninguna tienda paga por aparecer ni por su
          nota, y no cobramos comisiones por las compras que hagas.
        </p>
      </div>

      <h2 className="mt-12 text-2xl font-bold text-primary">
        Nuestras herramientas
      </h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-foreground/85">
        <li>
          <Link
            href="/es-fiable"
            className="font-semibold text-primary underline"
          >
            ¿Es fiable esta web?
          </Link>
          : revisa en segundos las señales de confianza de una tienda online.
          Explicamos cómo funciona en{" "}
          <Link href="/metodologia" className="text-primary underline">
            nuestra metodología
          </Link>
          .
        </li>
        <li>
          <Link href="/" className="font-semibold text-primary underline">
            Auditoría SEO y web
          </Link>
          : revisa el SEO, la velocidad y la seguridad de tu página.
        </li>
        <li>
          <Link href="/guias" className="font-semibold text-primary underline">
            Guías
          </Link>
          : qué hacer si te han estafado, cómo reclamar o qué forma de pago te
          protege más.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl font-bold text-primary">Contacto</h2>
      <p className="mt-4 text-foreground/85">
        Para dudas, errores en un resultado o propuestas, escríbenos a{" "}
        <a
          href={`mailto:${siteConfig.quoteEmail}`}
          className="text-primary underline"
        >
          {siteConfig.quoteEmail}
        </a>
        . Los datos del titular están en el{" "}
        <Link href="/aviso-legal" className="text-primary underline">
          aviso legal
        </Link>
        .
      </p>
    </article>
  );
}
