"use client"

import { useEffect, useRef } from "react"

import { siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

/** Bloque de anuncio de AdSense. No pinta nada si no hay bloque configurado. */
export function AdSlot({ slot, className }: { slot: string; className?: string }) {
  const ref = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (!slot || !siteConfig.adsense.client || ref.current?.dataset.adsbygoogleStatus) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Bloqueador de anuncios o script aún sin cargar: el hueco queda vacío.
    }
  }, [slot])

  if (!slot || !siteConfig.adsense.client) return null

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <p className="mb-1 text-center text-[10px] tracking-widest text-muted-foreground uppercase">Publicidad</p>
      <ins
        ref={ref}
        className="adsbygoogle block"
        data-ad-client={siteConfig.adsense.client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
