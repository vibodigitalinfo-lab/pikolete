import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/config"
import { SITE_DESCRIPTION } from "@/lib/seo"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} · ${siteConfig.tagline}`,
    short_name: "Pikolete",
    description: SITE_DESCRIPTION,
    lang: "es",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfaf6",
    theme_color: "#173268",
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  }
}
