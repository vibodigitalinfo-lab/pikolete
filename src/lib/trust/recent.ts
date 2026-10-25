import "server-only"

import { redisConfig } from "@/lib/rate-limit"

import { registrableDomain } from "./engine"

const KEY = "pk:trust:recent"
const MAX_DOMAINS = 5_000

/** Dominios que no queremos publicar en páginas indexables aunque alguien los compruebe. */
const BLOCKED_WORDS =
  /(porn|xxx|sex|adult|escort|hentai|onlyfans|casino|apuesta|bet|poker|loteria|lottery|viagra|cialis|pharma|farmacia-online|crack|warez|torrent|hack|nude|desnud)/i

const DOMAIN_RE = /^(?=.{4,100}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/

/** Convierte lo que escribió el usuario en el dominio que da nombre a su página (sin www ni subdominios). */
export function domainSlug(input: string): string | null {
  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`
    const domain = registrableDomain(new URL(withProtocol).hostname)
    return DOMAIN_RE.test(domain) ? domain : null
  } catch {
    return null
  }
}

export function isValidDomainSlug(slug: string): boolean {
  return DOMAIN_RE.test(slug)
}

export function isPublishable(domain: string): boolean {
  // pikolete.com tampoco: una página "¿Es fiable pikolete.com?" con el dominio recién registrado no nos ayuda.
  return DOMAIN_RE.test(domain) && !BLOCKED_WORDS.test(domain) && domain !== "pikolete.com"
}

async function redis(commands: Array<Array<string | number>>): Promise<Array<{ result?: unknown }> | null> {
  const config = redisConfig()
  if (!config) return null
  try {
    const res = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands.map((c) => c.map(String))),
      signal: AbortSignal.timeout(2_000),
    })
    if (!res.ok) return null
    return (await res.json()) as Array<{ result?: unknown }>
  } catch {
    return null
  }
}

/** Guarda el dominio comprobado para enlazarlo desde /es-fiable y el sitemap. Solo el nombre, nada del usuario. */
export async function recordChecked(domain: string): Promise<void> {
  if (!isPublishable(domain)) return
  await redis([
    ["ZADD", KEY, Date.now(), domain],
    ["ZREMRANGEBYRANK", KEY, 0, -(MAX_DOMAINS + 1)],
  ])
}

/** Últimos dominios comprobados, del más reciente al más antiguo. */
export async function recentDomains(limit: number): Promise<string[]> {
  const out = await redis([["ZREVRANGE", KEY, 0, limit - 1]])
  const list = out?.[0]?.result
  return Array.isArray(list) ? list.filter((d): d is string => typeof d === "string" && isPublishable(d)) : []
}
