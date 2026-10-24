import "server-only"

import * as cheerio from "cheerio"

import { fetchPage, InspectError, isTlsError, normalizeUrl, probe, type FetchedPage } from "./fetch-page"
import type { AuditCheck, AuditMetrics, AuditResult, CheckStatus } from "./types"

const STATUS_FACTOR: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 }

export function computeScore(checks: AuditCheck[]): number {
  const total = checks.reduce((sum, c) => sum + c.weight, 0)
  if (total === 0) return 0
  const earned = checks.reduce((sum, c) => sum + c.weight * STATUS_FACTOR[c.status], 0)
  return Math.round((earned / total) * 100)
}

export function gradeFor(score: number): AuditResult["grade"] {
  if (score >= 90) return "A"
  if (score >= 75) return "B"
  if (score >= 60) return "C"
  if (score >= 40) return "D"
  return "F"
}

function ticketIdFor(url: string, date: Date): string {
  let hash = 0
  for (const ch of `${url}|${date.getTime()}`) hash = (Math.imul(31, hash) + ch.charCodeAt(0)) | 0
  return `PK-${(hash >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(0, 6)}`
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

async function loadPage(input: string): Promise<{ page: FetchedPage; sslError: boolean }> {
  const url = normalizeUrl(input)
  try {
    return { page: await fetchPage(url), sslError: false }
  } catch (err) {
    // Certificado roto: seguimos inspeccionando por http para no dejar al usuario sin informe.
    if (isTlsError(err) && url.protocol === "https:") {
      const fallback = new URL(url)
      fallback.protocol = "http:"
      try {
        return { page: await fetchPage(fallback), sslError: true }
      } catch {
        throw new InspectError("El certificado SSL de la web es inválido y no responde por http.", 502)
      }
    }
    // Si el usuario no escribió protocolo y https no responde, probamos http.
    if (err instanceof InspectError && (err.status === 502 || err.status === 504) && !/^https:\/\//i.test(input.trim())) {
      const fallback = new URL(url)
      fallback.protocol = "http:"
      return { page: await fetchPage(fallback), sslError: false }
    }
    throw err
  }
}

export async function runAudit(input: string): Promise<Omit<AuditResult, "unlocked">> {
  const { page, sslError } = await loadPage(input)
  const $ = cheerio.load(page.html)
  const origin = page.finalUrl.origin
  const isHttps = page.finalUrl.protocol === "https:" && !sslError

  const [robots, sitemap] = await Promise.all([
    probe(new URL("/robots.txt", origin)),
    probe(new URL("/sitemap.xml", origin)),
  ])

  const meta = (selector: string) => $(selector).first().attr("content")?.trim() || null
  const header = (name: string) => page.headers.get(name)

  const title = $("head > title").first().text().trim() || $("title").first().text().trim() || null
  const description = meta('meta[name="description" i]')
  const robotsMeta = meta('meta[name="robots" i]')?.toLowerCase() ?? ""
  const canonical = $('link[rel="canonical" i]').attr("href")?.trim() || null
  const lang = $("html").attr("lang")?.trim() || null
  const viewport = meta('meta[name="viewport" i]')
  const charset = $("meta[charset]").length > 0 || $('meta[http-equiv="content-type" i]').length > 0
  const favicon = $('link[rel~="icon" i], link[rel="apple-touch-icon" i]').length > 0
  const jsonLd = $('script[type="application/ld+json"]').length

  const og = {
    "og:title": meta('meta[property="og:title"]'),
    "og:description": meta('meta[property="og:description"]'),
    "og:image": meta('meta[property="og:image"]'),
    "og:url": meta('meta[property="og:url"]'),
  }
  const ogMissing = Object.entries(og)
    .filter(([, v]) => !v)
    .map(([k]) => k)
  const twitterCard = meta('meta[name="twitter:card" i]')

  const h1s = $("h1")
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get()
  const h2Count = $("h2").length
  const headingLevels = $("h1, h2, h3, h4, h5, h6")
    .map((_, el) => Number((el as { tagName: string }).tagName.slice(1)))
    .get() as number[]
  const skippedLevel = headingLevels.some((level, i) => i > 0 && level - headingLevels[i - 1] > 1)

  const images = $("img")
  const imagesWithoutAlt = images.filter((_, el) => $(el).attr("alt") === undefined).length

  const blockingScripts = $("head script[src]").filter((_, el) => {
    const s = $(el)
    return s.attr("async") === undefined && s.attr("defer") === undefined && s.attr("type") !== "module"
  }).length

  const bodyText = $("body").clone().find("script, style, noscript, svg").remove().end().text()
  const wordCount = bodyText.split(/\s+/).filter((w) => w.length > 1).length

  const encoding = header("content-encoding")?.toLowerCase() ?? ""
  const htmlSizeKb = Math.round((page.bytes / 1024) * 10) / 10
  const hasHsts = Boolean(header("strict-transport-security"))
  const csp = header("content-security-policy") ?? ""
  const securityHeaders = {
    "X-Content-Type-Options": Boolean(header("x-content-type-options")),
    "X-Frame-Options / CSP frame-ancestors": Boolean(header("x-frame-options")) || /frame-ancestors/i.test(csp),
    "Referrer-Policy": Boolean(header("referrer-policy")),
  }
  const missingSecurityHeaders = Object.entries(securityHeaders)
    .filter(([, ok]) => !ok)
    .map(([k]) => k)

  const sitemapFound = sitemap.ok || /^\s*sitemap:/im.test(robots.body)
  const host = page.finalUrl.hostname

  const checks: AuditCheck[] = []

  // ───────────── SEO ─────────────
  checks.push(
    !title
      ? {
          id: "seo-title",
          category: "seo",
          title: "Etiqueta <title>",
          status: "fail",
          weight: 10,
          diagnosis: "La página no tiene título. Google no sabe cómo llamarla en los resultados de búsqueda.",
          fix: {
            steps: [
              "Añade una etiqueta <title> dentro de <head>.",
              "Usa entre 30 y 60 caracteres con tu palabra clave principal al principio.",
              "Termina con el nombre de tu marca separado por un guion o barra.",
            ],
            code: `<title>Servicio principal en tu ciudad | ${host}</title>`,
          },
        }
      : {
          id: "seo-title",
          category: "seo",
          title: "Etiqueta <title>",
          status: title.length < 30 || title.length > 60 ? "warn" : "pass",
          weight: 10,
          value: `${title.length} caracteres`,
          diagnosis:
            title.length < 30
              ? `El título "${title}" es demasiado corto: desaprovechas espacio para palabras clave.`
              : title.length > 60
                ? `El título mide ${title.length} caracteres y Google lo cortará con "...".`
                : `Título correcto: "${title}".`,
          fix: {
            steps: [
              "Ajusta el título a 30–60 caracteres.",
              "Coloca la palabra clave principal en las primeras palabras.",
              "Haz que cada página tenga un título único.",
            ],
            code: `<title>${title.slice(0, 40).trim()} | Marca</title>`,
          },
        }
  )

  checks.push(
    !description
      ? {
          id: "seo-description",
          category: "seo",
          title: "Meta description",
          status: "fail",
          weight: 9,
          diagnosis:
            "No hay meta description. Google improvisará un texto cualquiera y perderás clics en los resultados.",
          fix: {
            steps: [
              "Añade una meta description en el <head>.",
              "Escribe entre 70 y 160 caracteres que resuman la página e inviten a hacer clic.",
              "Incluye la palabra clave y una llamada a la acción.",
            ],
            code: `<meta name="description" content="Descubre cómo [beneficio principal]. Presupuesto gratis en 24 h. ¡Llámanos!" />`,
          },
        }
      : {
          id: "seo-description",
          category: "seo",
          title: "Meta description",
          status: description.length < 70 || description.length > 160 ? "warn" : "pass",
          weight: 9,
          value: `${description.length} caracteres`,
          diagnosis:
            description.length < 70
              ? "La meta description es muy corta y no convence a nadie para hacer clic."
              : description.length > 160
                ? `La meta description mide ${description.length} caracteres; Google la recortará.`
                : "Meta description con longitud ideal.",
          fix: {
            steps: [
              "Reescribe la descripción en 70–160 caracteres.",
              "Empieza por el beneficio para el usuario, no por tu empresa.",
            ],
            code: `<meta name="description" content="${description.slice(0, 120).replace(/"/g, "&quot;")}..." />`,
          },
        }
  )

  checks.push({
    id: "seo-open-graph",
    category: "seo",
    title: "Etiquetas Open Graph",
    status: ogMissing.length === 0 ? "pass" : ogMissing.length >= 3 ? "fail" : "warn",
    weight: 6,
    value: `${4 - ogMissing.length}/4 presentes`,
    diagnosis:
      ogMissing.length === 0
        ? "Open Graph completo: tus enlaces se verán bien al compartirlos en redes y WhatsApp."
        : `Faltan ${ogMissing.join(", ")}. Al compartir tu web en redes saldrá una vista previa pobre o sin imagen.`,
    fix: {
      steps: [
        "Añade las etiquetas Open Graph que faltan en el <head>.",
        "Usa una imagen de 1200×630 px para og:image con URL absoluta.",
        "Comprueba el resultado con el depurador de enlaces de tu red social.",
      ],
      code: [
        `<meta property="og:title" content="${(title ?? "Título de la página").replace(/"/g, "&quot;")}" />`,
        `<meta property="og:description" content="Resumen atractivo de la página" />`,
        `<meta property="og:image" content="${origin}/og-image.jpg" />`,
        `<meta property="og:url" content="${page.finalUrl.href}" />`,
        `<meta property="og:type" content="website" />`,
      ].join("\n"),
    },
  })

  checks.push({
    id: "seo-twitter-card",
    category: "seo",
    title: "Twitter / X Card",
    status: twitterCard ? "pass" : "warn",
    weight: 2,
    diagnosis: twitterCard
      ? `Twitter Card configurada (${twitterCard}).`
      : "Sin twitter:card, los enlaces en X se muestran como texto plano.",
    fix: {
      steps: ["Añade la etiqueta twitter:card; reutilizará tus etiquetas Open Graph."],
      code: `<meta name="twitter:card" content="summary_large_image" />`,
    },
  })

  checks.push({
    id: "seo-canonical",
    category: "seo",
    title: "URL canónica",
    status: canonical ? "pass" : "warn",
    weight: 4,
    diagnosis: canonical
      ? `Canonical definida: ${canonical}`
      : "No hay etiqueta canonical: Google podría indexar duplicados (con y sin www, con parámetros...).",
    fix: {
      steps: [
        "Añade una etiqueta canonical que apunte a la versión preferida de cada página.",
        "Usa siempre URLs absolutas y la misma variante (https, con o sin www).",
      ],
      code: `<link rel="canonical" href="${page.finalUrl.href}" />`,
    },
  })

  checks.push({
    id: "seo-indexable",
    category: "seo",
    title: "Página indexable",
    status: robotsMeta.includes("noindex") ? "fail" : "pass",
    weight: 8,
    value: robotsMeta || "sin meta robots",
    diagnosis: robotsMeta.includes("noindex")
      ? "¡Alerta! La página tiene meta robots \"noindex\": Google tiene prohibido mostrarla."
      : "Ninguna etiqueta impide que Google indexe la página.",
    fix: {
      steps: [
        "Elimina \"noindex\" de la meta robots si quieres aparecer en Google.",
        "Revisa también la opción \"Disuadir a los motores de búsqueda\" si usas WordPress.",
      ],
      code: `<meta name="robots" content="index, follow" />`,
    },
  })

  checks.push({
    id: "seo-lang",
    category: "seo",
    title: "Idioma declarado",
    status: lang ? "pass" : "warn",
    weight: 3,
    value: lang ?? undefined,
    diagnosis: lang
      ? `Idioma declarado: "${lang}".`
      : "La etiqueta <html> no declara idioma. Buscadores y lectores de pantalla tienen que adivinarlo.",
    fix: {
      steps: ["Añade el atributo lang a la etiqueta <html>."],
      code: `<html lang="es">`,
    },
  })

  checks.push({
    id: "seo-robots-txt",
    category: "seo",
    title: "Archivo robots.txt",
    status: robots.ok ? "pass" : "warn",
    weight: 3,
    diagnosis: robots.ok
      ? "robots.txt encontrado."
      : "No hay robots.txt. Los rastreadores no reciben instrucciones sobre qué visitar.",
    fix: {
      steps: ["Crea un archivo robots.txt en la raíz del dominio.", "Enlaza ahí tu sitemap."],
      code: `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml`,
    },
  })

  checks.push({
    id: "seo-sitemap",
    category: "seo",
    title: "Sitemap XML",
    status: sitemapFound ? "pass" : "warn",
    weight: 3,
    diagnosis: sitemapFound
      ? "Sitemap localizado."
      : "No encontramos sitemap.xml ni referencia en robots.txt. Google tardará más en descubrir tus páginas.",
    fix: {
      steps: [
        "Genera un sitemap.xml (la mayoría de CMS y frameworks lo hacen con un plugin).",
        "Envíalo en Google Search Console.",
      ],
      code: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${origin}/</loc></url>\n</urlset>`,
    },
  })

  checks.push({
    id: "seo-structured-data",
    category: "seo",
    title: "Datos estructurados",
    status: jsonLd > 0 ? "pass" : "warn",
    weight: 3,
    value: jsonLd > 0 ? plural(jsonLd, "bloque", "bloques") : undefined,
    diagnosis:
      jsonLd > 0
        ? "Datos estructurados JSON-LD detectados."
        : "Sin datos estructurados (Schema.org): te pierdes resultados enriquecidos como estrellas o FAQs.",
    fix: {
      steps: ["Añade un bloque JSON-LD con el tipo que mejor describa tu negocio."],
      code: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Tu empresa",\n  "url": "${origin}",\n  "logo": "${origin}/logo.png"\n}\n</script>`,
    },
  })

  // ───────────── Velocidad & Seguridad ─────────────
  checks.push({
    id: "sec-https",
    category: "performance",
    title: "HTTPS y certificado SSL",
    status: isHttps ? "pass" : "fail",
    weight: 12,
    value: sslError ? "certificado inválido" : isHttps ? "válido" : "sin HTTPS",
    diagnosis: sslError
      ? "El certificado SSL es inválido o ha caducado. Los navegadores muestran \"No seguro\" a tus visitantes."
      : isHttps
        ? "Conexión cifrada con certificado SSL válido."
        : "La web se sirve sin HTTPS. Chrome la marca como \"No segura\" y Google la penaliza.",
    fix: {
      steps: [
        "Instala un certificado SSL gratuito (Let's Encrypt) desde tu hosting.",
        "Redirige todo el tráfico http:// a https:// con una redirección 301.",
        "Actualiza los enlaces internos y recursos para que usen https://.",
      ],
      code: `# Nginx\nserver {\n  listen 80;\n  server_name ${host};\n  return 301 https://$host$request_uri;\n}`,
    },
  })

  checks.push({
    id: "perf-ttfb",
    category: "performance",
    title: "Tiempo de respuesta del servidor",
    status: page.responseTimeMs < 600 ? "pass" : page.responseTimeMs < 1500 ? "warn" : "fail",
    weight: 10,
    value: `${page.responseTimeMs} ms`,
    diagnosis:
      page.responseTimeMs < 600
        ? `El servidor responde rápido (${page.responseTimeMs} ms).`
        : page.responseTimeMs < 1500
          ? `El servidor tarda ${page.responseTimeMs} ms en responder. Aceptable, pero tus visitantes lo notan.`
          : `¡Exceso de velocidad... pero al revés! ${page.responseTimeMs} ms de espera antes de empezar a cargar.`,
    fix: {
      steps: [
        "Activa caché de página completa (plugin de caché o caché del servidor).",
        "Sirve la web a través de una CDN como Cloudflare.",
        "Revisa consultas lentas a base de datos y plugins pesados.",
        "Valora un hosting con más recursos o más cercano a tu público.",
      ],
      code: `# Cabecera para que la CDN cachee el HTML 5 minutos\nCache-Control: public, s-maxage=300, stale-while-revalidate=600`,
    },
  })

  checks.push({
    id: "perf-html-size",
    category: "performance",
    title: "Peso del documento HTML",
    status: htmlSizeKb <= 150 ? "pass" : htmlSizeKb <= 400 ? "warn" : "fail",
    weight: 5,
    value: `${htmlSizeKb} KB`,
    diagnosis:
      htmlSizeKb <= 150
        ? `HTML ligero (${htmlSizeKb} KB).`
        : `El HTML pesa ${htmlSizeKb} KB. Suele indicar estilos, scripts o SVG incrustados en exceso.`,
    fix: {
      steps: [
        "Mueve CSS y JavaScript en línea a archivos externos cacheables.",
        "Elimina HTML generado por constructores visuales que no se use.",
        "Pagina listados largos en lugar de mostrarlo todo de golpe.",
      ],
    },
  })

  checks.push({
    id: "perf-compression",
    category: "performance",
    title: "Compresión Gzip / Brotli",
    status: /br|gzip|zstd|deflate/.test(encoding) || htmlSizeKb < 10 ? "pass" : "warn",
    weight: 5,
    value: encoding || "sin compresión",
    diagnosis: encoding
      ? `El servidor comprime las respuestas (${encoding}).`
      : htmlSizeKb < 10
        ? "Documento tan pequeño que la compresión apenas importa."
        : "El servidor envía el HTML sin comprimir: hasta un 70% más de datos de los necesarios.",
    fix: {
      steps: ["Activa Brotli o Gzip en tu servidor o CDN."],
      code: `# Nginx\ngzip on;\ngzip_types text/html text/css application/javascript application/json image/svg+xml;`,
    },
  })

  checks.push({
    id: "perf-redirects",
    category: "performance",
    title: "Cadena de redirecciones",
    status: page.redirects <= 1 ? "pass" : page.redirects === 2 ? "warn" : "fail",
    weight: 3,
    value: plural(page.redirects, "redirección", "redirecciones"),
    diagnosis:
      page.redirects <= 1
        ? "Sin cadenas de redirección innecesarias."
        : `Antes de llegar a la página hay ${page.redirects} redirecciones encadenadas, cada una añade latencia.`,
    fix: {
      steps: [
        "Redirige directamente a la URL final en un solo salto (http → https://www en una única 301).",
        "Actualiza los enlaces internos para que apunten a la URL definitiva.",
      ],
    },
  })

  checks.push({
    id: "sec-hsts",
    category: "performance",
    title: "Cabecera HSTS",
    status: isHttps && hasHsts ? "pass" : "warn",
    weight: 4,
    diagnosis:
      isHttps && hasHsts
        ? "HSTS activo: los navegadores siempre usarán HTTPS."
        : "Sin Strict-Transport-Security, un atacante podría forzar la primera visita por http.",
    fix: {
      steps: ["Añade la cabecera HSTS una vez que todo el sitio funcione por HTTPS."],
      code: `Strict-Transport-Security: max-age=31536000; includeSubDomains`,
    },
  })

  checks.push({
    id: "sec-headers",
    category: "performance",
    title: "Cabeceras de seguridad",
    status: missingSecurityHeaders.length === 0 ? "pass" : missingSecurityHeaders.length === 3 ? "fail" : "warn",
    weight: 4,
    value: `${3 - missingSecurityHeaders.length}/3 presentes`,
    diagnosis:
      missingSecurityHeaders.length === 0
        ? "Cabeceras de seguridad básicas configuradas."
        : `Faltan: ${missingSecurityHeaders.join(", ")}. La web es más vulnerable a clickjacking y otros ataques.`,
    fix: {
      steps: ["Configura estas cabeceras en tu servidor, CDN o archivo .htaccess."],
      code: `X-Content-Type-Options: nosniff\nX-Frame-Options: SAMEORIGIN\nReferrer-Policy: strict-origin-when-cross-origin`,
    },
  })

  checks.push({
    id: "perf-render-blocking",
    category: "performance",
    title: "Scripts que bloquean la carga",
    status: blockingScripts === 0 ? "pass" : blockingScripts <= 3 ? "warn" : "fail",
    weight: 4,
    value: plural(blockingScripts, "script", "scripts"),
    diagnosis:
      blockingScripts === 0
        ? "Ningún script del <head> bloquea el renderizado."
        : `${plural(blockingScripts, "script", "scripts")} en el <head> sin async/defer detienen el pintado de la página.`,
    fix: {
      steps: [
        "Añade defer a los scripts que no necesitan ejecutarse antes de pintar.",
        "Usa async para scripts independientes como analítica.",
      ],
      code: `<script src="/js/app.js" defer></script>\n<script src="https://analytics.example.com/tag.js" async></script>`,
    },
  })

  // ───────────── Estructura ─────────────
  checks.push({
    id: "st-h1",
    category: "structure",
    title: "Encabezado H1",
    status: h1s.length === 1 && h1s[0] ? "pass" : h1s.length === 0 ? "fail" : "warn",
    weight: 9,
    value: plural(h1s.length, "H1", "H1"),
    diagnosis:
      h1s.length === 0
        ? "No hay ningún H1. Google no tiene claro cuál es el tema principal de la página."
        : h1s.length > 1
          ? `Hay ${h1s.length} H1 compitiendo entre sí. Lo ideal es uno solo por página.`
          : h1s[0]
            ? `H1 correcto: "${h1s[0].slice(0, 80)}".`
            : "El H1 existe pero está vacío (quizá solo contiene una imagen sin texto alternativo).",
    fix: {
      steps: [
        "Usa exactamente un H1 por página, con la palabra clave principal.",
        "Convierte los H1 secundarios en H2.",
        "No uses el logo como H1 en todas las páginas.",
      ],
      code: `<h1>Diseño web profesional en Madrid</h1>`,
    },
  })

  checks.push({
    id: "st-h2",
    category: "structure",
    title: "Subtítulos H2",
    status: h2Count > 0 ? "pass" : "warn",
    weight: 5,
    value: plural(h2Count, "H2", "H2"),
    diagnosis:
      h2Count > 0
        ? `${plural(h2Count, "subtítulo H2", "subtítulos H2")} estructuran el contenido.`
        : "Sin subtítulos H2: el contenido es un bloque difícil de escanear para usuarios y buscadores.",
    fix: {
      steps: ["Divide el contenido en secciones con H2 descriptivos que incluyan palabras clave secundarias."],
      code: `<h2>¿Por qué elegirnos?</h2>\n<h2>Nuestros servicios</h2>\n<h2>Preguntas frecuentes</h2>`,
    },
  })

  checks.push({
    id: "st-heading-order",
    category: "structure",
    title: "Jerarquía de encabezados",
    status: skippedLevel ? "warn" : "pass",
    weight: 3,
    diagnosis: skippedLevel
      ? "Se saltan niveles de encabezado (por ejemplo de H1 a H3). Confunde a lectores de pantalla."
      : "La jerarquía de encabezados es coherente.",
    fix: {
      steps: [
        "Respeta el orden H1 → H2 → H3 sin saltar niveles.",
        "Si solo buscas un tamaño de letra, cámbialo con CSS, no con la etiqueta.",
      ],
    },
  })

  checks.push({
    id: "st-img-alt",
    category: "structure",
    title: "Atributo alt en imágenes",
    status:
      images.length === 0 || imagesWithoutAlt === 0
        ? "pass"
        : imagesWithoutAlt / images.length <= 0.2
          ? "warn"
          : "fail",
    weight: 8,
    value: `${images.length - imagesWithoutAlt}/${images.length} con alt`,
    diagnosis:
      images.length === 0
        ? "No hay imágenes <img> en la página."
        : imagesWithoutAlt === 0
          ? "Todas las imágenes tienen atributo alt."
          : `${plural(imagesWithoutAlt, "imagen no tiene", "imágenes no tienen")} atributo alt. Google Imágenes las ignora y los lectores de pantalla no pueden describirlas.`,
    fix: {
      steps: [
        "Añade un alt descriptivo a cada imagen con contenido.",
        "Usa alt=\"\" (vacío) solo para imágenes decorativas.",
        "Describe la imagen de forma natural; no rellenes con palabras clave.",
      ],
      code: `<img src="/equipo.jpg" alt="Equipo de Pikolete revisando una web en la oficina" />`,
    },
  })

  checks.push({
    id: "st-viewport",
    category: "structure",
    title: "Adaptación a móvil (viewport)",
    status: viewport ? "pass" : "fail",
    weight: 7,
    diagnosis: viewport
      ? "Meta viewport presente: la página se adapta a pantallas móviles."
      : "Falta la meta viewport. En móvil la página se verá diminuta y Google usa la versión móvil para posicionar.",
    fix: {
      steps: ["Añade la meta viewport en el <head> y asegúrate de que tu CSS es responsive."],
      code: `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    },
  })

  checks.push({
    id: "st-content",
    category: "structure",
    title: "Cantidad de contenido",
    status: wordCount >= 300 ? "pass" : "warn",
    weight: 3,
    value: plural(wordCount, "palabra", "palabras"),
    diagnosis:
      wordCount >= 300
        ? `${wordCount} palabras de contenido visible.`
        : `Solo ${wordCount} palabras visibles. El contenido escaso suele posicionar peor (o la web depende de JavaScript para mostrar el texto).`,
    fix: {
      steps: [
        "Amplía el contenido con información útil: servicios, beneficios, preguntas frecuentes.",
        "Si la web se renderiza solo con JavaScript, valora el renderizado en servidor (SSR).",
      ],
    },
  })

  checks.push({
    id: "st-favicon",
    category: "structure",
    title: "Favicon",
    status: favicon ? "pass" : "warn",
    weight: 2,
    diagnosis: favicon
      ? "Favicon declarado."
      : "No se declara favicon. Tu pestaña y tu resultado en Google móvil aparecen sin icono.",
    fix: {
      steps: ["Añade un favicon en varios tamaños y decláralo en el <head>."],
      code: `<link rel="icon" href="/favicon.ico" sizes="any" />\n<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    },
  })

  checks.push({
    id: "st-charset",
    category: "structure",
    title: "Codificación de caracteres",
    status: charset || /charset=/i.test(header("content-type") ?? "") ? "pass" : "warn",
    weight: 2,
    diagnosis:
      charset || /charset=/i.test(header("content-type") ?? "")
        ? "Codificación de caracteres declarada."
        : "No se declara la codificación: las tildes y eñes pueden verse como símbolos raros.",
    fix: {
      steps: ["Declara UTF-8 como primera etiqueta del <head>."],
      code: `<meta charset="utf-8" />`,
    },
  })

  const metrics: AuditMetrics = {
    responseTimeMs: page.responseTimeMs,
    downloadTimeMs: page.downloadTimeMs,
    htmlSizeKb,
    statusCode: page.status,
    redirects: page.redirects,
    https: isHttps,
    imagesTotal: images.length,
    imagesWithoutAlt,
    h1Count: h1s.length,
    h2Count,
    wordCount,
  }

  const score = computeScore(checks)
  const inspectedAt = new Date()

  return {
    url: input.trim(),
    finalUrl: page.finalUrl.href,
    inspectedAt: inspectedAt.toISOString(),
    score,
    grade: gradeFor(score),
    ticketId: ticketIdFor(page.finalUrl.href, inspectedAt),
    pageTitle: title,
    metrics,
    checks,
  }
}
