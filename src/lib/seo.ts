import type { Metadata } from "next"

import { siteConfig } from "@/lib/config"

/** Fecha de la última revisión del contenido público; alimenta el sitemap. */
export const CONTENT_UPDATED = "2026-10-25"

export const SITE_TITLE = "Auditoría SEO y web gratis en segundos · Pikolete"
export const SITE_DESCRIPTION =
  "Audita tu web gratis en 15 segundos: SEO, velocidad, SSL, cabeceras de seguridad y estructura. Recibe tu multa con diagnóstico claro y cómo solucionarlo."

/** Open Graph común. Next no fusiona openGraph entre layout y página, así que cada página lo extiende. */
export const baseOpenGraph = {
  siteName: siteConfig.name,
  locale: "es_ES",
  type: "website",
} satisfies Metadata["openGraph"]

/** Serializa JSON-LD escapando "<" para evitar inyección de HTML. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
