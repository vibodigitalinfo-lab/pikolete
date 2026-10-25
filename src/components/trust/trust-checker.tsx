"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, Globe, Loader2, Search } from "lucide-react"

import { AdSlot } from "@/components/site/ad-slot"
import { TrustReport } from "@/components/trust/trust-report"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { siteConfig } from "@/lib/config"
import type { TrustResult } from "@/lib/trust/types"
import { cn } from "@/lib/utils"

const DOMAIN_RE = /^(https?:\/\/)?[^\s/$.?#]+\.[^\s]{2,}$/i

export function TrustChecker() {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<TrustResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  async function check(value: string) {
    setError(null)
    setPending(true)
    setResult(null)
    try {
      const res = await fetch("/api/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      })
      const data = (await res.json()) as TrustResult | { error: string }
      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "No pudimos comprobar esta web.")
        return
      }
      setResult(data)
      window.history.replaceState(null, "", `?url=${encodeURIComponent(value)}`)
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
    } catch {
      setError("No pudimos conectar con Pikolete. Revisa tu conexión e inténtalo de nuevo.")
    } finally {
      setPending(false)
    }
  }

  // Permite compartir el enlace: /es-fiable?url=tienda.com lanza la comprobación al entrar.
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("url")
    if (!shared || !DOMAIN_RE.test(shared.trim())) return
    const timer = setTimeout(() => {
      setUrl(shared)
      void check(shared.trim())
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = url.trim()
    if (!DOMAIN_RE.test(value)) {
      setError("Pega una dirección válida, por ejemplo tienda.com")
      return
    }
    void check(value)
  }


  return (
    <div className="w-full">
      <form onSubmit={onSubmit} noValidate className="max-w-2xl">
        <div
          className={cn(
            "flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-lg shadow-primary/5 sm:flex-row sm:items-center",
            error && "border-danger/60"
          )}
        >
          <label htmlFor="trust-url" className="sr-only">
            Dirección de la web o tienda
          </label>
          <div className="relative flex-1">
            <Globe className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="trust-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="Pega aquí la web o tienda: tienda.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "trust-url-error" : undefined}
              className="h-12 border-0 bg-transparent pl-10 text-base shadow-none focus-visible:ring-0 md:text-lg"
            />
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="h-12 rounded-xl bg-badge px-6 text-base font-bold text-badge-foreground hover:bg-badge/90"
          >
            {pending ? <Loader2 className="animate-spin" /> : <Search />}
            ¿Es fiable?
          </Button>
        </div>
        {error && (
          <p id="trust-url-error" role="alert" className="mt-2 px-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        {pending && (
          <p className="mt-3 px-2 text-sm text-muted-foreground" aria-live="polite">
            Pikolete está mirando la web, el dominio y sus datos legales…
          </p>
        )}
      </form>

      {result && (
        <div ref={resultRef} className="mt-10 scroll-mt-24 space-y-4" aria-live="polite">
          <TrustReport result={result} ad={<AdSlot slot={siteConfig.adsense.slots.results} />} />
          {result.slug && (
            <Link
              href={`/es-fiable/${result.slug}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4"
            >
              Ver y compartir la página de {result.slug} <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
