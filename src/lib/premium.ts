import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

import { encodeRef, decodeRef } from "./config"

export const UNLOCK_COOKIE = "pk_unlock"
export const UNLOCK_TTL_SECONDS = 60 * 60 * 24 * 30
const MAX_TOKENS = 20

function secret(): string | null {
  const value = process.env.PIKOLETE_UNLOCK_SECRET
  if (value) return value
  return process.env.NODE_ENV === "production" ? null : "pikolete-dev-only-secret"
}

/** Desbloqueo sin pago: solo en desarrollo sin Stripe o si se activa explícitamente. */
export function demoUnlockEnabled(): boolean {
  if (process.env.PIKOLETE_DEMO_UNLOCK === "true") return true
  return process.env.NODE_ENV !== "production" && !process.env.STRIPE_SECRET_KEY
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url").slice(0, 32)
}

function parseTokens(cookie: string | undefined): string[] {
  return cookie ? cookie.split("~").filter(Boolean) : []
}

function validHost(token: string, key: string): string | null {
  const [ref, exp, sig] = token.split(".")
  if (!ref || !exp || !sig) return null
  if (Number(exp) * 1000 < Date.now()) return null
  const expected = Buffer.from(sign(`${ref}.${exp}`, key))
  const actual = Buffer.from(sig)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  return decodeRef(ref)
}

export function isUnlocked(cookie: string | undefined, host: string): boolean {
  const key = secret()
  if (!key || !host) return false
  return parseTokens(cookie).some((token) => validHost(token, key) === host)
}

/** Devuelve el nuevo valor de cookie con el dominio añadido. */
export function addUnlock(cookie: string | undefined, host: string): string {
  const key = secret()
  if (!key) throw new Error("PIKOLETE_UNLOCK_SECRET no está configurado")
  const ref = encodeRef(host)
  const exp = Math.floor(Date.now() / 1000) + UNLOCK_TTL_SECONDS
  const kept = parseTokens(cookie).filter((t) => {
    const h = validHost(t, key)
    return h !== null && h !== host
  })
  return [...kept.slice(-(MAX_TOKENS - 1)), `${ref}.${exp}.${sign(`${ref}.${exp}`, key)}`].join("~")
}

export const unlockCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: UNLOCK_TTL_SECONDS,
}
