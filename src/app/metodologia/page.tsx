import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { siteConfig } from "@/lib/config";
import { baseOpenGraph } from "@/lib/seo";

const TITLE = "Cómo revisamos una tienda online";
const DESCRIPTION =
  "Qué comprueba «¿Es fiable esta web?», cuánto pesa cada señal en la nota, qué significa cada resultado y qué no puede saber una revisión automática.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Pikolete` },
  description: DESCRIPTION,
  alternates: { canonical: "/metodologia" },
  openGraph: {
    ...baseOpenGraph,
    title: TITLE,
    description: DESCRIPTION,
    url: "/metodologia",
  },
};

/** Señales del motor (src/lib/trust/engine.ts) con su peso. Si cambias un peso allí, cámbialo aquí. */
const SIGNALS: Array<{ label: string; weight: number; what: string }> = [
  {
    label: "Antigüedad del dominio",
    weight: 25,
    what: "Consultamos el registro público de dominios (RDAP). Casi todas las tiendas falsas tienen menos de seis meses, así que un dominio de menos de 180 días nunca puede salir «Pinta fiable».",
  },
  {
    label: "Conexión segura (HTTPS)",
    weight: 15,
    what: "Que la web cifre la conexión con un certificado válido. Sin HTTPS no deberías escribir ningún dato.",
  },
  {
    label: "Aviso legal y condiciones",
    weight: 12,
    what: "En España la LSSI obliga a toda web con actividad económica a publicar quién está detrás y sus condiciones.",
  },
  {
    label: "Empresa identificada",
    weight: 10,
    what: "Buscamos un CIF o NIF con formato válido y una razón social en la web.",
  },
  {
    label: "Datos de contacto",
    weight: 10,
    what: "Teléfono, email o dirección física visibles, más allá de un formulario.",
  },
  {
    label: "Política de devoluciones",
    weight: 8,
    what: "Solo en tiendas. El derecho de desistimiento de 14 días es obligatorio en la UE.",
  },
  {
    label: "Descuentos creíbles",
    weight: 8,
    what: "Solo en tiendas. Descuentos del 70 % o más repartidos por toda la portada son típicos de las copias.",
  },
  {
    label: "Formas de pago con protección",
    weight: 8,
    what: "Solo en tiendas. Tarjeta o PayPal permiten reclamar el dinero; transferencia o criptomonedas, no.",
  },
  {
    label: "Nombre del dominio",
    weight: 6,
    what: "Nombres que imitan a una marca con añadidos como «-outlet» u «-ofertas», o terminaciones muy usadas por webs fraudulentas.",
  },
  {
    label: "Redirección a otro dominio",
    weight: 6,
    what: "Si la dirección que pegaste te lleva a otra web distinta.",
  },
  {
    label: "Política de privacidad",
    weight: 5,
    what: "Obligatoria por el RGPD si la web recoge datos.",
  },
  {
    label: "Redes sociales",
    weight: 4,
    what: "Enlaces a perfiles propios. Pesa poco porque es fácil de imitar.",
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold text-primary">{title}</h2>
      <div className="mt-3 space-y-3 text-foreground/85">{children}</div>
    </section>
  );
}

export default function MetodologiaPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14 leading-relaxed">
      <p className="text-sm font-bold tracking-[0.2em] text-badge-foreground uppercase">
        Metodología
      </p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-balance text-primary sm:text-5xl">
        {TITLE}
      </h1>
      <p className="mt-4 text-lg text-pretty text-muted-foreground">
        <Link href="/es-fiable" className="text-primary underline">
          ¿Es fiable esta web?
        </Link>{" "}
        no opina: visita la web como lo haría un comprador, consulta el registro
        público de dominios y suma señales objetivas. Aquí explicamos cuáles y
        cuánto pesa cada una, para que puedas juzgar el resultado por ti mismo.
      </p>

      <Section title="Las señales que revisamos">
        <p>
          Cada señal sale bien, regular o mal, y la nota es la media ponderada
          de las que hemos podido comprobar. Las que no se pueden comprobar no
          cuentan ni a favor ni en contra.
        </p>
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Señal</th>
                <th className="px-4 py-3 font-semibold">Peso</th>
                <th className="px-4 py-3 font-semibold">Qué miramos</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {SIGNALS.map((s) => (
                <tr key={s.label}>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {s.label}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{s.weight}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Primero miramos si la web vende. A un blog o a la web de una empresa
          no le pedimos devoluciones ni formas de pago, y no le hablamos de
          «comprar».
        </p>
      </Section>

      <Section title="Qué significa cada resultado">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Pinta fiable</strong> (75 o más): las señales revisadas son
            buenas.
          </li>
          <li>
            <strong>Ve con cuidado</strong> (de 50 a 74): faltan datos que
            suelen tener las tiendas serias.
          </li>
          <li>
            <strong>Señales de riesgo</strong> (menos de 50, o dominio de menos
            de seis meses, o sin HTTPS): tiene varias señales típicas de webs
            fraudulentas.
          </li>
          <li>
            <strong>No hemos podido revisarla a fondo</strong>: la web bloquea a
            los robots (pasa con muchas tiendas grandes) y solo vemos la
            conexión y el dominio.
          </li>
        </ul>
      </Section>

      <Section title="Qué páginas publicamos">
        <p>
          Solo tienen ficha pública las tiendas que salen «Pinta fiable» o «Ve
          con cuidado». Los resultados de riesgo, los blogs y las webs que no se
          dejan leer se muestran a quien los pide y no se guardan: una revisión
          automática no es motivo para dejar mal a nadie en un buscador. Cada
          ficha se vuelve a revisar como mucho una vez al día y muestra la fecha
          de la última revisión.
        </p>
      </Section>

      <Section title="Lo que una revisión automática no puede saber">
        <p>
          No sabemos si una tienda envía los pedidos, si atiende bien las
          reclamaciones ni si sus productos son originales. Una tienda puede
          tener buena nota y fallar, o al revés. Por eso el resultado es
          orientativo, no una garantía ni una acusación: compleméntalo con
          opiniones de otros compradores y paga siempre con un método que te
          permita reclamar. Tienes cómo hacerlo en nuestras{" "}
          <Link href="/guias" className="text-primary underline">
            guías
          </Link>
          .
        </p>
      </Section>

      <Section title="Independencia y correcciones">
        <p>
          Ninguna tienda paga por aparecer ni por su nota, y no usamos enlaces
          de afiliado. Pikolete se financia solo con publicidad de Google, que
          no influye en los resultados.
        </p>
        <p>
          Si una ficha tiene un error, o es tu tienda y has corregido algo,
          escríbenos a{" "}
          <a
            href={`mailto:${siteConfig.quoteEmail}`}
            className="text-primary underline"
          >
            {siteConfig.quoteEmail}
          </a>{" "}
          y la revisamos a mano.
        </p>
      </Section>
    </article>
  );
}
