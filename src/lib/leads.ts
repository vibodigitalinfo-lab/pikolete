import "server-only"

import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { get, list, put } from "@vercel/blob"

export type LeadProfile = "owner" | "agency" | "looking"

export interface LeadSource {
  referrer?: string
  landingPath?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

export interface Lead {
  id: string
  type: "report" | "quote"
  createdAt: string
  email: string
  name?: string
  company?: string
  phone?: string
  profile?: LeadProfile
  message?: string
  auditedUrl?: string
  score?: number
  grade?: string
  fails?: number
  warns?: number
  marketingOptIn: boolean
  privacyVersion: string
  source: LeadSource
  /** Derivados de cabeceras de Vercel: nunca guardamos la IP. */
  country?: string
  city?: string
  language?: string
  device?: "mobile" | "desktop"
}

const PREFIX = "leads/"
const LOCAL_FILE = path.join(process.cwd(), "data", "leads.json")
const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)

export function newLeadId(): string {
  return randomUUID()
}

/** Guarda un lead en Vercel Blob (privado) o, en local sin token, en data/leads.json. */
export async function saveLead(lead: Lead): Promise<void> {
  if (blobEnabled()) {
    const day = lead.createdAt.slice(0, 10)
    await put(`${PREFIX}${day}/${lead.type}-${lead.id}.json`, JSON.stringify(lead), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    })
    return
  }
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true })
  const existing = JSON.parse(await readFile(LOCAL_FILE, "utf8").catch(() => "[]")) as Lead[]
  existing.push(lead)
  await writeFile(LOCAL_FILE, JSON.stringify(existing, null, 2))
}

/** Todos los leads, del más reciente al más antiguo. */
export async function listLeads(): Promise<Lead[]> {
  let leads: Lead[]
  if (blobEnabled()) {
    const pathnames: string[] = []
    let cursor: string | undefined
    do {
      const page = await list({ prefix: PREFIX, cursor, limit: 1000 })
      pathnames.push(...page.blobs.map((b) => b.pathname))
      cursor = page.hasMore ? page.cursor : undefined
    } while (cursor)

    leads = []
    // Lotes pequeños para no saturar la API de Blob.
    for (let i = 0; i < pathnames.length; i += 20) {
      const batch = await Promise.all(
        pathnames.slice(i, i + 20).map(async (pathname) => {
          const res = await get(pathname, { access: "private", useCache: false })
          if (!res || res.statusCode !== 200) return null
          return JSON.parse(await new Response(res.stream).text()) as Lead
        })
      )
      leads.push(...batch.filter((l): l is Lead => l !== null))
    }
  } else {
    leads = JSON.parse(await readFile(LOCAL_FILE, "utf8").catch(() => "[]")) as Lead[]
  }
  return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const CSV_COLUMNS: Array<keyof Lead | `source.${keyof LeadSource}`> = [
  "createdAt",
  "type",
  "email",
  "name",
  "company",
  "phone",
  "profile",
  "message",
  "auditedUrl",
  "score",
  "grade",
  "fails",
  "warns",
  "marketingOptIn",
  "country",
  "city",
  "language",
  "device",
  "source.referrer",
  "source.landingPath",
  "source.utmSource",
  "source.utmMedium",
  "source.utmCampaign",
  "privacyVersion",
  "id",
]

/** CSV con separador ";" y BOM para que Excel en español lo abra con tildes correctas. */
export function leadsToCsv(leads: Lead[]): string {
  const cell = (value: unknown) => {
    if (value === undefined || value === null) return ""
    const text = String(value)
    return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const rows = leads.map((lead) =>
    CSV_COLUMNS.map((col) =>
      col.startsWith("source.")
        ? cell(lead.source?.[col.slice(7) as keyof LeadSource])
        : cell(lead[col as keyof Lead])
    ).join(";")
  )
  return "﻿" + [CSV_COLUMNS.join(";"), ...rows].join("\r\n")
}
