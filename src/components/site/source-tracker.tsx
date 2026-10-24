"use client"

import { useEffect } from "react"

const KEY = "pikolete:source"

export interface VisitSource {
  referrer?: string
  landingPath?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

/** Guarda en sessionStorage cómo llegó el visitante (primera página de la visita). */
export function SourceTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return
      const params = new URLSearchParams(window.location.search)
      const referrer = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : undefined
      const source: VisitSource = {
        referrer,
        landingPath: window.location.pathname + window.location.search,
        utmSource: params.get("utm_source") ?? undefined,
        utmMedium: params.get("utm_medium") ?? undefined,
        utmCampaign: params.get("utm_campaign") ?? undefined,
      }
      sessionStorage.setItem(KEY, JSON.stringify(source))
    } catch {
      // sessionStorage no disponible (modo privado estricto): no pasa nada.
    }
  }, [])
  return null
}

export function readVisitSource(): VisitSource {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as VisitSource
  } catch {
    return {}
  }
}
