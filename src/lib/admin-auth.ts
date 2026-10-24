import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

import type { NextRequest } from "next/server"

export const ADMIN_COOKIE = "pk_admin"
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 7

/** Clave de sesión derivada de ADMIN_PASSWORD: cambiar la contraseña cierra todas las sesiones. */
function sessionKey(): Buffer | null {
  const password = process.env.ADMIN_PASSWORD
  return password ? createHmac("sha256", "pikolete-admin-session").update(password).digest() : null
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  return Boolean(expected) && safeEqual(candidate, expected as string)
}

export function createSession(): string {
  const key = sessionKey()
  if (!key) throw new Error("ADMIN_PASSWORD no está configurado")
  const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS
  return `${exp}.${createHmac("sha256", key).update(String(exp)).digest("base64url")}`
}

export function verifySession(value: string | undefined): boolean {
  const key = sessionKey()
  if (!key || !value) return false
  const [exp, sig] = value.split(".")
  if (!exp || !sig || Number(exp) * 1000 < Date.now()) return false
  return safeEqual(sig, createHmac("sha256", key).update(exp).digest("base64url"))
}

/** Acceso admin por cookie de sesión (panel) o HTTP Basic (descargas directas). */
export function isAdminRequest(request: NextRequest): boolean {
  if (verifySession(request.cookies.get(ADMIN_COOKIE)?.value)) return true
  const header = request.headers.get("authorization") ?? ""
  if (!header.startsWith("Basic ")) return false
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8")
  return checkPassword(decoded.slice(decoded.indexOf(":") + 1))
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ADMIN_SESSION_SECONDS,
}
