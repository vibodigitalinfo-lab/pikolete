"use client"

import { useState } from "react"
import { Check, CircleCheck, CircleX, Copy, Lock, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AuditCheck } from "@/lib/audit/types"
import { cn } from "@/lib/utils"

const STATUS = {
  fail: { icon: CircleX, label: "Infracción", box: "border-danger/30 bg-danger/5", text: "text-danger" },
  warn: { icon: TriangleAlert, label: "Advertencia", box: "border-warning/40 bg-warning/5", text: "text-warning" },
  pass: { icon: CircleCheck, label: "En regla", box: "border-success/25 bg-success/5", text: "text-success" },
} as const

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative mt-3">
      <pre className="overflow-x-auto rounded-lg bg-primary p-4 pr-12 font-mono text-xs leading-relaxed text-primary-foreground">
        <code>{code}</code>
      </pre>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="absolute top-2 right-2 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
        aria-label="Copiar código"
        onClick={() => {
          void navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
        }}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  )
}

export function IssueItem({ check, onUnlock }: { check: AuditCheck; onUnlock: () => void }) {
  const s = STATUS[check.status]
  const Icon = s.icon

  return (
    <li className={cn("rounded-xl border p-4 sm:p-5", s.box)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", s.text)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-bold">{check.title}</h3>
            <span className={cn("text-xs font-bold tracking-wide uppercase", s.text)}>{s.label}</span>
            {check.value && (
              <span className="rounded-md bg-background/70 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {check.value}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-foreground/80">{check.diagnosis}</p>

          {check.fix && (
            <div className="mt-4 rounded-lg border bg-card p-4">
              <p className="text-xs font-bold tracking-wide text-primary uppercase">Cómo solucionarlo</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                {check.fix.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {check.fix.code && <CodeBlock code={check.fix.code} />}
            </div>
          )}

          {check.locked && (
            <div className="relative mt-4 overflow-hidden rounded-lg border bg-card p-4">
              <div aria-hidden="true" className="space-y-2 blur-[5px] select-none">
                <div className="h-3 w-1/3 rounded bg-primary/30" />
                <div className="h-3 w-11/12 rounded bg-muted-foreground/25" />
                <div className="h-3 w-4/5 rounded bg-muted-foreground/25" />
                <div className="h-14 w-full rounded bg-primary/80" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/40 p-4 text-center">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Lock className="size-4 text-primary" />
                  Desbloquea gratis la guía de solución paso a paso y el informe PDF oficial
                </p>
                <Button size="sm" onClick={onUnlock}>
                  Desbloquear gratis
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
