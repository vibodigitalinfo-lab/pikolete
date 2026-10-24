"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Globe, Loader2, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const DOMAIN_RE = /^(https?:\/\/)?[^\s/$.?#]+\.[^\s]{2,}$/i

export function InspectForm({
  defaultValue = "",
  size = "lg",
  className,
}: {
  defaultValue?: string
  size?: "lg" | "sm"
  className?: string
}) {
  const router = useRouter()
  const [url, setUrl] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = url.trim()
    if (!DOMAIN_RE.test(value)) {
      setError("Escribe una URL válida, por ejemplo https://miweb.com")
      return
    }
    setError(null)
    setPending(true)
    router.push(`/resultados?url=${encodeURIComponent(value)}`)
  }

  const large = size === "lg"

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)} noValidate>
      <div
        className={cn(
          "flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-lg shadow-primary/5 sm:flex-row sm:items-center",
          error && "border-danger/60"
        )}
      >
        <label htmlFor={`url-${size}`} className="sr-only">
          URL de tu web
        </label>
        <div className="relative flex-1">
          <Globe className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`url-${size}`}
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://miweb.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `url-${size}-error` : undefined}
            className={cn(
              "border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0",
              large ? "h-12 text-base md:text-lg" : "h-10"
            )}
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          className={cn(
            "bg-badge font-bold text-badge-foreground hover:bg-badge/90",
            large ? "h-12 rounded-xl px-6 text-base" : "h-10 rounded-lg"
          )}
        >
          {pending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          Pasar Inspección Pikolete
        </Button>
      </div>
      {error && (
        <p id={`url-${size}-error`} role="alert" className="mt-2 px-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  )
}
