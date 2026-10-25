import "server-only"

import { cacheLife } from "next/cache"

import { InspectError } from "@/lib/audit/fetch-page"

import { runTrustCheck } from "./engine"
import { POPULAR_DOMAINS, POPULAR_STORES } from "./popular"
import { isPublishableResult } from "./recent"
import type { TrustResult } from "./types"

export type DomainReport = { status: "ok"; result: TrustResult } | { status: "missing" } | { status: "error" }

/**
 * Comprobación de un dominio para su página pública, cacheada un día: la página no vuelve a visitar
 * la web en cada visita (ni en cada pasada de Googlebot).
 */
export async function getDomainReport(domain: string): Promise<DomainReport> {
  "use cache"
  try {
    const result = await runTrustCheck(domain, { knownShop: POPULAR_DOMAINS.includes(domain) })
    cacheLife("days")
    return { status: "ok", result }
  } catch (err) {
    // El dominio no existe o no es una web pública. Unas horas, por si fue un fallo puntual de DNS.
    if (err instanceof InspectError && (err.status === 400 || err.status === 422)) {
      cacheLife("hours")
      return { status: "missing" }
    }
    // Caída temporal de la web: reintentamos pronto.
    cacheLife("minutes")
    return { status: "error" }
  }
}

/** Tiendas populares que tienen página pública (las que bloquean a los robots o salen mal se quedan fuera). */
export async function publishedPopularStores(): Promise<Array<{ category: string; domains: string[] }>> {
  "use cache"
  // Horas y no días: si una tienda falló en una pasada (caída, bloqueo puntual), vuelve pronto al listado.
  cacheLife("hours")
  const groups = await Promise.all(
    POPULAR_STORES.map(async ({ category, domains }) => {
      const reports = await Promise.all(domains.map((d) => getDomainReport(d)))
      return {
        category,
        domains: domains.filter((d, i) => {
          const r = reports[i]
          return r.status === "ok" && isPublishableResult(d, r.result)
        }),
      }
    })
  )
  return groups.filter((g) => g.domains.length > 0)
}
