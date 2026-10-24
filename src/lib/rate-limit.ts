import "server-only"

const buckets = new Map<string, { count: number; resetAt: number }>()

/**
 * Limitador en memoria por clave (IP). Suficiente para un MVP en una sola instancia;
 * en serverless con varias instancias conviene moverlo a Redis/Upstash.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  bucket.count += 1
  return bucket.count <= limit
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local"
}
