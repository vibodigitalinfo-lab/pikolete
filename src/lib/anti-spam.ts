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

/** Acción de cada formulario protegido: el widget la firma en el token y el servidor la comprueba. */
export type TurnstileAction = "report" | "quote"

/**
 * Dominios desde los que se acepta el widget. Con TURNSTILE_HOSTNAMES ("pikolete.com,www.pikolete.com")
 * se usa esa lista; sin ella, el mismo dominio que recibe la petición (sirve también en los previews).
 */
function expectedHostnames(requestHost: string | null): Set<string> {
  const configured = (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
  if (configured.length) return new Set(configured)
  const host = requestHost?.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "")
  return new Set(host ? [host] : [])
}

/**
 * Verifica el token de Cloudflare Turnstile (gratis, sin límite de uso): éxito, acción del formulario
 * y dominio donde se resolvió. Ante cualquier fallo de Cloudflare se rechaza.
 * Sin TURNSTILE_SECRET_KEY no se exige: los formularios siguen funcionando con honeypot y límites.
 */
export async function verifyTurnstile(
  token: unknown,
  { ip, action, requestHost }: { ip: string; action: TurnstileAction; requestHost: string | null }
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  const hostnames = expectedHostnames(requestHost)
  if (typeof token !== "string" || !token || token.length > 2048 || hostnames.size === 0) return false
  try {
    const form = new URLSearchParams({ secret, response: token })
    if (ip !== "local") form.set("remoteip", ip)
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`siteverify HTTP ${res.status}`)
    const data = (await res.json()) as { success?: boolean; action?: string; hostname?: string; "error-codes"?: string[] }
    if (data.success === true && data.action === action && hostnames.has(data.hostname ?? "")) return true
    console.warn("[turnstile] token rechazado", data["error-codes"], data.action, data.hostname)
    return false
  } catch (err) {
    console.error("[turnstile] no se pudo verificar el token", err)
    return false
  }
}
