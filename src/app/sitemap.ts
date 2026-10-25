import type { MetadataRoute } from "next"

import { PRIVACY_VERSION, siteConfig } from "@/lib/config"
import { CONTENT_UPDATED } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/privacidad`,
      lastModified: PRIVACY_VERSION,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}
