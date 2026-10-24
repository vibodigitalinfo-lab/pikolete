# Pikolete Inspector · Auditor Web & SEO Express

Micro-SaaS de [pikolete.com](https://pikolete.com): pegas una URL y el "agente Pikolete" la inspecciona
(SEO, velocidad, seguridad SSL y estructura), le pone una nota de 0 a 100 y emite una "multa" con el
diagnóstico de cada fallo. Las 3 soluciones más urgentes son gratis; el resto y el PDF oficial se
desbloquean por $9.99 con un Stripe Payment Link.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · shadcn/ui (Radix) · lucide-react · framer-motion ·
cheerio (análisis HTML) · jsPDF (informes).

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sin Stripe configurado, en desarrollo aparece el botón **"Desbloquear (modo demo)"**.

## Estructura

| Ruta | Qué hace |
| --- | --- |
| `src/app/page.tsx` | Landing (hero, prueba social, qué revisamos, precios, FAQ) |
| `src/app/resultados/page.tsx` | Dashboard "La Multa de Pikolete" |
| `src/app/api/inspect/route.ts` | `POST {url}` → auditoría. Elimina en servidor las soluciones bloqueadas |
| `src/app/api/unlock/verify/route.ts` | Retorno de Stripe: verifica el pago y firma la cookie de desbloqueo |
| `src/app/api/unlock/demo/route.ts` | Desbloqueo de prueba (solo dev o `PIKOLETE_DEMO_UNLOCK=true`) |
| `src/app/api/leads/route.ts` | Guarda emails y solicitudes de presupuesto en `data/leads.json` |
| `src/lib/audit/engine.ts` | Los 26 controles y el score ponderado |
| `src/lib/audit/fetch-page.ts` | Descarga segura (anti-SSRF, redirecciones manuales, límites) |
| `src/lib/pdf.ts` | Generación del informe PDF en el navegador |

## Configurar el cobro con Stripe

1. Crea un Payment Link de $9.99 en Stripe.
2. En "Después del pago" elige *Redirigir a tu web* con:
   `https://TU-DOMINIO/api/unlock/verify?session_id={CHECKOUT_SESSION_ID}`
3. Define en Vercel: `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`, `STRIPE_SECRET_KEY` y `PIKOLETE_UNLOCK_SECRET`.

El dominio auditado viaja en `client_reference_id`; al volver, el servidor consulta la sesión en Stripe y,
si está pagada, firma una cookie HMAC válida 30 días para ese dominio.

## Limitaciones conocidas (MVP)

- `data/leads.json` no persiste en Vercel (disco de solo lectura): conecta un CRM, Resend o una base de datos.
- El rate limit es en memoria (por instancia).
- No se envían emails todavía: el informe básico se descarga al dejar el email.
