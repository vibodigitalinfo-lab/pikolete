import type { Metadata } from "next"
import type { ReactNode } from "react"

import { PRIVACY_VERSION, siteConfig } from "@/lib/config"
import { baseOpenGraph } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo trata Pikolete Inspector los datos personales: qué recogemos al auditar tu web, para qué, cuánto tiempo y cómo ejercer tus derechos RGPD.",
  alternates: { canonical: "/privacidad" },
  openGraph: {
    ...baseOpenGraph,
    title: "Política de privacidad · Pikolete Inspector",
    description: "Cómo trata Pikolete Inspector los datos personales de sus usuarios.",
    url: "/privacidad",
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

export default function PrivacidadPage() {
  const { legal, quoteEmail } = siteConfig
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14 leading-relaxed">
      <p className="text-sm font-bold tracking-[0.2em] text-badge-foreground uppercase">Legal</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-primary">Política de privacidad</h1>
      <p className="mt-3 text-sm text-muted-foreground">Versión {PRIVACY_VERSION}</p>

      <Section title="1. Responsable del tratamiento">
        <ul className="list-disc space-y-1 pl-5">
          <li>Titular: {legal.owner || "Pikolete (pikolete.com)"}</li>
          {legal.taxId && <li>NIF: {legal.taxId}</li>}
          {legal.address && <li>Domicilio: {legal.address}</li>}
          <li>
            Contacto: <a className="text-primary underline" href={`mailto:${quoteEmail}`}>{quoteEmail}</a>
          </li>
        </ul>
      </Section>

      <Section title="2. Qué datos tratamos">
        <p>Solo los que tú nos facilitas en los formularios y algunos datos técnicos de la visita:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Datos de contacto: email (obligatorio), nombre, empresa y teléfono (opcionales).</li>
          <li>Tu perfil (propietario de la web, agencia o buscas ayuda) y el mensaje que nos envíes.</li>
          <li>La web que has inspeccionado y el resultado de la inspección (nota e incidencias).</li>
          <li>
            Datos técnicos aproximados: país y ciudad deducidos por nuestro proveedor de hosting, idioma del navegador,
            tipo de dispositivo y la página o campaña por la que llegaste (referer y parámetros UTM).{" "}
            <strong>No guardamos tu dirección IP.</strong>
          </li>
        </ul>
      </Section>

      <Section title="3. Para qué los usamos y base legal">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Darte acceso al informe completo</strong> y contactarte en relación con él. Base legal: tu
            consentimiento al enviar el formulario (art. 6.1.a RGPD).
          </li>
          <li>
            <strong>Preparar el presupuesto que solicites.</strong> Base legal: aplicación de medidas precontractuales a
            petición tuya (art. 6.1.b RGPD).
          </li>
          <li>
            <strong>Enviarte consejos y ofertas por email</strong>, solo si marcas la casilla correspondiente. Base legal:
            tu consentimiento, que puedes retirar en cualquier momento.
          </li>
          <li>
            <strong>Estadísticas internas</strong> sobre qué tipo de webs y campañas nos traen usuarios, con datos
            agregados.
          </li>
        </ul>
      </Section>

      <Section title="4. Cuánto tiempo los conservamos">
        <p>
          Mientras no retires tu consentimiento o pidas su supresión y, en todo caso, un máximo de 3 años desde tu última
          interacción con nosotros. Después se eliminan o anonimizan.
        </p>
      </Section>

      <Section title="5. Quién más accede a tus datos">
        <p>
          No vendemos ni cedemos tus datos a terceros. Los almacena nuestro proveedor de hosting, Vercel Inc., que actúa
          como encargado del tratamiento. Los datos se guardan en servidores de la Unión Europea (Frankfurt). Vercel está
          adherida al Marco de Privacidad de Datos UE-EE. UU., que ampara cualquier acceso técnico desde Estados Unidos.
        </p>
      </Section>

      <Section title="6. Tus derechos">
        <p>
          Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y
          portabilidad, así como retirar tu consentimiento, escribiendo a{" "}
          <a className="text-primary underline" href={`mailto:${quoteEmail}`}>{quoteEmail}</a>. Si consideras que no
          hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
        </p>
      </Section>

      <Section title="7. Cookies y almacenamiento local">
        <p>
          Solo usamos una cookie técnica (<code>pk_unlock</code>) que recuerda que has desbloqueado el informe de un
          dominio durante 30 días, y almacenamiento de sesión del navegador para recordar por qué página llegaste. No
          usamos cookies publicitarias ni de terceros, por lo que no necesitan tu consentimiento.
        </p>
      </Section>
    </article>
  )
}
