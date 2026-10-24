export const siteConfig = {
  name: "Pikolete Inspector",
  tagline: "Auditor Web & SEO Express",
  url: "https://pikolete.com",
  price: "$9.99",
  /** Stripe Payment Link del informe premium (https://buy.stripe.com/...). */
  stripePaymentLink: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "",
  quoteEmail: process.env.NEXT_PUBLIC_QUOTE_EMAIL ?? "hola@pikolete.com",
  auditedCount: "+1.000",
}

/** Clave de dominio usada para el desbloqueo: sin www y en minúsculas. */
export function hostKey(url: string): string {
  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`
    return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return ""
  }
}

/** Codifica el dominio para client_reference_id de Stripe (solo [A-Za-z0-9_-]). */
export function encodeRef(host: string): string {
  return btoa(host).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function decodeRef(ref: string): string {
  try {
    return atob(ref.replace(/-/g, "+").replace(/_/g, "/"))
  } catch {
    return ""
  }
}

export function paymentUrl(host: string, email?: string): string {
  if (!siteConfig.stripePaymentLink) return ""
  const url = new URL(siteConfig.stripePaymentLink)
  url.searchParams.set("client_reference_id", encodeRef(host))
  if (email) url.searchParams.set("prefilled_email", email)
  return url.toString()
}
