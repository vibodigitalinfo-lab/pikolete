import Link from "next/link"

import { PikoleteLogo } from "@/components/brand/pikolete-logo"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Pikolete Inspector, inicio">
          <PikoleteLogo />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/#que-revisamos" className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block">
            Qué revisamos
          </Link>
          <Link href="/#precios" className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block">
            Precios
          </Link>
          <Button asChild size="sm" className="ml-2">
            <Link href="/#inspeccion">Inspeccionar gratis</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
