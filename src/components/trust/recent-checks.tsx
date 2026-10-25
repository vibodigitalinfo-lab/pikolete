import Link from "next/link"
import { cacheLife } from "next/cache"

import { recentDomains } from "@/lib/trust/recent"

/** Últimas webs comprobadas: enlaza las páginas de dominio para que Google las descubra. */
export async function RecentChecks() {
  "use cache"
  cacheLife("hours")

  const domains = await recentDomains(30)
  if (domains.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-16">
      <h2 className="text-2xl font-extrabold tracking-tight text-primary">Últimas webs comprobadas</h2>
      <ul className="mt-6 flex flex-wrap gap-2">
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
