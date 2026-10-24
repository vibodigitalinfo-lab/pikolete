import { timingSafeEqual } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import { leadsToCsv, listLeads } from "@/lib/leads"
import { clientIp, rateLimit } from "@/lib/rate-limit"

function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const header = request.headers.get("authorization") ?? ""
  if (!header.startsWith("Basic ")) return false
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8")
  const password = decoded.slice(decoded.indexOf(":") + 1)
  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Exporta los leads. Protegido con HTTP Basic (usuario cualquiera, contraseña ADMIN_PASSWORD).
 * GET /api/admin/leads            → CSV para Excel
 * GET /api/admin/leads?format=json → JSON
 */
export async function GET(request: NextRequest) {
  if (!rateLimit(`admin:${clientIp(request.headers)}`, 20, 60_000)) {
    return new NextResponse("Demasiados intentos", { status: 429 })
  }
  if (!authorized(request)) {
    return new NextResponse("Acceso restringido", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Pikolete leads", charset="UTF-8"' },
    })
  }

  const leads = await listLeads()
  if (request.nextUrl.searchParams.get("format") === "json") {
    return NextResponse.json(leads, { headers: { "Cache-Control": "no-store" } })
  }
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(leadsToCsv(leads), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pikolete-leads-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
