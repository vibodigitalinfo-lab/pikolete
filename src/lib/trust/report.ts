import "server-only"

import { cacheLife } from "next/cache"

import { InspectError } from "@/lib/audit/fetch-page"

import { runTrustCheck } from "./engine"
import type { TrustResult } from "./types"

export type DomainReport = { status: "ok"; result: TrustResult } | { status: "missing" } | { status: "error" }

/**
 * Comprobación de un dominio para su página pública, cacheada un día: la página no vuelve a visitar
 * la web en cada visita (ni en cada pasada de Googlebot).
 */
export async function getDomainReport(domain: string): Promise<DomainReport> {
  "use cache"
  try {
    const result = await runTrustCheck(domain)
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
