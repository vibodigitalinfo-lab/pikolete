#!/usr/bin/env node
// Pikolete Lead Radar (MVP). Audita una lista de dominios y saca solo contactos corporativos genéricos.
//
//   node tools/lead-radar/radar.mjs dominios.txt [--out leads] [--concurrency 3] [--suppress suppression.txt]
//
// Sin dependencias: Node 20+ (fetch nativo). Escribe <out>.csv y <out>.json.
// Reglas de privacidad que aplica (ver README.md):
//   - respeta robots.txt y se identifica con un User-Agent con URL de contacto,
//   - solo guarda emails de rol (info@, contacto@...) y teléfonos fijos; descarta emails nominativos y móviles,
//   - si detecta un NIF de persona física (autónomo) no guarda ningún contacto, solo la auditoría,
//   - cada dato lleva la URL de origen y la fecha, y la lista de exclusión (opt-out) se aplica antes de rastrear.

import { lookup } from "node:dns/promises"
import { readFile, writeFile } from "node:fs/promises"
import net from "node:net"
import { pathToFileURL } from "node:url"

const USER_AGENT = "Mozilla/5.0 (compatible; PikoleteRadar/0.1; +https://pikolete.com/radar-bot)"
const BOT_TOKEN = "pikoleteradar"
const TIMEOUT_MS = 10_000
const MAX_BYTES = 2 * 1024 * 1024
const MAX_REDIRECTS = 5
const MAX_EXTRA_PAGES = 3
const DELAY_BETWEEN_PAGES_MS = 1_000

// Prefijos de email que identifican un buzón de empresa, no a una persona.
const ROLE_LOCAL_PARTS =
  /^(info|informacion|contacto|contact|hola|hello|admin|administracion|oficina|office|recepcion|reception|reservas|booking|bookings|citas|ventas|sales|comercial|clientes|atencion|atencionalcliente|soporte|support|pedidos|presupuestos|consultas|clinica|taller|tienda|shop|secretaria|general|empresa)([._-]?[a-z0-9]+)?$/i
const CONTACT_LINK = /(contact|contacto|aviso-legal|aviso_legal|legal|quienes-somos|about|sobre-nosotros|privacidad)/i

// ---------------------------------------------------------------- red (con protección SSRF)

// Los tests sustituyen el DNS para no depender de la red.
export const resolver = { lookup }

const BLOCKED = new net.BlockList()
for (const [base, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 4], ["240.0.0.0", 4],
]) BLOCKED.addSubnet(base, bits, "ipv4")
for (const [base, bits] of [["::", 96], ["64:ff9b::", 96], ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]])
  BLOCKED.addSubnet(base, bits, "ipv6")

async function assertPublicHost(hostname) {
  const host = hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("host interno")
  const addrs = net.isIP(host) ? [{ address: host, family: net.isIP(host) }] : await resolver.lookup(host, { all: true })
  if (!addrs.length || addrs.some((a) => BLOCKED.check(a.address, a.family === 4 ? "ipv4" : "ipv6")))
    throw new Error("resuelve a una IP interna")
}

async function readLimited(res) {
  if (!res.body) return ""
  const reader = res.body.getReader()
  const chunks = []
  let bytes = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    bytes += value.byteLength
    if (bytes >= MAX_BYTES) {
      await reader.cancel()
      break
    }
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks))
}

