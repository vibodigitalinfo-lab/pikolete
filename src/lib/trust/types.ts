export type SignalStatus = "good" | "warn" | "bad" | "unknown"

export interface TrustSignal {
  id: string
  label: string
  status: SignalStatus
  /** Lo que hemos visto, en lenguaje llano. */
  detail: string
  /** Peso en la nota de confianza. */
  weight: number
}

/** "incompleto": la web no se deja leer y no hay señales graves en lo que sí vemos. */
export type TrustLevel = "fiable" | "precaucion" | "riesgo" | "incompleto"

/** "desconocido": la web no se deja leer y no sabemos si vende. */
export type SiteKind = "tienda" | "web" | "desconocido"

export interface TrustResult {
  url: string
  finalUrl: string
  host: string
  score: number
  level: TrustLevel
  /** Tienda online o web informativa (blog, empresa, medio…): cambia qué exigimos y cómo lo contamos. */
  kind: SiteKind
  signals: TrustSignal[]
  domainAgeDays: number | null
  checkedAt: string
  /** Dominio de su página pública (/es-fiable/<slug>), si se puede publicar. Solo lo rellena la API. */
  slug?: string | null
}

export interface TrustErrorBody {
  error: string
}
