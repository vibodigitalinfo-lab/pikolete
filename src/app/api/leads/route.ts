import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { NextResponse, type NextRequest } from "next/server"

import { clientIp, rateLimit } from "@/lib/rate-limit"


export interface Lead {
  type: "report" | "quote"
  email: string
  url?: string
  score?: number
  name?: string
  message?: string
  createdAt: string
}

/** Almacenamiento provisional en JSON. En producción, sustitúyelo por tu CRM o base de datos. */
const LEADS_FILE = path.join(process.cwd(), "data", "leads.json")
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const clip = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined

export async function POST(request: NextRequest) {
  if (!rateLimit(`leads:${clientIp(request.headers)}`, 8, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const email = clip(body?.email, 254)
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Introduce un email válido." }, { status: 400 })
  }

  const lead: Lead = {
    type: body?.type === "quote" ? "quote" : "report",
    email,
    url: clip(body?.url, 2048),
    score: typeof body?.score === "number" ? body.score : undefined,
    name: clip(body?.name, 120),
    message: clip(body?.message, 2000),
    createdAt: new Date().toISOString(),
  }

  try {
    await mkdir(path.dirname(LEADS_FILE), { recursive: true })
    const existing = JSON.parse(await readFile(LEADS_FILE, "utf8").catch(() => "[]")) as Lead[]
    existing.push(lead)
    await writeFile(LEADS_FILE, JSON.stringify(existing, null, 2))
  } catch (err) {
    // En plataformas con disco de solo lectura (p. ej. Vercel) no se puede escribir el JSON.
    console.warn("[leads] no se pudo guardar en disco; lead:", lead, err)
  }

  return NextResponse.json({ ok: true })
}