/** GET que sigue redirecciones a mano para validar cada salto. */
async function get(url) {
  const started = performance.now()
  let current = new URL(url)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (current.protocol !== "http:" && current.protocol !== "https:") throw new Error("protocolo no admitido")
    await assertPublicHost(current.hostname)
    const res = await fetch(current, {
      redirect: "manual",
      headers: { "user-agent": USER_AGENT, accept: "text/html,*/*;q=0.8", "accept-language": "es-ES,es;q=0.9" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const location = res.headers.get("location")
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current)
      continue
    }
    const ttfbMs = Math.round(performance.now() - started)
    const body = await readLimited(res)
    return { url: current, status: res.status, headers: res.headers, body, ttfbMs, totalMs: Math.round(performance.now() - started) }
  }
  throw new Error("demasiadas redirecciones")
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- robots.txt

/** Devuelve una función path => permitido, con las reglas del grupo de nuestro bot o, si no hay, del grupo "*". */
async function loadRobots(origin) {
  let text = ""
  try {
    const res = await get(new URL("/robots.txt", origin))
    if (res.status >= 400 && res.status < 500) return () => true
    if (res.status >= 500) return () => false // ante la duda, no entrar
    text = res.body
  } catch {
    return () => true
  }
  const groups = []
  let group = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim()
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i)
    if (!m) continue
    const key = m[1].toLowerCase()
    const value = m[2].trim()
    if (key === "user-agent") {
      if (!group || group.rules.length) groups.push((group = { agents: [], rules: [] }))
      group.agents.push(value.toLowerCase())
    } else if (group && (key === "allow" || key === "disallow")) {
      group.rules.push({ allow: key === "allow", path: value })
    }
  }
  const mine = groups.find((g) => g.agents.some((a) => a !== "*" && BOT_TOKEN.includes(a)))
  const rules = (mine ?? groups.find((g) => g.agents.includes("*")))?.rules ?? []
  return (path) => {
    let best = null
    for (const r of rules) {
      if (!r.path) continue
      const re = new RegExp("^" + r.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"))
      if (re.test(path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)))
        best = r
    }
    return !best || best.allow
  }
}

// ---------------------------------------------------------------- extracción

const decode = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
const stripTags = (html) =>
  decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")

