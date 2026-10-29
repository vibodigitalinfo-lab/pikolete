# Lead Radar (MVP, experimental)

Script independiente: **no forma parte de la web** ni se despliega en Vercel. Audita una lista de dominios
de pequeños negocios, detecta fallos técnicos y saca **solo** contactos corporativos genéricos.

```bash
node tools/lead-radar/radar.mjs dominios.txt --out leads --concurrency 3 --suppress suppression.txt
node --test tools/lead-radar/radar.test.mjs   # tests sin red
```

Requisitos: Node 20 o superior. Sin dependencias.

## Qué comprueba

| Código | Qué significa |
| --- | --- |
| `sin_https` | La web no responde por HTTPS (o el certificado falla) |
| `http_sin_redireccion` | `http://` no redirige a `https://` |
| `servidor_lento` | Primer byte en más de 1,5 s (aproximación, no es Lighthouse) |
| `html_pesado` | HTML de más de 500 KB |
| `no_movil` | Sin `<meta name="viewport" content="width=device-width">` |
| `sin_title` / `sin_meta_description` | SEO básico |
| `sin_politica_privacidad` | No se ve enlace a política de privacidad |

También anota tecnologías (WordPress, Wix, Shopify, gestor de cookies…) y el tipo de titular
(sociedad / persona física) leyendo el aviso legal.

## Reglas de privacidad que aplica el script

- Respeta `robots.txt` (grupo `PikoleteRadar` o `*`), se identifica con su User-Agent, espera 1 s entre páginas
  y visita como mucho 4 páginas por dominio (inicio + contacto/aviso legal).
- Solo guarda emails de rol del propio dominio (`info@`, `contacto@`, `reservas@`…). Los nominativos
  (`maria.garcia@`), los de Gmail/Hotmail y los móviles se descartan y solo se cuentan.
- Si el aviso legal muestra un NIF/DNI de persona física (autónomo), no guarda **ningún** contacto.
  El DNI nunca se guarda.
- Cada contacto lleva `source_url` y `collected_at` (procedencia).
- `--suppress` recibe la lista de exclusión (dominios que han pedido no aparecer) y se aplica antes de rastrear.
- Bloquea IPs internas (protección SSRF), igual que el inspector de la web.

Esto reduce el riesgo, pero **no** convierte por sí solo la venta de datos en legal: antes de vender nada,
revisa el plan con un abogado de protección de datos (ver la propuesta enlazada en el PR).
