import "server-only"

import { hit } from "@/lib/rate-limit"

export interface MailAttachment {
  /** Contenido en base64. */
  content: string
  filename: string
  type: string
}

export interface MailMessage {
  to: string
  subject: string
  html: string
  text: string
  attachments?: MailAttachment[]
}

export type MailResult = { sent: true } | { sent: false; reason: string }

/** Desde hola@ para que las respuestas lleguen por Email Routing al buzón real. */
const DEFAULT_FROM = "Pikolete Inspector <hola@pikolete.com>"
const from = () => process.env.EMAIL_FROM || DEFAULT_FROM

type Provider = "resend" | "cloudflare" | null

/** Resend (plan gratuito) tiene prioridad; Cloudflare Email Sending queda como alternativa de pago. */
function provider(): Provider {
  if (process.env.RESEND_API_KEY) return "resend"
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_EMAIL_TOKEN) return "cloudflare"
  return null
}

export function mailerConfigured(): boolean {
  return provider() !== null
}

async function sendWithResend(message: MailMessage): Promise<MailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: from(),
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.attachments?.length
        ? { attachments: message.attachments.map((a) => ({ filename: a.filename, content: a.content })) }
        : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  })
  if (res.ok) return { sent: true }
  const body = (await res.json().catch(() => null)) as { message?: string } | null
  return { sent: false, reason: body?.message || `HTTP ${res.status}` }
}

async function sendWithCloudflare(message: MailMessage): Promise<MailResult> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_EMAIL_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from(),
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.attachments?.length
          ? { attachments: message.attachments.map((a) => ({ ...a, disposition: "attachment" })) }
          : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    }
  )
  const body = (await res.json().catch(() => null)) as
    | { success?: boolean; errors?: Array<{ message?: string }>; result?: { permanent_bounces?: string[] } }
    | null
  if (!res.ok || !body?.success) {
    return { sent: false, reason: body?.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}` }
  }
  if (body.result?.permanent_bounces?.length) return { sent: false, reason: "rebote permanente" }
  return { sent: true }
}

const positiveInt = (value: string | undefined, fallback: number) => {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

/**
 * Tope global de envíos para no agotar el plan gratuito de Resend (100/día y 3.000/mes)
 * aunque alguien abuse de los formularios. Se cuenta cada intento de envío.
 */
async function withinQuota(): Promise<boolean> {
  const now = new Date().toISOString()
  const [day, month] = await Promise.all([
    hit(`mail:day:${now.slice(0, 10)}`, 2 * 86_400_000),
    hit(`mail:month:${now.slice(0, 7)}`, 32 * 86_400_000),
  ])
  return (
    day <= positiveInt(process.env.EMAIL_DAILY_LIMIT, 90) && month <= positiveInt(process.env.EMAIL_MONTHLY_LIMIT, 2_900)
  )
}

/** Envía un email con el proveedor configurado. Sin ninguno, no envía nada y lo indica en el resultado. */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  if (provider() && !(await withinQuota())) return { sent: false, reason: "tope diario o mensual de emails alcanzado" }
  switch (provider()) {
    case "resend":
      return sendWithResend(message)
    case "cloudflare":
      return sendWithCloudflare(message)
    default:
      return { sent: false, reason: "ningún proveedor de email configurado" }
  }
}
