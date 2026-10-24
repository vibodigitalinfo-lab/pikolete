"use client"

import { animate, motion, useMotionValue, useTransform } from "framer-motion"
import { useEffect } from "react"

export function scoreTone(score: number) {
  if (score >= 80) return { color: "var(--success)", label: "En regla" }
  if (score >= 50) return { color: "var(--warning)", label: "Necesita mejoras" }
  return { color: "var(--danger)", label: "Multa grave" }
}

export function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const { color, label } = scoreTone(score)
  const value = useMotionValue(0)
  const rounded = useTransform(value, (v) => Math.round(v))
  const offset = useTransform(value, (v) => circumference * (1 - v / 100))

  useEffect(() => {
    const controls = animate(value, score, { duration: 1.4, ease: "easeOut" })
    return () => controls.stop()
  }, [score, value])

  return (
    <div className="flex flex-col items-center">
      <div className="relative size-40">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90" role="img" aria-label={`Nota ${score} de 100`}>
          <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--muted)" strokeWidth="12" />
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-5xl font-black tracking-tight">{rounded}</motion.span>
          <span className="text-xs font-semibold text-muted-foreground">de 100 · Nota {grade}</span>
        </div>
      </div>
      <span className="mt-2 rounded-full px-3 py-1 text-sm font-bold" style={{ color, background: `color-mix(in oklch, ${color} 14%, transparent)` }}>
        {label}
      </span>
    </div>
  )
}
