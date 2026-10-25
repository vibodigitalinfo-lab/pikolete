import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

const BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20 2 35 8v11c0 9-6.5 16-15 19C11.5 35 5 28 5 19V8Z" fill="#fcfaf6"/><polygon points="20,11.5 22.2,16.6 27.6,16.9 23.4,20.3 24.8,25.6 20,22.6 15.2,25.6 16.6,20.3 12.4,16.9 17.8,16.6" fill="#173268"/></svg>`

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#173268" }}>
        <img src={`data:image/svg+xml,${encodeURIComponent(BADGE_SVG)}`} width={130} height={130} alt="" />
      </div>
    ),
    size
  )
}
