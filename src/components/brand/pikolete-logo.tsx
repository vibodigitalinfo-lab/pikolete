import { cn } from "@/lib/utils"

export function PikoleteBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-8", className)}>
      <path
        d="M20 2 35 8v11c0 9-6.5 16-15 19C11.5 35 5 28 5 19V8Z"
        fill="var(--primary)"
      />
      <path
        d="M20 6.2 31 10.6V19c0 7-5 12.5-11 15-6-2.5-11-8-11-15v-8.4Z"
        fill="none"
        stroke="var(--badge)"
        strokeWidth="1.4"
      />
      <polygon
        points="20,11.5 22.2,16.6 27.6,16.9 23.4,20.3 24.8,25.6 20,22.6 15.2,25.6 16.6,20.3 12.4,16.9 17.8,16.6"
        fill="var(--badge)"
      />
    </svg>
  )
}

export function PikoleteLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <PikoleteBadge />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-primary">Pikolete</span>
        <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Inspector
        </span>
      </span>
    </span>
  )
}

/** Mascota: el agente Pikolete con su gorra y su lupa. */
export function PikoleteMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={cn("size-28", className)}>
      <circle cx="60" cy="70" r="30" fill="#f6d2b4" />
      <circle cx="44" cy="80" r="5" fill="#f2a8a0" opacity="0.5" />
      <circle cx="76" cy="80" r="5" fill="#f2a8a0" opacity="0.5" />
      <path d="M30 46 Q60 6 90 46 Z" fill="var(--primary)" />
      <rect x="24" y="42" width="72" height="11" rx="5.5" fill="var(--primary)" />
      <rect x="24" y="42" width="72" height="3" rx="1.5" fill="var(--badge)" opacity="0.9" />
      <polygon
        points="60,22 62.2,27 67.6,27.4 63.4,30.8 64.8,36 60,33 55.2,36 56.6,30.8 52.4,27.4 57.8,27"
        fill="var(--badge)"
      />
      <circle cx="49" cy="67" r="3.6" fill="var(--primary)" />
      <circle cx="71" cy="67" r="3.6" fill="var(--primary)" />
      <path d="M43 62 L55 61" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M65 61 L77 62" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M44 81 Q52 74 60 79 Q68 74 76 81 Q68 85 60 82 Q52 85 44 81 Z" fill="#5b3b2a" />
      <path d="M53 89 Q60 94 67 89" fill="none" stroke="#5b3b2a" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="97" cy="88" r="12" fill="oklch(0.9 0.05 230 / 0.55)" stroke="var(--primary)" strokeWidth="4" />
      <path d="M90 82 Q94 79 98 80" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M105.5 97 L114 106" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}
