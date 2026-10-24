import "server-only"

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

export function mailerConfigured(): boolean {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_EMAIL_TOKEN)
}

/**
 * Envía un email con Cloudflare Email Service (REST API).
 * Sin CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_EMAIL_TOKEN no envía nada y lo indica en el resultado.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_EMAIL_TOKEN
  if (!accountId || !token) return { sent: false, reason: "mailer no configurado" }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.attachments?.length
        ? { attachments: message.attachments.map((a) => ({ ...a, disposition: "attachment" })) }
        : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  })

  const body = (await res.json().catch(() => null)) as
    | { success?: boolean; errors?: Array<{ message?: string }>; result?: { permanent_bounces?: string[] } }
    | null
  if (!res.ok || !body?.success) {
    return { sent: false, reason: body?.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}` }
  }
  if (body.result?.permanent_bounces?.length) return { sent: false, reason: "rebote permanente" }
  return { sent: true }
}
