import { NextResponse, type NextRequest } from "next/server"

import { hostKey } from "@/lib/config"
import { addUnlock, demoUnlockEnabled, UNLOCK_COOKIE, unlockCookieOptions } from "@/lib/premium"


/** Desbloqueo de prueba para desarrollo (sin Stripe). Desactivado en producción por defecto. */
export async function POST(request: NextRequest) {
  if (!demoUnlockEnabled()) {
    return NextResponse.json({ error: "El desbloqueo de demostración está desactivado." }, { status: 403 })
  }
  const { url } = (await request.json().catch(() => ({}))) as { url?: string }
  const host = hostKey(url ?? "")
  if (!host) return NextResponse.json({ error: "URL inválida." }, { status: 400 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(UNLOCK_COOKIE, addUnlock(request.cookies.get(UNLOCK_COOKIE)?.value, host), unlockCookieOptions)
  return res
}