function extractEmails(html) {
  const found = new Set()
  for (const m of html.matchAll(/mailto:([^"'?\s>]+)/gi)) found.add(decodeURIComponent(m[1]))
  for (const m of stripTags(html).matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) found.add(m[0])
  return [...found]
    .map((e) => e.toLowerCase().replace(/[.,;]+$/, ""))
    .filter((e) => !/\.(png|jpe?g|gif|webp|svg)$/.test(e) && !/(sentry|wixpress|example|domain)\./.test(e))
}

/** Teléfonos españoles. Fijos empiezan por 8/9; móviles por 6/7 (a menudo personales: no se guardan). */
function extractPhones(html) {
  const found = new Set()
  const sources = [...html.matchAll(/tel:([+\d\s().-]{9,20})/gi)].map((m) => m[1])
  sources.push(...(stripTags(html).match(/(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{0,3}/g) ?? []))
  for (const raw of sources) {
    let d = raw.replace(/\D/g, "")
    if (d.startsWith("0034")) d = d.slice(4)
    if (d.startsWith("34") && d.length === 11) d = d.slice(2)
    if (/^[6789]\d{8}$/.test(d)) found.add(d)
  }
  return [...found].map((d) => ({ number: `+34 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`, mobile: /^[67]/.test(d) }))
}

/** CIF de sociedad (A, B... seguido de 7 dígitos y control) frente a NIF/NIE de persona física. */
function detectHolder(text) {
  const cif = text.match(/\b(?:C\.?I\.?F\.?|N\.?I\.?F\.?)[\s:.-]*([ABCDEFGHJNPQRSUVW][-\s]?\d{7}[0-9A-J])\b/i)
  if (cif) return { type: "sociedad", id: cif[1].replace(/[-\s]/g, "").toUpperCase() }
  const person = text.match(/\b(?:N\.?I\.?F\.?|D\.?N\.?I\.?|N\.?I\.?E\.?)[\s:.-]*([XYZ]?\d{7,8}[-\s]?[A-Z])\b/i)
  if (person) return { type: "persona_fisica", id: null } // no guardamos el DNI
  if (/\b(S\.?\s?L\.?U?\.?|S\.?\s?A\.?|S\.?\s?Coop\.?)(\s|,|$)/.test(text)) return { type: "sociedad", id: null }
  return { type: "desconocido", id: null }
}

function detectTech(html, headers) {
  const tech = []
  const has = (re) => re.test(html)
  if (has(/wp-content|wp-includes/i)) tech.push("WordPress")
  if (has(/static\.wixstatic\.com|wix\.com/i)) tech.push("Wix")
  if (has(/cdn\.shopify\.com/i)) tech.push("Shopify")
  if (has(/squarespace/i)) tech.push("Squarespace")
  if (has(/prestashop/i)) tech.push("PrestaShop")
  if (has(/\/media\/jui\/|joomla/i)) tech.push("Joomla")
  if (has(/elementor/i)) tech.push("Elementor")
  if (has(/googletagmanager\.com|google-analytics\.com/i)) tech.push("Google Analytics/GTM")
  if (has(/connect\.facebook\.net/i)) tech.push("Meta Pixel")
  if (has(/cookiebot|onetrust|complianz|cookie-law-info|cookieyes|iubenda/i)) tech.push("Gestor de cookies")
  const server = headers.get("server")
  if (server) tech.push(`Servidor: ${server.split(" ")[0]}`)
  return tech
}

// ---------------------------------------------------------------- auditoría de un dominio

async function audit(domain) {
  const now = new Date().toISOString()
  const row = { domain, checked_at: now, status: "ok", holder_type: "desconocido", holder_cif: "", issues: [], tech: [], contacts: [] }

  const robots = await loadRobots(`https://${domain}`)
  if (!robots("/")) return { ...row, status: "robots_bloquea" }

  // 1) HTTPS: ¿responde por https y el http redirige?
  let home
  try {
    home = await get(`https://${domain}/`)
  } catch (e) {
    row.issues.push({ code: "sin_https", detail: `HTTPS no responde (${e.cause?.code ?? e.message})` })
    try {
      home = await get(`http://${domain}/`)
    } catch {
      return { ...row, status: "inaccesible" }
    }
  }
  if (home.url.protocol === "https:") {
    try {
      const plain = await get(`http://${domain}/`)
      if (plain.url.protocol !== "https:") row.issues.push({ code: "http_sin_redireccion", detail: "http:// no redirige a https://" })
    } catch { /* algunos servidores no escuchan en el 80: no es un fallo */ }
  }
  if (home.status >= 400) return { ...row, status: `http_${home.status}` }

  // 2) Velocidad (servidor + peso del HTML). Aproximación, no un Lighthouse.
  if (home.ttfbMs > 1500) row.issues.push({ code: "servidor_lento", detail: `Primer byte en ${home.ttfbMs} ms` })
  const kb = Math.round(Buffer.byteLength(home.body) / 1024)
  if (kb > 500) row.issues.push({ code: "html_pesado", detail: `HTML de ${kb} KB` })

  // 3) Adaptación a móvil.
  const viewport = home.body.match(/<meta[^>]+name=["']viewport["'][^>]*>/i)?.[0] ?? ""
  if (!/width\s*=\s*device-width/i.test(viewport)) row.issues.push({ code: "no_movil", detail: "Sin meta viewport responsive" })

  // Extras baratos: SEO básico y privacidad.
  const title = decode(home.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim()
  if (!title) row.issues.push({ code: "sin_title", detail: "Página sin <title>" })
  if (!/<meta[^>]+name=["']description["']/i.test(home.body)) row.issues.push({ code: "sin_meta_description", detail: "Sin meta description" })
  const hasPrivacy = /privacidad|privacy|protecci[oó]n de datos/i.test(home.body)
  if (!hasPrivacy) row.issues.push({ code: "sin_politica_privacidad", detail: "No se ve enlace a política de privacidad" })
  row.title = title.slice(0, 120)
  row.tech = detectTech(home.body, home.headers)

  // Páginas de contacto / aviso legal del mismo dominio (máximo 3) para datos corporativos.
  const pages = [{ url: home.url.href, html: home.body }]
  const links = new Set()
  for (const m of home.body.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)) {
    try {
      const u = new URL(decode(m[1]), home.url)
      if (u.hostname === home.url.hostname && CONTACT_LINK.test(u.pathname) && robots(u.pathname)) links.add(u.origin + u.pathname)
    } catch { /* enlace roto */ }
  }
  for (const link of [...links].slice(0, MAX_EXTRA_PAGES)) {
    await sleep(DELAY_BETWEEN_PAGES_MS)
    try {
      const p = await get(link)
      if (p.status < 400) pages.push({ url: p.url.href, html: p.body })
    } catch { /* seguimos con lo que haya */ }
  }

  const allText = pages.map((p) => stripTags(p.html)).join(" ")
  const holder = detectHolder(allText)
  row.holder_type = holder.type
  row.holder_cif = holder.id ?? ""

  // Datos de una persona física (autónomo): se guarda la auditoría, nunca sus contactos.
  if (holder.type === "persona_fisica") return { ...row, contacts_note: "titular persona física: contactos no guardados" }

  const seen = new Set()
  let discarded = 0
  for (const p of pages) {
    for (const email of extractEmails(p.html)) {
      const [local, host] = email.split("@")
      const sameOrg = host === domain || domain.endsWith(`.${host}`) || host.endsWith(`.${domain}`)
      if (!ROLE_LOCAL_PARTS.test(local) || !sameOrg) {
        discarded++
        continue
      }
      if (!seen.has(email)) row.contacts.push({ type: "email", value: email, source_url: p.url, collected_at: now })
      seen.add(email)
    }
    for (const phone of extractPhones(p.html)) {
      if (phone.mobile) {
        discarded++
        continue
      }
      if (!seen.has(phone.number)) row.contacts.push({ type: "telefono", value: phone.number, source_url: p.url, collected_at: now })
      seen.add(phone.number)
    }
  }
  if (discarded) row.contacts_note = `${discarded} contacto(s) nominativo(s), móvil(es) o de otro dominio descartados`
  return row
}

// ---------------------------------------------------------------- CLI

function parseArgs(argv) {
  const args = { input: null, out: "leads", concurrency: 3, suppress: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--out") args.out = argv[++i]
    else if (a === "--concurrency") args.concurrency = Math.max(1, Math.min(10, Number(argv[++i]) || 3))
    else if (a === "--suppress") args.suppress = argv[++i]
    else args.input = a
  }
  return args
}

const toDomain = (line) =>
  line.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#].*$/, "")

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.input) {
    console.error("Uso: node tools/lead-radar/radar.mjs dominios.txt [--out leads] [--concurrency 3] [--suppress suppression.txt]")
    process.exit(1)
  }
  const lines = (await readFile(args.input, "utf8")).split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"))
  const suppressed = new Set(
    args.suppress ? (await readFile(args.suppress, "utf8")).split(/\r?\n/).map(toDomain).filter(Boolean) : []
  )
  const domains = [...new Set(lines.map(toDomain))].filter((d) => d.includes(".") && !suppressed.has(d))
  console.error(`Auditando ${domains.length} dominios (${suppressed.size} en la lista de exclusión)…`)

  const results = []
  let next = 0
  await Promise.all(
    Array.from({ length: args.concurrency }, async () => {
      while (next < domains.length) {
        const domain = domains[next++]
        try {
          results.push(await audit(domain))
        } catch (e) {
          results.push({ domain, checked_at: new Date().toISOString(), status: "error", error: e.message, issues: [], tech: [], contacts: [] })
        }
        const r = results.at(-1)
        console.error(`  ${r.domain.padEnd(32)} ${r.status.padEnd(14)} ${r.issues.length} fallos, ${r.contacts.length} contactos`)
      }
    })
  )
  results.sort((a, b) => a.domain.localeCompare(b.domain))

  await writeFile(`${args.out}.json`, JSON.stringify(results, null, 2))
  const header = ["dominio", "estado", "titular", "cif", "fallos", "detalle_fallos", "tecnologias", "email", "telefono", "fuente_contacto", "fecha"]
  const rows = results.map((r) => {
    const email = r.contacts.find((c) => c.type === "email")
    const phone = r.contacts.find((c) => c.type === "telefono")
    return [
      r.domain, r.status, r.holder_type, r.holder_cif, r.issues.map((i) => i.code).join(" "),
      r.issues.map((i) => i.detail).join("; "), r.tech.join(", "), email?.value, phone?.value,
      [...new Set([email?.source_url, phone?.source_url].filter(Boolean))].join(" "), r.checked_at,
    ].map(csvCell).join(",")
  })
  await writeFile(`${args.out}.csv`, [header.join(","), ...rows].join("\n") + "\n")
  console.error(`Listo: ${args.out}.csv y ${args.out}.json`)
}

// Se puede importar (tests) sin lanzar el rastreo.
if (import.meta.url === pathToFileURL(process.argv[1]).href) main()

export { audit, detectHolder, extractEmails, extractPhones, loadRobots }
