// node --test tools/lead-radar/radar.test.mjs   (sin red: fetch simulado con páginas de ejemplo)
import assert from "node:assert/strict"
import { test } from "node:test"

import { audit, detectHolder, extractEmails, extractPhones, resolver } from "./radar.mjs"

resolver.lookup = async () => [{ address: "93.184.215.14", family: 4 }]

const HOME = `<!doctype html><html><head><title>Clínica Dental Ejemplo</title></head><body>
<a href="/contacto">Contacto</a> <a href="/aviso-legal">Aviso legal</a>
<script src="/wp-content/themes/x.js"></script>
<p>Llámanos: <a href="tel:+34915551234">91 555 12 34</a> · WhatsApp 612 345 678</p>
<p>Escríbenos a <a href="mailto:info@clinica-ejemplo.es">info</a> o a maria.garcia@clinica-ejemplo.es</p>
</body></html>`
const LEGAL = `<html><body>Clínica Dental Ejemplo S.L. con CIF B12345674, domicilio en Madrid.
Contacto: citas@clinica-ejemplo.es y empleado@gmail.com</body></html>`

function fakeFetch(pages) {
  return async (url) => {
    const u = new URL(url)
    if (u.protocol === "http:") return new Response(null, { status: 301, headers: { location: `https://${u.host}${u.pathname}` } })
    const body = pages[u.pathname]
    return new Response(body ?? "", { status: body === undefined ? 404 : 200, headers: { "content-type": "text/html", server: "nginx/1.2" } })
  }
}

test("extrae teléfonos fijos y marca los móviles", () => {
  const phones = extractPhones(HOME)
  assert.deepEqual(phones.find((p) => !p.mobile)?.number, "+34 915 551 234")
  assert.ok(phones.some((p) => p.mobile))
})

test("encuentra emails en mailto y en texto", () => {
  assert.deepEqual(extractEmails(HOME).sort(), ["info@clinica-ejemplo.es", "maria.garcia@clinica-ejemplo.es"])
})

test("distingue sociedad de persona física", () => {
  assert.equal(detectHolder("Pikolete S.L. CIF: B12345674").type, "sociedad")
  assert.equal(detectHolder("Titular: Juan Pérez, NIF 12345678Z").type, "persona_fisica")
})

test("auditoría completa: fallos, tecnología y solo contactos genéricos", async (t) => {
  t.mock.method(globalThis, "fetch", fakeFetch({ "/": HOME, "/contacto": HOME, "/aviso-legal": LEGAL, "/robots.txt": "User-agent: *\nDisallow: /privado" }))
  const r = await audit("clinica-ejemplo.es")
  assert.equal(r.status, "ok")
  assert.equal(r.holder_type, "sociedad")
  assert.equal(r.holder_cif, "B12345674")
  const codes = r.issues.map((i) => i.code)
  assert.ok(codes.includes("no_movil") && codes.includes("sin_meta_description") && codes.includes("sin_politica_privacidad"))
  assert.ok(r.tech.includes("WordPress"))
  assert.deepEqual(r.contacts.map((c) => c.value).sort(), ["+34 915 551 234", "citas@clinica-ejemplo.es", "info@clinica-ejemplo.es"])
  assert.ok(r.contacts.every((c) => c.source_url && c.collected_at))
})

test("autónomo: guarda la auditoría pero ningún contacto", async (t) => {
  t.mock.method(globalThis, "fetch", fakeFetch({ "/": HOME, "/aviso-legal": "Titular: Juan Pérez, NIF 12345678Z", "/robots.txt": "" }))
  const r = await audit("clinica-ejemplo.es")
  assert.equal(r.holder_type, "persona_fisica")
  assert.equal(r.contacts.length, 0)
})

test("respeta robots.txt", async (t) => {
  t.mock.method(globalThis, "fetch", fakeFetch({ "/": HOME, "/robots.txt": "User-agent: *\nDisallow: /" }))
  assert.equal((await audit("clinica-ejemplo.es")).status, "robots_bloquea")
})

test("no visita IPs internas (SSRF)", async () => {
  const r = await audit("127.0.0.1")
  assert.equal(r.status, "inaccesible")
})
