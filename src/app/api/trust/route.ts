import { NextResponse, type NextRequest } from "next/server"

import { InspectError } from "@/lib/audit/fetch-page"
import { clientIp, rateLimits } from "@/lib/rate-limit"
import { runTrustCheck } from "@/lib/trust/engine"
import { domainSlug, isPublishableResult, recordChecked } from "@/lib/trust/recent"
import type { TrustErrorBody } from "@/lib/trust/types"

export const maxDuration = 30

const error = (message: string, status: number) =>
  NextResponse.json<TrustErrorBody>({ error: message }, { status })

export async function POST(request: NextRequest) {
  const allowed = await rateLimits(`trust:${clientIp(request.headers)}`, [
    [12, 60_000],
    [60, 3_600_000],
  ])
  if (!allowed) {
    return error("Demasiadas comprobaciones seguidas. Espera un minuto y vuelve a probar.", 429)
  }

  let url: unknown
  try {
    ;({ url } = (await request.json()) as { url?: unknown })
  } catch {
    return error("Cuerpo de la petición inválido.", 400)
  }
  if (typeof url !== "string" || url.length > 2048) {
    return error("Pega la dirección de la web que quieres comprobar.", 400)
  }

  try {
    const result = await runTrustCheck(url)
    const slug = domainSlug(url)
    const publishable = slug !== null && isPublishableResult(slug, result)
    if (publishable) await recordChecked(slug)
    return NextResponse.json({ ...result, slug: publishable ? slug : null }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    if (err instanceof InspectError) return error(err.message, err.status)
    console.error("[trust] fallo inesperado", err)
    return error("Pikolete se ha tropezado comprobando esta web. Inténtalo de nuevo.", 500)
  }
}
