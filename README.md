# Pikolete Inspector · Auditor Web & SEO Express

Micro-SaaS de [pikolete.com](https://pikolete.com): pegas una URL y el "agente Pikolete" la inspecciona
(SEO, velocidad, seguridad SSL y estructura), le pone una nota de 0 a 100 y emite una "multa" con el
diagnóstico de cada fallo. Todo es gratis: las 3 soluciones más urgentes se ven sin registro y el resto,
junto con el PDF oficial, se desbloquean dejando el email (con consentimiento RGPD).

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · shadcn/ui (Radix) · lucide-react · framer-motion ·
cheerio (análisis HTML) · jsPDF (informes).

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sin `BLOB_READ_WRITE_TOKEN`, los leads se guardan en `data/leads.json` (ignorado por git).

## Estructura

| Ruta | Qué hace |
| --- | --- |
| `src/app/page.tsx` | Landing (hero, prueba social, qué revisamos, precios, FAQ) |
| `src/app/resultados/page.tsx` | Dashboard "La Multa de Pikolete" |
| `src/app/api/inspect/route.ts` | `POST {url}` → auditoría. Elimina en servidor las soluciones bloqueadas |
| `src/app/api/leads/route.ts` | Guarda el lead en Vercel Blob privado y desbloquea el informe del dominio |
| `src/app/admin/page.tsx` | Panel de contactos (login con `ADMIN_PASSWORD`) |
| `src/app/api/admin/leads/route.ts` | Exporta los leads en CSV (o `?format=json`) y borra por id |
| `src/app/api/admin/session/route.ts` | Inicio y cierre de sesión del panel |
| `src/app/privacidad/page.tsx` | Política de privacidad |
| `src/lib/audit/engine.ts` | Los 26 controles y el score ponderado |
| `src/lib/audit/fetch-page.ts` | Descarga segura (anti-SSRF, redirecciones manuales, límites) |
| `src/lib/pdf.ts` | Generación del informe PDF en el navegador |

## Ver los leads

Panel en **`https://pikolete.com/admin`** (contraseña `ADMIN_PASSWORD`): estadísticas, gráfico diario,
buscador, filtros, ficha de cada contacto, borrado (RGPD) y exportación a CSV.
También `https://pikolete.com/api/admin/leads` descarga el CSV directamente (HTTP Basic). Cada lead guarda: email, nombre, empresa, teléfono, perfil,
web auditada y su nota, consentimiento de marketing, país/ciudad/idioma/dispositivo y origen (referer y UTM).
Nunca se guarda la IP.

## Emails (Resend, gratis)

Al dejar sus datos, el cliente recibe el informe completo en PDF desde `hola@pikolete.com`
(el servidor vuelve a auditar la web; no confía en datos del navegador). Cada solicitud de presupuesto
avisa a `NOTIFY_EMAIL`. Se usa Resend si existe `RESEND_API_KEY` (plan gratuito: 3.000/mes, 100/día);
como alternativa, Cloudflare Email Sending con `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_EMAIL_TOKEN`.
Sin ninguno no se envía nada y la web sigue funcionando. Código en `src/lib/mailer.ts` y `src/lib/notifications.ts`.

## Limitaciones conocidas (MVP)

- El rate limit es en memoria (por instancia).
- El rate limit y el antirreenvío de emails son en memoria (por instancia).
