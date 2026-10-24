export type CheckCategory = "seo" | "performance" | "structure"

export type CheckStatus = "pass" | "warn" | "fail"

export interface AuditFix {
  /** Pasos accionables en lenguaje claro. */
  steps: string[]
  /** Fragmento de código de ejemplo listo para copiar. */
  code?: string
}

export interface AuditCheck {
  id: string
  category: CheckCategory
  title: string
  status: CheckStatus
  /** Peso relativo del check dentro del score global. */
  weight: number
  /** Diagnóstico visible siempre (qué ha encontrado Pikolete). */
  diagnosis: string
  /** Valor medido, si aplica (p. ej. "412 ms" o "58 caracteres"). */
  value?: string
  /** Solución. El servidor la omite a partir del 4º problema salvo desbloqueo. */
  fix?: AuditFix
  /** true cuando la solución existe pero está tras el muro de pago. */
  locked?: boolean
}

export interface AuditMetrics {
  responseTimeMs: number
  downloadTimeMs: number
  htmlSizeKb: number
  statusCode: number
  redirects: number
  https: boolean
  imagesTotal: number
  imagesWithoutAlt: number
  h1Count: number
  h2Count: number
  wordCount: number
}

export interface AuditResult {
  url: string
  finalUrl: string
  inspectedAt: string
  score: number
  grade: "A" | "B" | "C" | "D" | "F"
  ticketId: string
  pageTitle: string | null
  metrics: AuditMetrics
  checks: AuditCheck[]
  /** true si el informe premium está desbloqueado para este dominio. */
  unlocked: boolean
}

export interface AuditErrorBody {
  error: string
}
