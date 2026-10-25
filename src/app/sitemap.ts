import type { MetadataRoute } from "next"
import { cacheLife } from "next/cache"

import { PRIVACY_VERSION, siteConfig } from "@/lib/config"
import { CONTENT_UPDATED } from "@/lib/seo"
import { recentDomains } from "@/lib/trust/recent"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache"
  cacheLife("hours")

  const domains = await recentDomains(5_000)
  return [
    {
      url: siteConfig.url,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/es-fiable`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...domains.map((d) => ({
      url: `${siteConfig.url}/es-fiable/${d}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    {
      url: `${siteConfig.url}/aviso-legal`,
      lastModified: PRIVACY_VERSION,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteConfig.url}/privacidad`,
      lastModified: PRIVACY_VERSION,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}
