import Link from "next/link"
import { cacheLife } from "next/cache"

import { POPULAR_DOMAINS } from "@/lib/trust/popular"
import { indexableRecentDomains } from "@/lib/trust/recent"

/** Tope de enlaces: las fichas más antiguas siguen en el sitemap; aquí no queremos una lista interminable. */
const LIMIT = 60

/**
 * Fichas de tiendas que han pedido varias personas (las indexables, ver isIndexable). Sin esto solo se llegaba
 * a ellas por el sitemap o mientras salían en «Últimas webs comprobadas».
 */
export async function UserCheckedStores() {
  "use cache"
  cacheLife("hours")

  const domains = (await indexableRecentDomains(LIMIT + POPULAR_DOMAINS.length))
    .filter((d) => !POPULAR_DOMAINS.includes(d))
    .slice(0, LIMIT)
  if (domains.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-16">
      <h2 className="text-2xl font-extrabold tracking-tight text-primary">Otras tiendas que habéis comprobado</h2>
      <p className="mt-1 text-muted-foreground">Tiendas que varias personas han pasado por Pikolete.</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {domains.map((d) => (
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
    </section>
  )
}
