"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
    }
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error("No se pudo cargar Turnstile"))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Verificación anti-bots de Cloudflare Turnstile (gratis). Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY no pinta nada.
 * Va dentro del <form>: el widget añade un campo oculto "cf-turnstile-response" con el token.
 * Los tokens son de un solo uso: tras un envío fallido, cambia su `key` para pedir otro.
 */
export function Turnstile() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false
    let widgetId: string | null = null
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetId = window.turnstile.render(containerRef.current, { sitekey: SITE_KEY, language: "es", size: "flexible" })
      })
      .catch((err) => console.error(err))
    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [])

  return SITE_KEY ? <div ref={containerRef} className="min-h-[65px]" /> : null
}

/** Token del widget dentro del formulario enviado. */
export function turnstileToken(form: FormData): string | undefined {
  const value = form.get("cf-turnstile-response")
  return typeof value === "string" && value ? value : undefined
}

/** Campo trampa: oculto para personas y lectores de pantalla; los bots lo rellenan. */
export function HoneypotField() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        No rellenes este campo
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  )
}
