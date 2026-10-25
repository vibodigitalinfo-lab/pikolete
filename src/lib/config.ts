export const siteConfig = {
  name: "Pikolete Inspector",
  tagline: "Auditor Web & SEO Express",
  url: "https://pikolete.com",
  quoteEmail: process.env.NEXT_PUBLIC_QUOTE_EMAIL ?? "hola@pikolete.com",
  auditedCount: "+1.000",
  /** Google AdSense: ID de editor y bloques de anuncio (opcionales; sin bloque, solo anuncios automáticos). */
  adsense: {
    client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-9478834967463774",
    slots: {
      landing: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING ?? "",
      results: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULTS ?? "",
    },
  },
  /** Datos del responsable del tratamiento (RGPD/LSSI). Completa nombre legal y NIF. */
  legal: {
    owner: process.env.NEXT_PUBLIC_LEGAL_OWNER ?? "",
    taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID ?? "",
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "",
  },
}

/** Versión de la política de privacidad aceptada; se guarda con cada lead. */
export const PRIVACY_VERSION = "2026-10-25"

/** Clave de dominio usada para el desbloqueo: sin www y en minúsculas. */
export function hostKey(url: string): string {
  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`
    return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return ""
  }
}

/** Codifica el dominio en base64url para la cookie de desbloqueo. */
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
