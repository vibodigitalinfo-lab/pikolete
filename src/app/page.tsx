import { Faq } from "@/components/landing/faq"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Pricing } from "@/components/landing/pricing"
import { SocialProof } from "@/components/landing/social-proof"
import { WhatWeCheck } from "@/components/landing/what-we-check"
import { AdSlot } from "@/components/site/ad-slot"
import { siteConfig } from "@/lib/config"

export default function Home() {
  return (
    <>
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
