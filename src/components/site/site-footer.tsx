import Link from "next/link"

import { PikoleteLogo } from "@/components/brand/pikolete-logo"
import { siteConfig } from "@/lib/config"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <PikoleteLogo />
          <span className="hidden sm:inline">·</span>
          <span>{siteConfig.tagline}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <a href={`mailto:${siteConfig.quoteEmail}`} className="hover:text-foreground">
            {siteConfig.quoteEmail}
          </a>
          <Link href="/es-fiable" className="hover:text-foreground">
            ¿Es fiable esta web?
          </Link>
          <Link href="/es-fiable/tiendas" className="hover:text-foreground">
            Tiendas populares
          </Link>
          <Link href="/guias" className="hover:text-foreground">
            Guías
          </Link>
          <Link href="/metodologia" className="hover:text-foreground">
            Cómo revisamos
          </Link>
          <Link href="/sobre-pikolete" className="hover:text-foreground">
            Sobre Pikolete
          </Link>
          <Link href="/aviso-legal" className="hover:text-foreground">
            Aviso legal
          </Link>
          <Link href="/privacidad" className="hover:text-foreground">
            Privacidad
          </Link>
          <span>
            © pikolete.com{siteConfig.legal.taxId && ` · ${siteConfig.legal.owner || "Pikolete"} · NIF ${siteConfig.legal.taxId}`}
          </span>
        </div>
      </div>
    </footer>
  )
}
