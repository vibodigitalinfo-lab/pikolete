import "server-only"

import * as cheerio from "cheerio"

import { fetchPage, InspectError, isTlsError, normalizeUrl, USER_AGENT, type FetchedPage } from "@/lib/audit/fetch-page"

import type { SignalStatus, TrustLevel, TrustResult, TrustSignal } from "./types"

const STATUS_FACTOR: Record<Exclude<SignalStatus, "unknown">, number> = { good: 1, warn: 0.5, bad: 0 }

/** Segundos niveles habituales en España y Latinoamérica (tienda.com.mx → el dominio es tienda.com.mx). */
const SECOND_LEVELS = new Set([
  "com.es", "org.es", "nom.es", "gob.es", "edu.es",
  "com.mx", "org.mx", "gob.mx", "edu.mx",
  "com.ar", "org.ar", "gob.ar",
  "com.co", "org.co", "gov.co",
  "com.pe", "org.pe", "gob.pe",
  "cl", "com.ec", "com.uy", "com.py", "com.bo", "com.ve", "com.do", "com.gt", "com.pa", "co.cr",
  "co.uk", "com.br", "com.au",
])

/** Extensiones baratas que aparecen mucho en tiendas falsas. No son malas por sí solas. */
const RISKY_TLDS = new Set([
  "top", "xyz", "shop", "store", "online", "site", "icu", "buzz", "click", "cyou", "sbs", "cfd", "bond",
  "vip", "live", "life", "fun", "monster", "rest", "lat", "today", "space", "website", "club", "best",
])

const BAIT_WORDS = /(outlet|oferta|ofertas|descuento|barat|liquidacion|liquidación|black-?friday|rebajas|chollo|promo|sale|official|oficial)/i

export function registrableDomain(host: string): string {
  const labels = host.toLowerCase().replace(/^www\./, "").split(".")
  if (labels.length <= 2) return labels.join(".")
  const lastTwo = labels.slice(-2).join(".")
  return SECOND_LEVELS.has(lastTwo) ? labels.slice(-3).join(".") : lastTwo
}

/** Fecha de alta del dominio por RDAP (el sucesor público de WHOIS). null si el registro no la publica. */
async function domainAgeDays(domain: string): Promise<number | null> {
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      // rdap.org responde 403 a peticiones sin User-Agent de navegador o bot identificado.
      headers: { Accept: "application/rdap+json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = (await res.json()) as { events?: Array<{ eventAction?: string; eventDate?: string }> }
    const registered = data.events?.find((e) => e.eventAction === "registration")?.eventDate
    const time = registered ? Date.parse(registered) : NaN
    if (Number.isNaN(time)) return null
    return Math.max(0, Math.floor((Date.now() - time) / 86_400_000))
  } catch {
    return null
  }
}

async function loadPage(input: string): Promise<{ page: FetchedPage; sslError: boolean }> {
  const url = normalizeUrl(input)
  try {
    return { page: await fetchPage(url), sslError: false }
  } catch (err) {
    if (isTlsError(err) && url.protocol === "https:") {
      const fallback = new URL(url)
      fallback.protocol = "http:"
      try {
        return { page: await fetchPage(fallback), sslError: true }
      } catch {
        throw new InspectError("La web tiene un certificado de seguridad inválido y no responde sin él. Mala señal.", 502)
      }
    }
    if (err instanceof InspectError && (err.status === 502 || err.status === 504) && !/^https:\/\//i.test(input.trim())) {
      const fallback = new URL(url)
      fallback.protocol = "http:"
      return { page: await fetchPage(fallback), sslError: false }
    }
    throw err
  }
}

const formatAge = (days: number) => {
  if (days < 60) return `${days} días`
  if (days < 730) return `${Math.round(days / 30)} meses`
  return `${Math.floor(days / 365)} años`
}

export function computeTrustScore(signals: TrustSignal[]): number {
  const known = signals.filter((s) => s.status !== "unknown")
  const total = known.reduce((sum, s) => sum + s.weight, 0)
  if (total === 0) return 50
  const earned = known.reduce((sum, s) => sum + s.weight * STATUS_FACTOR[s.status as keyof typeof STATUS_FACTOR], 0)
  return Math.round((earned / total) * 100)
}

