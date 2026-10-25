import { ImageResponse } from "next/og"

export const alt = "Pikolete Inspector: auditoría web y SEO gratis en segundos"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Colores de globals.css en hex: ImageResponse no entiende oklch().
const PRIMARY = "#173268"
const BADGE = "#fbc031"
const BACKGROUND = "#fcfaf6"

const BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20 2 35 8v11c0 9-6.5 16-15 19C11.5 35 5 28 5 19V8Z" fill="${PRIMARY}"/><path d="M20 6.2 31 10.6V19c0 7-5 12.5-11 15-6-2.5-11-8-11-15v-8.4Z" fill="none" stroke="${BADGE}" stroke-width="1.4"/><polygon points="20,11.5 22.2,16.6 27.6,16.9 23.4,20.3 24.8,25.6 20,22.6 15.2,25.6 16.6,20.3 12.4,16.9 17.8,16.6" fill="${BADGE}"/></svg>`

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: BACKGROUND,
          borderBottom: `24px solid ${BADGE}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src={`data:image/svg+xml,${encodeURIComponent(BADGE_SVG)}`} width={88} height={88} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontWeight: 800, color: PRIMARY }}>Pikolete</span>
            <span style={{ fontSize: 20, letterSpacing: 6, color: "#6b6b6b" }}>INSPECTOR</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 68, fontWeight: 800, color: PRIMARY, lineHeight: 1.1 }}>
            Auditoría web y SEO gratis en 15 segundos
          </span>
          <span style={{ fontSize: 32, color: "#4a4a4a" }}>
            SEO, velocidad, SSL y estructura: tu multa con diagnóstico y solución.
          </span>
        </div>
        <span style={{ fontSize: 28, fontWeight: 700, color: PRIMARY }}>pikolete.com</span>
      </div>
    ),
    size
  )
}
