import { NextResponse, type NextRequest } from "next/server"

import { isAdminRequest } from "@/lib/admin-auth"
import { deleteLead, leadsToCsv, listLeads } from "@/lib/leads"
import { clientIp, rateLimit } from "@/lib/rate-limit"

function denied(request: NextRequest) {
  // El panel usa su propio login: sin WWW-Authenticate para que el navegador no muestre su diálogo.
  const fromPanel = request.headers.get("x-pikolete-panel") === "1"
  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: fromPanel ? {} : { "WWW-Authenticate": 'Basic realm="Pikolete leads", charset="UTF-8"' },
  })
}

/**
 * Exporta los leads (sesión del panel o HTTP Basic con ADMIN_PASSWORD).
 * GET /api/admin/leads             → CSV para Excel
 * GET /api/admin/leads?format=json → JSON
 */
export async function GET(request: NextRequest) {
  if (!rateLimit(`admin:${clientIp(request.headers)}`, 30, 60_000)) {
    return new NextResponse("Demasiados intentos", { status: 429 })
  }
  if (!isAdminRequest(request)) return denied(request)

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

/** DELETE /api/admin/leads?id=... → borra un lead (derecho de supresión RGPD). */
export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return denied(request)
  const id = request.nextUrl.searchParams.get("id") ?? ""
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 })
  const deleted = await deleteLead(id)
  return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "No encontrado" }, { status: 404 })
}
