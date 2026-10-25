import { after, NextResponse, type NextRequest } from "next/server"

import { isHoneypotFilled, verifyTurnstile } from "@/lib/anti-spam"
import { normalizeUrl } from "@/lib/audit/fetch-page"
import { hostKey, PRIVACY_VERSION } from "@/lib/config"
import { newLeadId, saveLead, type Lead, type LeadProfile, type LeadSource } from "@/lib/leads"
import { notifyQuoteRequest, sendReportEmail } from "@/lib/notifications"
import { addUnlock, UNLOCK_COOKIE, unlockCookieOptions } from "@/lib/premium"
import { clientIp, rateLimits } from "@/lib/rate-limit"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PROFILES: LeadProfile[] = ["owner", "agency", "looking"]

const clip = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined
const int = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.round(value) : undefined)

function decodeHeader(value: string | null): string | undefined {
  if (!value) return undefined
  try {
    return decodeURIComponent(value).slice(0, 80)
  } catch {
    return value.slice(0, 80)
  }
}

/** Solo guardamos URLs http(s) válidas: el panel las muestra como enlace. */
function auditedUrl(value: unknown): string | undefined {
  const raw = clip(value, 2048)
  if (!raw) return undefined
  try {
    return normalizeUrl(raw).toString()
  } catch {
    return undefined
  }
}

/**
 * Guarda un lead. Si es de tipo "report", además desbloquea el informe completo del dominio
 * auditado: el "pago" del servicio gratuito son los datos de contacto.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers)
  // Por IP: 5 cada 10 minutos y 20 al día. Cada lead puede disparar un email.
  const allowed = await rateLimits(`leads:${ip}`, [
    [5, 600_000],
    [20, 86_400_000],
  ])
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  // A un bot no le decimos que le hemos pillado: respuesta normal, pero no se guarda ni se envía nada.
  if (isHoneypotFilled(body)) return NextResponse.json({ ok: true })
  if (!(await verifyTurnstile(body?.turnstileToken, ip))) {
    return NextResponse.json(
      { error: "No hemos podido comprobar que no eres un robot. Recarga la página e inténtalo de nuevo." },
      { status: 400 }
    )
  }
  const email = clip(body?.email, 254)?.toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Introduce un email válido." }, { status: 400 })
  }
  if (body?.privacyAccepted !== true) {
    return NextResponse.json({ error: "Debes aceptar la política de privacidad." }, { status: 400 })
  }

  const rawSource = (body?.source ?? {}) as Record<string, unknown>
  const source: LeadSource = {
    referrer: clip(rawSource.referrer, 500),
    landingPath: clip(rawSource.landingPath, 500),
    utmSource: clip(rawSource.utmSource, 100),
    utmMedium: clip(rawSource.utmMedium, 100),
    utmCampaign: clip(rawSource.utmCampaign, 100),
  }
  const profile = PROFILES.find((p) => p === body?.profile)
  const ua = request.headers.get("user-agent") ?? ""

  const lead: Lead = {
    id: newLeadId(),
    type: body?.type === "quote" ? "quote" : "report",
    createdAt: new Date().toISOString(),
    email,
    name: clip(body?.name, 120),
    company: clip(body?.company, 120),
    phone: clip(body?.phone, 40),
    profile,
    message: clip(body?.message, 2000),
    auditedUrl: auditedUrl(body?.auditedUrl),
    score: int(body?.score),
    grade: clip(body?.grade, 1),
    fails: int(body?.fails),
    warns: int(body?.warns),
    marketingOptIn: body?.marketingOptIn === true,
    privacyVersion: PRIVACY_VERSION,
    source,
    country: request.headers.get("x-vercel-ip-country") ?? undefined,
    city: decodeHeader(request.headers.get("x-vercel-ip-city")),
    language: request.headers.get("accept-language")?.split(",")[0]?.trim().slice(0, 20),
    device: /mobile|android|iphone/i.test(ua) ? "mobile" : "desktop",
  }

  try {
    await saveLead(lead)
  } catch (err) {
    console.error("[leads] no se pudo guardar el lead", err)
    return NextResponse.json({ error: "No pudimos guardar tus datos. Inténtalo de nuevo." }, { status: 500 })
  }

  // Los emails se envían después de responder: el usuario no espera a la auditoría ni al PDF.
  after(async () => {
    try {
      const result = lead.type === "quote" ? await notifyQuoteRequest(lead) : await sendReportEmail(lead)
      if (!result.sent) console.warn(`[leads] email ${lead.type} no enviado: ${result.reason}`)
    } catch (err) {
      console.error(`[leads] fallo enviando email ${lead.type}`, err)
    }
  })

  const res = NextResponse.json({ ok: true })
  const host = lead.auditedUrl ? hostKey(lead.auditedUrl) : ""
  if (lead.type === "report" && host) {
    try {
      res.cookies.set(UNLOCK_COOKIE, addUnlock(request.cookies.get(UNLOCK_COOKIE)?.value, host), unlockCookieOptions)
    } catch (err) {
      // El lead ya está guardado: no devolvemos error al usuario por un fallo de configuración.
      console.error("[leads] no se pudo firmar la cookie de desbloqueo", err)
    }
  }
  return res
}
