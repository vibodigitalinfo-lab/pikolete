import "server-only"

import { createHash } from "node:crypto"

const buckets = new Map<string, { count: number; resetAt: number }>()

function memoryHit(key: string, windowMs: number): number {
  const now = Date.now()
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k)
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return 1
  }
  bucket.count += 1
  return bucket.count
}

/** Upstash Redis (plan gratuito) por REST. Acepta las variables que crea la integración de Vercel. */
function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  return url && token ? { url: url.replace(/\/$/, ""), token } : null
}

async function redisHit(config: { url: string; token: string }, rawKey: string, windowMs: number): Promise<number> {
  // En Upstash solo queda un hash: ni IPs ni emails en claro, y caducan con la ventana.
  const key = createHash("sha256").update(rawKey).digest("base64url")
  const res = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", `pk:rl:${key}`],
      ["PEXPIRE", `pk:rl:${key}`, String(windowMs), "NX"],
    ]),
    cache: "no-store",
    signal: AbortSignal.timeout(2_000),
  })
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`)
  const [incr] = (await res.json()) as Array<{ result?: number; error?: string }>
  if (typeof incr?.result !== "number") throw new Error(incr?.error ?? "respuesta de Upstash inesperada")
  return incr.result
}

/** Cuenta un uso de `key` en la ventana y devuelve cuántos lleva. */
export async function hit(key: string, windowMs: number): Promise<number> {
  const config = redisConfig()
  if (config) {
    try {
      return await redisHit(config, key, windowMs)
    } catch (err) {
      console.error("[rate-limit] Upstash no responde, uso el limitador en memoria", err)
    }
  }
  return memoryHit(key, windowMs)
}

/**
 * Limitador por clave (IP, email...). Con Upstash configurado es global a todas las instancias
 * de Vercel; sin él cae a memoria, que en serverless solo limita dentro de cada instancia.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  return (await hit(key, windowMs)) <= limit
}

/** Varios límites a la vez (p. ej. por minuto y por hora). Se cuentan todos aunque uno falle. */
export async function rateLimits(key: string, rules: Array<[limit: number, windowMs: number]>): Promise<boolean> {
  const results = await Promise.all(rules.map(([limit, windowMs]) => rateLimit(`${key}:${windowMs}`, limit, windowMs)))
  return results.every(Boolean)
}

/** IP del cliente. En Vercel estas cabeceras las pone la plataforma y no se pueden falsear. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  )
}
