import "server-only";

import { cacheLife } from "next/cache";

import { redisConfig } from "@/lib/rate-limit";

import { registrableDomain } from "./engine";
import { POPULAR_DOMAINS } from "./popular";
import type { TrustResult } from "./types";

// Clave nueva desde que solo publicamos tiendas con buen resultado: la anterior incluía cualquier web comprobada.
const KEY = "pk:trust:published";
const MAX_DOMAINS = 5_000;

/** Cuántas veces se ha comprobado cada dominio publicable. */
const DEMAND_KEY = "pk:trust:demand";
const MAX_DEMAND = 20_000;

/**
 * Comprobaciones a partir de las cuales una ficha entra en Google. Una ficha que solo ha pedido una persona
 * es casi plantilla: miles de ellas en un dominio nuevo es lo que la política de spam llama «contenido a escala».
 * Las tiendas del directorio entran siempre.
 */
const MIN_CHECKS_TO_INDEX = 2;

/** Dominios que no queremos publicar en páginas indexables aunque alguien los compruebe. */
const BLOCKED_WORDS =
  /(porn|xxx|sex|adult|escort|hentai|onlyfans|casino|apuesta|bet|poker|loteria|lottery|viagra|cialis|pharma|farmacia-online|crack|warez|torrent|hack|nude|desnud)/i;

const DOMAIN_RE =
  /^(?=.{4,100}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** Convierte lo que escribió el usuario en el dominio que da nombre a su página (sin www ni subdominios). */
export function domainSlug(input: string): string | null {
  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(input.trim())
      ? input.trim()
      : `https://${input.trim()}`;
    const domain = registrableDomain(new URL(withProtocol).hostname);
    return DOMAIN_RE.test(domain) ? domain : null;
  } catch {
    return null;
  }
}

export function isValidDomainSlug(slug: string): boolean {
  return DOMAIN_RE.test(slug);
}

export function isPublishable(domain: string): boolean {
  // pikolete.com tampoco: una página "¿Es fiable pikolete.com?" con el dominio recién registrado no nos ayuda.
  return (
    DOMAIN_RE.test(domain) &&
    !BLOCKED_WORDS.test(domain) &&
    domain !== "pikolete.com"
  );
}

/**
 * Solo damos página pública a tiendas en las que no vemos señales graves. Un blog no pinta nada en
 * «¿Es fiable…?», y publicar «Señales de riesgo» junto al nombre de alguien sería dejarle mal en Google
 * por una revisión automática. Esos resultados se ven en el comprobador y no se guardan.
 */
export function isPublishableResult(
  domain: string,
  result: TrustResult,
): boolean {
  return (
    isPublishable(domain) &&
    result.kind === "tienda" &&
    (result.level === "fiable" || result.level === "precaucion")
  );
}

async function redis(
  commands: Array<Array<string | number>>,
): Promise<Array<{ result?: unknown }> | null> {
  const config = redisConfig();
  if (!config) return null;
  try {
    const res = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands.map((c) => c.map(String))),
      signal: AbortSignal.timeout(2_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Array<{ result?: unknown }>;
  } catch {
    return null;
  }
}

/** Guarda el dominio publicable para enlazarlo desde /es-fiable y el sitemap. Solo el nombre, nada del usuario. */
export async function recordChecked(domain: string): Promise<void> {
  if (!isPublishable(domain)) return;
  await redis([
    ["ZADD", KEY, Date.now(), domain],
    ["ZREMRANGEBYRANK", KEY, 0, -(MAX_DOMAINS + 1)],
    ["ZINCRBY", DEMAND_KEY, 1, domain],
    ["ZREMRANGEBYRANK", DEMAND_KEY, 0, -(MAX_DEMAND + 1)],
  ]);
}

/**
 * Si un dominio puede tener ficha: está en el directorio o ya pasó por el comprobador (que tiene límite por IP).
 * Así nadie puede usar /es-fiable/<dominio> para que el servidor visite miles de webs inventadas.
 * Sin Redis (desarrollo, o si Upstash no responde) no se bloquea nada.
 */
export async function isKnownDomain(domain: string): Promise<boolean> {
  "use cache";
  if (POPULAR_DOMAINS.includes(domain) || !redisConfig()) {
    cacheLife("hours");
    return true;
  }
  const out = await redis([["ZSCORE", KEY, domain]]);
  const known = !out || (out[0]?.result !== null && out[0]?.result !== undefined);
  // Un «no» dura poco: el dominio puede pasar por el comprobador justo después.
  if (known) cacheLife("hours");
  else cacheLife("minutes");
  return known;
}

/** Últimos dominios comprobados, del más reciente al más antiguo. */
export async function recentDomains(limit: number): Promise<string[]> {
  const out = await redis([["ZREVRANGE", KEY, 0, limit - 1]]);
  const list = out?.[0]?.result;
  return Array.isArray(list)
    ? list.filter((d): d is string => typeof d === "string" && isPublishable(d))
    : [];
}

/** Dominios que ya cumplen MIN_CHECKS_TO_INDEX. Cacheado: lo leen el sitemap y cada ficha. */
async function demandedDomains(): Promise<Set<string>> {
  "use cache";
  cacheLife("hours");
  const out = await redis([
    ["ZRANGEBYSCORE", DEMAND_KEY, MIN_CHECKS_TO_INDEX, "+inf"],
  ]);
  const list = out?.[0]?.result;
  return new Set(
    Array.isArray(list)
      ? list.filter((d): d is string => typeof d === "string")
      : [],
  );
}

/** Si la ficha de un dominio publicable debe indexarse (la ficha existe igual, solo cambia el noindex). */
export async function isIndexable(domain: string): Promise<boolean> {
  if (!isPublishable(domain)) return false;
  return (
    POPULAR_DOMAINS.includes(domain) || (await demandedDomains()).has(domain)
  );
}

/** Fichas de usuarios que ya pueden ir al sitemap, de la más reciente a la más antigua. */
export async function indexableRecentDomains(limit: number): Promise<string[]> {
  const [recent, demanded] = await Promise.all([
    recentDomains(MAX_DOMAINS),
    demandedDomains(),
  ]);
  return recent.filter((d) => demanded.has(d)).slice(0, limit);
}
