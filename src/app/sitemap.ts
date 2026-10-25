import type { MetadataRoute } from "next"
import { cacheLife } from "next/cache"

import { GUIDES } from "@/content/guides"
import { PRIVACY_VERSION, siteConfig } from "@/lib/config"
import { CONTENT_UPDATED } from "@/lib/seo"
import { recentDomains } from "@/lib/trust/recent"
import { publishedPopularStores } from "@/lib/trust/report"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache"
  cacheLife("hours")

  const [recent, popular] = await Promise.all([recentDomains(5_000), publishedPopularStores()])
  const domains = [...new Set([...popular.flatMap((g) => g.domains), ...recent])]
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
    {
      url: `${siteConfig.url}/es-fiable/tiendas`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...domains.map((d) => ({
      url: `${siteConfig.url}/es-fiable/${d}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    {
      url: `${siteConfig.url}/guias`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...GUIDES.map((g) => ({
      url: `${siteConfig.url}/guias/${g.slug}`,
      lastModified: g.updated,
      changeFrequency: "monthly" as const,
      priority: 0.7,
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
