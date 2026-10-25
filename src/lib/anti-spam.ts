import "server-only"

/** Nombre del campo trampa: invisible para personas, los bots que rellenan todo caen en él. */
export const HONEYPOT_FIELD = "website"

export function isHoneypotFilled(body: Record<string, unknown> | null): boolean {
  const value = body?.[HONEYPOT_FIELD]
  return typeof value === "string" && value.trim() !== ""
}

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}

/**
 * Verifica el token de Cloudflare Turnstile (gratis, sin límite de uso).
 * Sin TURNSTILE_SECRET_KEY no se exige: los formularios siguen funcionando con honeypot y límites.
 */
export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (typeof token !== "string" || !token || token.length > 2048) return false
  try {
    const form = new URLSearchParams({ secret, response: token })
    if (ip !== "local") form.set("remoteip", ip)
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (err) {
    console.error("[turnstile] no se pudo verificar el token", err)
    return false
  }
}
