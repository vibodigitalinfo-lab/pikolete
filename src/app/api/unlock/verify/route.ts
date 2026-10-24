import { NextResponse, type NextRequest } from "next/server"

import { decodeRef } from "@/lib/config"
import { addUnlock, UNLOCK_COOKIE, unlockCookieOptions } from "@/lib/premium"


interface StripeCheckoutSession {
  payment_status: "paid" | "unpaid" | "no_payment_required"
  client_reference_id: string | null
}

/**
 * URL de retorno del Stripe Payment Link. Configúrala en Stripe como:
 * https://pikolete.com/api/unlock/verify?session_id={CHECKOUT_SESSION_ID}
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")
  const home = new URL("/", request.url)
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId) || !secretKey) {
    home.searchParams.set("pago", "error")
    return NextResponse.redirect(home)
  }

  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: "no-store",
  })
  if (!stripeRes.ok) {
    home.searchParams.set("pago", "error")
    return NextResponse.redirect(home)
  }

  const session = (await stripeRes.json()) as StripeCheckoutSession
  const host = session.client_reference_id ? decodeRef(session.client_reference_id) : ""
  if (session.payment_status !== "paid" || !host) {
    home.searchParams.set("pago", "pendiente")
    return NextResponse.redirect(home)
  }

  const target = new URL("/resultados", request.url)
  target.searchParams.set("url", `https://${host}`)
  target.searchParams.set("desbloqueado", "1")
  const res = NextResponse.redirect(target)
  res.cookies.set(UNLOCK_COOKIE, addUnlock(request.cookies.get(UNLOCK_COOKIE)?.value, host), unlockCookieOptions)
  return res
}
