import type { Metadata } from "next"

import { Faq, FAQS } from "@/components/landing/faq"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Pricing } from "@/components/landing/pricing"
import { SocialProof } from "@/components/landing/social-proof"
import { WhatWeCheck } from "@/components/landing/what-we-check"
import { AdSlot } from "@/components/site/ad-slot"
import { siteConfig } from "@/lib/config"
import { baseOpenGraph, jsonLd, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...baseOpenGraph, title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/" },
}

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: "Pikolete",
      url: siteConfig.url,
      logo: `${siteConfig.url}/apple-icon`,
      email: siteConfig.quoteEmail,
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      name: siteConfig.name,
      url: siteConfig.url,
      inLanguage: "es-ES",
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteConfig.url}/#app`,
      name: siteConfig.name,
      url: siteConfig.url,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "es-ES",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteConfig.url}/#faq`,
      inLanguage: "es-ES",
      mainEntity: FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED_DATA) }} />
      <Hero />
      <SocialProof />
      <WhatWeCheck />
      <AdSlot slot={siteConfig.adsense.slots.landing} className="mx-auto max-w-6xl px-4" />
      <HowItWorks />
      <Pricing />
      <Faq />
    </>
  )
}
