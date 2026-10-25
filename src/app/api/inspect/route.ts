import { NextResponse, type NextRequest } from "next/server"

import { runAudit } from "@/lib/audit/engine"
import { InspectError } from "@/lib/audit/fetch-page"
import { gateChecks } from "@/lib/audit/gating"
import type { AuditErrorBody, AuditResult } from "@/lib/audit/types"
import { hostKey } from "@/lib/config"
import { isUnlocked, UNLOCK_COOKIE } from "@/lib/premium"
import { clientIp, rateLimits } from "@/lib/rate-limit"

export const maxDuration = 30

const error = (message: string, status: number) =>
  NextResponse.json<AuditErrorBody>({ error: message }, { status })

export async function POST(request: NextRequest) {
  // Por IP: 12 por minuto y 60 por hora. Cada inspección hace 3 peticiones a la web auditada.
  const allowed = await rateLimits(`inspect:${clientIp(request.headers)}`, [
    [12, 60_000],
    [60, 3_600_000],
  ])
  if (!allowed) {
    return error("Demasiadas inspecciones seguidas. Pikolete necesita un café: espera un minuto.", 429)
  }

  let url: unknown
  try {
    ;({ url } = (await request.json()) as { url?: unknown })
  } catch {
    return error("Cuerpo de la petición inválido.", 400)
  }
  if (typeof url !== "string" || url.length > 2048) {
    return error("Escribe la URL que quieres inspeccionar.", 400)
  }

  try {
    const audit = await runAudit(url)
    const unlocked = isUnlocked(request.cookies.get(UNLOCK_COOKIE)?.value, hostKey(audit.finalUrl))
    const result: AuditResult = { ...audit, unlocked, checks: gateChecks(audit.checks, unlocked) }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    if (err instanceof InspectError) return error(err.message, err.status)
    console.error("[inspect] fallo inesperado", err)
    return error("Pikolete se ha tropezado inspeccionando esta web. Inténtalo de nuevo.", 500)
  }
}
