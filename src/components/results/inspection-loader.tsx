"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CircleCheck, Loader2 } from "lucide-react"

import { PikoleteMascot } from "@/components/brand/pikolete-logo"

const STEPS = [
  "Llamando a la puerta del servidor…",
  "Comprobando el certificado SSL…",
  "Cronometrando la respuesta…",
  "Leyendo meta tags y Open Graph…",
  "Revisando encabezados e imágenes…",
  "Redactando la multa…",
]

export function InspectionLoader({ url }: { url: string }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1100)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 text-center" role="status">
      <motion.div
        animate={{ rotate: [-6, 6, -6], y: [0, -4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <PikoleteMascot className="size-32" />
      </motion.div>
      <h1 className="mt-6 text-2xl font-extrabold text-primary">Inspección en curso</h1>
      {url && <p className="mt-1 truncate font-mono text-sm text-muted-foreground">{url}</p>}
      <ul className="mt-8 w-full space-y-2 text-left text-sm">
        {STEPS.map((label, i) => (
          <motion.li
            key={label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: i <= step ? 1 : 0.35, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
          >
            {i < step ? (
              <CircleCheck className="size-4 text-success" />
            ) : i === step ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <span className="size-4 rounded-full border-2" />
            )}
            {label}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
