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

export interface TrustResult {
  url: string
  finalUrl: string
  host: string
  score: number
  level: TrustLevel
  signals: TrustSignal[]
  domainAgeDays: number | null
  checkedAt: string
}

export interface TrustErrorBody {
  error: string
}
