import type { TrustLevel, TrustResult } from "@/lib/trust/types"

/** Historial de comprobaciones guardado solo en el navegador del visitante. Nunca sale de su equipo. */
export interface HistoryEntry {
  host: string
  level: TrustLevel
  score: number
  checkedAt: string
}

const KEY = "pk_historial_fiable"
const MAX = 8
const EVENT = "pk-historial"

function isEntry(v: unknown): v is HistoryEntry {
  if (!v || typeof v !== "object") return false
  const e = v as Record<string, unknown>
  return typeof e.host === "string" && typeof e.level === "string" && typeof e.checkedAt === "string"
}

export function readHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isEntry).slice(0, MAX) : []
  } catch {
    return []
  }
}

function write(entries: HistoryEntry[]) {
  try {
    if (entries.length === 0) window.localStorage.removeItem(KEY)
    else window.localStorage.setItem(KEY, JSON.stringify(entries))
  } catch {
    // Navegación privada o almacenamiento bloqueado: el historial es un extra, seguimos sin él.
  }
  window.dispatchEvent(new Event(EVENT))
}

export function addToHistory(result: TrustResult) {
  const entry: HistoryEntry = {
    host: result.host,
    level: result.level,
    score: result.score,
    checkedAt: result.checkedAt || new Date().toISOString(),
  }
  write([entry, ...readHistory().filter((e) => e.host !== entry.host)].slice(0, MAX))
}

export function removeFromHistory(host: string) {
  write(readHistory().filter((e) => e.host !== host))
}

export function clearHistory() {
  write([])
}

export function subscribeHistory(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener("storage", cb)
  }
}
