import { Faq } from "@/components/landing/faq"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Pricing } from "@/components/landing/pricing"
import { SocialProof } from "@/components/landing/social-proof"
import { WhatWeCheck } from "@/components/landing/what-we-check"

export default function Home() {
  return (
    <>
      <Hero />
      <SocialProof />
      <WhatWeCheck />
      <HowItWorks />
      <Pricing />
      <Faq />
    </>
  )
}
