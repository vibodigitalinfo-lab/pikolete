import type { AuditCheck, CheckStatus } from "./types"

/** Número de soluciones que se muestran gratis. */
export const FREE_FIXES = 3

const SEVERITY: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2 }

/** Problemas (fail/warn) ordenados por gravedad y peso: el orden en que se "multan". */
export function rankIssues(checks: AuditCheck[]): AuditCheck[] {
  return checks
    .filter((c) => c.status !== "pass")
    .sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || b.weight - a.weight)
}

/**
 * Deja visibles las soluciones de los FREE_FIXES problemas más graves y elimina el resto
 * (marcándolos como locked) salvo que el informe esté desbloqueado.
 */
export function gateChecks(checks: AuditCheck[], unlocked: boolean): AuditCheck[] {
  const free = new Set(
    rankIssues(checks)
      .slice(0, FREE_FIXES)
      .map((c) => c.id)
  )
  return checks.map((check) => {
    if (check.status === "pass") return { ...check, fix: undefined }
    if (unlocked || free.has(check.id)) return check
    return { ...check, fix: undefined, locked: true }
  })
}
