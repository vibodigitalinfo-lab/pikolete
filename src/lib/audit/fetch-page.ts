import "server-only"

import { lookup } from "node:dns/promises"
import net from "node:net"

export const USER_AGENT =
  "Mozilla/5.0 (compatible; PikoleteInspector/1.0; +https://pikolete.com)"

const MAX_HTML_BYTES = 3 * 1024 * 1024
const MAX_REDIRECTS = 5
const REQUEST_TIMEOUT_MS = 10_000

/** Error con mensaje apto para mostrar al usuario y código HTTP para la API. */
export class InspectError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message)
    this.name = "InspectError"
  }
}

export interface FetchedPage {
  finalUrl: URL
  status: number
  headers: Headers
  html: string
  bytes: number
  redirects: number
  /** Tiempo hasta recibir las cabeceras del documento final (TTFB aprox.). */
  responseTimeMs: number
  /** Tiempo total: redirecciones + descarga completa del HTML. */
  downloadTimeMs: number
}

/** Convierte la entrada del usuario en una URL http(s) válida o lanza InspectError. */
export function normalizeUrl(input: string): URL {
  let value = input.trim()
  if (!value) throw new InspectError("Escribe la URL que quieres inspeccionar.")
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new InspectError("Esa URL no parece válida. Prueba con algo como https://miweb.com")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InspectError("Solo se pueden inspeccionar URLs http:// o https://")
  }
  if (url.username || url.password) {
    throw new InspectError("La URL no puede incluir usuario o contraseña.")
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new InspectError("Solo se admiten los puertos estándar (80 y 443).")
  }
  if (!url.hostname.includes(".")) {
    throw new InspectError("Introduce un dominio completo, por ejemplo miweb.com")
  }
  url.hash = ""
  return url
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0
}

function inIpv4Range(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask)
}

const PRIVATE_V4: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
]

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return PRIVATE_V4.some(([base, bits]) => inIpv4Range(ip, base, bits))
  const v6 = ip.toLowerCase()
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIp(mapped[1])
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    /^fe[89ab]/.test(v6) ||
    v6.startsWith("ff")
  )
}

/** Evita SSRF: el inspector solo visita hosts públicos de Internet. */
async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase()
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new InspectError("Pikolete solo patrulla webs públicas, no direcciones internas.")
  }

  let addresses: string[]
  if (net.isIP(host)) {
    addresses = [host]
  } else {
    try {
      addresses = (await lookup(host, { all: true })).map((a) => a.address)
    } catch {
      throw new InspectError(`No encontramos el dominio "${host}". ¿Está bien escrito?`, 422)
    }
  }
  if (addresses.length === 0 || addresses.some(isPrivateIp)) {
    throw new InspectError("Pikolete solo patrulla webs públicas, no direcciones internas.")
  }
}

async function readLimited(res: Response, limit: number): Promise<{ text: string; bytes: number }> {
  if (!res.body) return { text: "", bytes: 0 }
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    bytes += value.byteLength
    if (bytes >= limit) {
      await reader.cancel()
      break
    }
  }
  const merged = new Uint8Array(bytes)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk.subarray(0, Math.min(chunk.byteLength, bytes - offset)), offset)
    offset += chunk.byteLength
    if (offset >= bytes) break
  }
  return { text: new TextDecoder("utf-8").decode(merged), bytes }
}

const TLS_ERROR_CODES = new Set([
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "ERR_SSL_WRONG_VERSION_NUMBER",
])

function errorCode(err: unknown): string | undefined {
  const cause = (err as { cause?: { code?: string } } | undefined)?.cause
  return cause?.code ?? (err as { code?: string } | undefined)?.code
}

export function isTlsError(err: unknown): boolean {
  const code = errorCode(err)
  return code !== undefined && TLS_ERROR_CODES.has(code)
}

/** Descarga el HTML siguiendo redirecciones manualmente y validando cada salto. */
export async function fetchPage(startUrl: URL): Promise<FetchedPage> {
  const startedAt = performance.now()
  const deadline = startedAt + REQUEST_TIMEOUT_MS
  let current = startUrl
  let redirects = 0

  for (;;) {
    await assertPublicHost(current.hostname)

    const hopStart = performance.now()
    let res: Response
    try {
      res = await fetch(current, {
        redirect: "manual",
        cache: "no-store",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
        },
        signal: AbortSignal.timeout(Math.max(1_000, Math.round(deadline - performance.now()))),
      })
    } catch (err) {
      if (isTlsError(err)) throw err
      if ((err as Error)?.name === "TimeoutError") {
        throw new InspectError("La web tardó más de 10 segundos en responder. Multa por lentitud.", 504)
      }
      throw new InspectError("No pudimos conectar con la web. ¿Está online?", 502)
    }
    const responseTimeMs = performance.now() - hopStart

    const location = res.headers.get("location")
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel()
      redirects += 1
      if (redirects > MAX_REDIRECTS) {
        throw new InspectError("Demasiadas redirecciones: la web da vueltas como una rotonda.", 508)
      }
      current = new URL(location, current)
      if (current.protocol !== "http:" && current.protocol !== "https:") {
        throw new InspectError("La web redirige a un protocolo no soportado.", 422)
      }
      continue
    }

    const contentType = res.headers.get("content-type") ?? ""
    if (contentType && !/html|xml/i.test(contentType)) {
      await res.body?.cancel()
      throw new InspectError(`Esa URL no devuelve una página HTML (${contentType.split(";")[0]}).`, 422)
    }

    const { text, bytes } = await readLimited(res, MAX_HTML_BYTES)
    return {
      finalUrl: current,
      status: res.status,
      headers: res.headers,
      html: text,
      bytes,
      redirects,
      responseTimeMs: Math.round(responseTimeMs),
      downloadTimeMs: Math.round(performance.now() - startedAt),
    }
  }
}

/** Comprueba si existe un recurso del mismo sitio (robots.txt, sitemap.xml...). */
export async function probe(url: URL): Promise<{ ok: boolean; body: string }> {
  try {
    const res = await fetch(url, {
      redirect: "manual",
      cache: "no-store",
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(4_000),
    })
    if (res.status !== 200) {
      await res.body?.cancel()
      return { ok: false, body: "" }
    }
    const { text } = await readLimited(res, 64 * 1024)
    return { ok: true, body: text }
  } catch {
    return { ok: false, body: "" }
  }
}