export function levelFor(score: number): TrustLevel {
  if (score >= 75) return "fiable"
  if (score >= 50) return "precaucion"
  return "riesgo"
}

export async function runTrustCheck(input: string): Promise<TrustResult> {
  const startDomain = registrableDomain(normalizeUrl(input).hostname)
  const [{ page, sslError }, startAge] = await Promise.all([loadPage(input), domainAgeDays(startDomain)])

  const finalHost = page.finalUrl.hostname.toLowerCase()
  const finalDomain = registrableDomain(finalHost)
  const ageDays = finalDomain === startDomain ? startAge : await domainAgeDays(finalDomain)

  return analyzeTrust({ input, finalUrl: page.finalUrl, status: page.status, html: page.html, sslError, ageDays })
}

/** Parte sin red del análisis: recibe la página ya descargada y la edad del dominio. */
export function analyzeTrust({
  input,
  finalUrl,
  status,
  html,
  sslError,
  ageDays,
}: {
  input: string
  finalUrl: URL
  status: number
  html: string
  sslError: boolean
  ageDays: number | null
}): TrustResult {
  const startDomain = registrableDomain(normalizeUrl(input).hostname)
  const finalHost = finalUrl.hostname.toLowerCase()
  const finalDomain = registrableDomain(finalHost)

  const $ = cheerio.load(html)
  const pageTitle = $("title").first().text()
  $("script, style, noscript, template").remove()
  const text = $("body").text().replace(/\s+/g, " ")
  const lower = text.toLowerCase()
  const links = $("a")
    .map((_, el) => `${$(el).text()} ${$(el).attr("href") ?? ""}`.toLowerCase())
    .get()
  const hasLink = (re: RegExp) => links.some((l) => re.test(l))

  // Las grandes tiendas suelen bloquear a los robots (Cloudflare, Akamai…) o pintar todo con JavaScript.
  // Sin contenido no podemos juzgar el aviso legal ni el contacto: mejor "sin datos" que un falso "mal".
  const readable =
    status < 400 &&
    links.length >= 5 &&
    text.length >= 300 &&
    !/just a moment|attention required|access denied|acceso denegado|captcha|are you a robot|verificando/i.test(pageTitle)

  const isShop =
    /(carrito|cesta|añadir al carrito|agregar al carrito|comprar ahora|checkout|finalizar compra|envío gratis|envio gratis)/i.test(lower) ||
    $('[class*="cart" i], [id*="cart" i], [class*="product" i]').length > 2

  const signals: TrustSignal[] = []
  const add = (s: TrustSignal) => signals.push(s)

  // 1. Antigüedad del dominio
  if (ageDays === null) {
    add({
      id: "age",
      label: "Antigüedad del dominio",
      status: "unknown",
      detail: `El registro de ${finalDomain} no publica la fecha de alta. Busca opiniones de otros compradores antes de pagar.`,
      weight: 25,
    })
  } else if (ageDays < 180) {
    add({
      id: "age",
      label: "Antigüedad del dominio",
      status: "bad",
      detail: `El dominio se registró hace solo ${formatAge(ageDays)}. Casi todas las tiendas falsas tienen menos de 6 meses.`,
      weight: 25,
    })
  } else if (ageDays < 730) {
    add({
      id: "age",
      label: "Antigüedad del dominio",
      status: "warn",
      detail: `El dominio tiene ${formatAge(ageDays)}. Es bastante nuevo: no es malo, pero conviene mirar más señales.`,
      weight: 25,
    })
  } else {
    add({
      id: "age",
      label: "Antigüedad del dominio",
      status: "good",
      detail: `El dominio existe desde hace ${formatAge(ageDays)}. Las webs fraudulentas rara vez duran tanto.`,
      weight: 25,
    })
  }

  // 2. Conexión segura
  const https = finalUrl.protocol === "https:" && !sslError
  add({
    id: "https",
    label: "Conexión segura (HTTPS)",
    status: https ? "good" : "bad",
    detail: sslError
      ? "El certificado de seguridad es inválido o ha caducado. No metas datos de pago aquí."
      : https
        ? "La conexión va cifrada con un certificado válido. Es lo mínimo, también lo tienen muchas webs falsas."
        : "La web no usa HTTPS: lo que escribas viaja sin cifrar. No pagues ni des datos aquí.",
    weight: 15,
  })

  const contentStart = signals.length

  // 3. Aviso legal / términos
  const legal = hasLink(/aviso[\s-]?legal|t[eé]rminos|condiciones|legal|terms/)
  add({
    id: "legal",
    label: "Aviso legal y condiciones",
    status: legal ? "good" : "bad",
    detail: legal
      ? "Tiene enlace al aviso legal o a las condiciones de uso."
      : "No encontramos aviso legal ni condiciones. En España la ley (LSSI) obliga a publicarlos.",
    weight: 12,
  })

  // 4. Identificación de la empresa
  const upper = text.toUpperCase()
  const taxId =
    /\b[ABCDEFGHJNPQRSUVW][-\s.]?\d{7}[-\s.]?[0-9A-J]\b/.test(upper) || // CIF
    /\bNIF[:\s]*\d{8}[-\s]?[A-Z]\b/.test(upper) ||
    /\bRFC[:\s]*[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}\b/.test(upper) || // México
    /\bCUIT[:\s]*\d{2}-?\d{8}-?\d\b/.test(upper) || // Argentina
    /\b(RUT|RUC|NIT)[:\s]*[\d.-]{7,14}/.test(upper)
  add({
    id: "company",
    label: "Empresa identificada",
    status: taxId ? "good" : legal ? "warn" : "bad",
    detail: taxId
      ? "En la portada aparece un número fiscal (CIF, NIF, RFC…). Puedes comprobar que la empresa existe."
      : "No vemos un CIF o número fiscal en la portada. Ábrelo en el aviso legal y búscalo en Google.",
    weight: 10,
  })

  // 5. Datos de contacto
  const email =
    hasLink(/mailto:/) ||
    [...text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.([a-z]{2,})/gi)].some((m) => !/^(png|jpe?g|webp|svg|gif)$/i.test(m[1]))
  const phone =
    hasLink(/tel:|wa\.me|whatsapp/) ||
    /\+\d{2,3}[\s.-]?\d[\d\s.-]{7,}/.test(text) ||
    /(tel[ée]fono|tel\.|ll[aá]manos|whatsapp)[^\d]{0,15}\d[\d\s.-]{7,}/i.test(text)
  const address = /\b(c\/|calle|avda\.?|avenida|plaza|pol[ií]gono|carretera|col\.|colonia|carrera|jr\.)\s/i.test(text)
  const contactCount = [email, phone, address].filter(Boolean).length
  add({
    id: "contact",
    label: "Datos de contacto",
    status: contactCount >= 2 ? "good" : contactCount === 1 ? "warn" : hasLink(/contact/) ? "warn" : "bad",
    detail:
      contactCount >= 2
        ? `Muestra ${[email && "email", phone && "teléfono", address && "dirección"].filter(Boolean).join(", ")}.`
        : contactCount === 1
          ? "Solo da una forma de contacto. Las tiendas serias suelen dar email, teléfono y dirección."
          : "No vemos email, teléfono ni dirección en la portada.",
    weight: 10,
  })

  // 6. Devoluciones y envíos (solo tiendas)
  if (isShop) {
    const returns = hasLink(/devoluci|reembolso|desistimiento|cambios|env[ií]os|returns|shipping/)
    add({
      id: "returns",
      label: "Política de devoluciones",
      status: returns ? "good" : "bad",
      detail: returns
        ? "Explica cómo son los envíos y las devoluciones."
        : "Es una tienda y no enlaza ninguna política de devoluciones ni envíos.",
      weight: 8,
    })
  }

  // 7. Privacidad
  const privacy = hasLink(/privacidad|privacy|protecci[oó]n de datos|cookies/)
  add({
    id: "privacy",
    label: "Política de privacidad",
    status: privacy ? "good" : "warn",
    detail: privacy ? "Tiene política de privacidad." : "No encontramos política de privacidad.",
    weight: 5,
  })

  // 8. Descuentos exagerados
  if (isShop) {
    const discounts = [...text.matchAll(/-\s?(\d{2})\s?%|(\d{2})\s?%\s?(?:dto|descuento|off)/gi)]
      .map((m) => Number(m[1] ?? m[2]))
      .filter((n) => n >= 70)
    add({
      id: "discounts",
      label: "Descuentos creíbles",
      status: discounts.length >= 3 ? "bad" : discounts.length > 0 ? "warn" : "good",
      detail:
        discounts.length >= 3
          ? `Hay ${discounts.length} descuentos del 70 % o más. Es el gancho típico de las tiendas falsas.`
          : discounts.length > 0
            ? "Hay algún descuento del 70 % o más. Compara el precio con otras tiendas."
            : "No vemos descuentos desorbitados en la portada.",
      weight: 8,
    })
  }

  // 9. Formas de pago
  const safePay = /(paypal|bizum|visa|mastercard|stripe|redsys|apple pay|google pay|contra ?reembolso|mercado ?pago|klarna|amex)/i.test(lower)
  const transferOnly = !safePay && /(transferencia|western union|criptomoneda|bitcoin)/i.test(lower)
  if (safePay || transferOnly || isShop) {
    add({
      id: "payment",
      label: "Formas de pago con protección",
      status: safePay ? "good" : transferOnly ? "bad" : "unknown",
      detail: safePay
        ? "Menciona pagos con protección al comprador (tarjeta, PayPal, Bizum…)."
        : transferOnly
          ? "Solo vemos transferencia u otros pagos sin protección. Si algo sale mal, no podrás recuperar el dinero."
          : "No vemos en la portada qué formas de pago acepta. Revísalo antes de pagar.",
      weight: 8,
    })
  }

  // 10. Redes sociales
  const social = hasLink(/(?:^|[/.\s])(facebook|instagram|twitter|x|tiktok|youtube|linkedin|pinterest)\.com\//)
  add({
    id: "social",
    label: "Redes sociales",
    status: social ? "good" : "warn",
    detail: social
      ? "Enlaza perfiles en redes sociales. Entra y mira si tienen actividad y comentarios reales."
      : "No enlaza ninguna red social.",
    weight: 4,
  })

  if (!readable) {
    signals.splice(contentStart, signals.length - contentStart, {
      id: "content",
      label: "Contenido de la web",
      status: "unknown",
      detail:
        "La web no deja que la leamos (tiene protección contra robots o se carga solo con JavaScript), así que no hemos podido revisar su aviso legal, contacto ni devoluciones. Míralos tú antes de pagar.",
      weight: 0,
    })
  }

  // 11. Nombre del dominio
  const tld = finalDomain.split(".").pop() ?? ""
  const domainName = finalDomain.slice(0, finalDomain.length - tld.length - 1)
  const reasons = [
    RISKY_TLDS.has(tld) && `la extensión .${tld} se usa mucho en tiendas falsas`,
    BAIT_WORDS.test(domainName) && "el nombre incluye palabras gancho (outlet, ofertas…)",
    (domainName.match(/-/g)?.length ?? 0) >= 2 && "el nombre tiene varios guiones",
  ].filter(Boolean) as string[]
  add({
    id: "domain",
    label: "Nombre del dominio",
    status: reasons.length >= 2 ? "bad" : reasons.length === 1 ? "warn" : "good",
    detail: reasons.length
      ? `Ojo: ${reasons.join(" y ")}.`
      : "El nombre del dominio no tiene rasgos típicos de webs fraudulentas.",
    weight: 6,
  })

  // 12. Redirección a otro dominio
  if (finalDomain !== startDomain) {
    add({
      id: "redirect",
      label: "Redirección a otro dominio",
      status: "warn",
      detail: `La dirección que pegaste te lleva a ${finalDomain}. Asegúrate de que es la web que esperabas.`,
      weight: 6,
    })
  }

  let score = computeTrustScore(signals)
  // Un dominio de pocos meses o sin HTTPS no puede salir como "fiable" aunque lo demás esté bien.
  const redFlag = (ageDays !== null && ageDays < 180) || !https || signals.some((s) => s.id === "domain" && s.status === "bad")
  if (ageDays !== null && ageDays < 180) score = Math.min(score, 49)
  if (!https) score = Math.min(score, 45)
  if (!readable && redFlag) score = Math.min(score, 45)

  return {
    url: input,
    finalUrl: finalUrl.toString(),
    host: finalHost.replace(/^www\./, ""),
    score,
    level: readable || redFlag ? levelFor(score) : "incompleto",
    signals,
    domainAgeDays: ageDays,
    checkedAt: new Date().toISOString(),
  }
}
