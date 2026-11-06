"use client"

import { useEffect, useState } from "react"
import { History, RotateCw, X } from "lucide-react"

import { clearHistory, readHistory, removeFromHistory, subscribeHistory, type HistoryEntry } from "@/lib/trust/history"
import type { TrustLevel } from "@/lib/trust/types"
import { cn } from "@/lib/utils"

const DOT: Record<TrustLevel, string> = {
  fiable: "bg-success",
  precaucion: "bg-warning",
  riesgo: "bg-danger",
  incompleto: "bg-muted-foreground",
}

const LEVEL_TEXT: Record<TrustLevel, string> = {
  fiable: "Pinta fiable",
  precaucion: "Ve con cuidado",
  riesgo: "Señales de riesgo",
  incompleto: "Sin revisar a fondo",
}

const DAY = 24 * 60 * 60 * 1000

function since(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return ""
  const days = Math.floor(ms / DAY)
  if (days === 0) return "hoy"
  if (days === 1) return "ayer"
  if (days < 30) return `hace ${days} días`
  const months = Math.floor(days / 30)
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`
}

/** "Tus comprobaciones": historial local para volver a mirar una tienda antes de comprar otra vez. */
export function MyHistory({ onRecheck, disabled }: { onRecheck: (host: string) => void; disabled?: boolean }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])

  useEffect(() => {
    const sync = () => setEntries(readHistory())
    sync()
    return subscribeHistory(sync)
  }, [])

  if (entries.length === 0) return null

  return (
    <section aria-labelledby="mi-historial" className="mt-6 max-w-2xl rounded-2xl border bg-card/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="mi-historial" className="flex items-center gap-2 text-sm font-bold text-primary">
          <History className="size-4" /> Tus comprobaciones
        </h2>
        <button
          type="button"
          onClick={clearHistory}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Borrar historial
        </button>
      </div>
      <ul className="mt-3 divide-y">
        {entries.map((e) => (
          <li key={e.host} className="flex items-center gap-3 py-2 text-sm">
            <span className={cn("size-2.5 shrink-0 rounded-full", DOT[e.level])} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{e.host}</span>
              <span className="block text-xs text-muted-foreground">
                {LEVEL_TEXT[e.level]} · {since(e.checkedAt)}
              </span>
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRecheck(e.host)}
              aria-label={`Volver a comprobar ${e.host}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <RotateCw className="size-3.5" />
              <span className="sm:hidden">Repetir</span>
              <span className="hidden sm:inline">Volver a comprobar</span>
            </button>
            <button
              type="button"
              onClick={() => removeFromHistory(e.host)}
              aria-label={`Quitar ${e.host} del historial`}
              className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Solo se guarda en este navegador. Pikolete no lo ve ni lo envía a ningún sitio.
      </p>
    </section>
  )
}
