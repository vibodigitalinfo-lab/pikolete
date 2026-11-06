import Link from "next/link"

import { GUIDES, guideTopic } from "@/content/guides"

/**
 * Enlaces de contenido desde la portada: deja el comprobador de tiendas, el directorio y cada guía a un clic,
 * y a quien acaba de auditar su web le da un siguiente paso útil.
 */
export function Explore() {
  const shopping = GUIDES.filter((g) => guideTopic(g) === "compras")
  const web = GUIDES.filter((g) => guideTopic(g) === "web")

  return (
    <section id="mas" className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">Más de Pikolete</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
        Además de inspeccionar tu web, te ayudamos a comprar online sin sustos. Todo gratis.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Link href="/es-fiable" className="block rounded-2xl border bg-card p-6 transition-colors hover:border-primary">
          <p className="text-xl font-extrabold text-primary">¿Es fiable esta web? →</p>
          <p className="mt-1 text-muted-foreground">
            Pega la dirección de una tienda online y te decimos si tiene señales de estafa: dominio, aviso legal, CIF,
            contacto y devoluciones.
          </p>
        </Link>
        <Link
          href="/es-fiable/tiendas"
          className="block rounded-2xl border bg-card p-6 transition-colors hover:border-primary"
        >
          <p className="text-xl font-extrabold text-primary">Tiendas online populares →</p>
          <p className="mt-1 text-muted-foreground">
            La ficha de las tiendas más usadas en España: moda, electrónica, belleza, deporte, hogar y más.
          </p>
        </Link>
      </div>

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-bold">Guías para comprar online</h3>
          <ul className="mt-3 space-y-2">
            {shopping.map((g) => (
              <li key={g.slug}>
                <Link href={`/guias/${g.slug}`} className="text-primary underline-offset-4 hover:underline">
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold">Guías para mejorar tu web</h3>
          <ul className="mt-3 space-y-2">
            {web.map((g) => (
              <li key={g.slug}>
                <Link href={`/guias/${g.slug}`} className="text-primary underline-offset-4 hover:underline">
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            ¿Quieres saber cómo puntuamos?{" "}
            <Link href="/metodologia" className="font-semibold text-primary underline underline-offset-4">
              Así revisamos las webs
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
