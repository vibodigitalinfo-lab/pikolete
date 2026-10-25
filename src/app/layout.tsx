import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { SourceTracker } from "@/components/site/source-tracker"
import { siteConfig } from "@/lib/config"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Pikolete Inspector · Auditor Web & SEO Express",
    template: "%s · Pikolete Inspector",
  },
  description:
    "Inspecciona tu web gratis en segundos: SEO, velocidad, seguridad SSL y estructura. Recibe tu multa con diagnóstico claro y cómo solucionarlo.",
  openGraph: {
    title: "Pikolete Inspector · Auditor Web & SEO Express",
    description: "Inspecciona tu sitio web antes de que lo haga tu competencia.",
    url: siteConfig.url,
    siteName: "Pikolete Inspector",
    locale: "es_ES",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {siteConfig.adsense.client && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsense.client}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <SourceTracker />
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
