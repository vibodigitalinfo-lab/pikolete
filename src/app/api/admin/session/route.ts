import { NextResponse, type NextRequest } from "next/server"

import { ADMIN_COOKIE, adminCookieOptions, checkPassword, createSession } from "@/lib/admin-auth"
import { clientIp, rateLimit } from "@/lib/rate-limit"

/** Inicia sesión en el panel. */
export async function POST(request: NextRequest) {
  if (!rateLimit(`admin-login:${clientIp(request.headers)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un minuto." }, { status: 429 })
  }
  const { password } = (await request.json().catch(() => ({}))) as { password?: unknown }
  if (typeof password !== "string" || !checkPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, createSession(), adminCookieOptions)
  return res
}

/** Cierra la sesión. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 })
  return res
}
