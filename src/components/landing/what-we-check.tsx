import { Gauge, LayoutTemplate, Search, type LucideIcon } from "lucide-react"

const AREAS: Array<{ icon: LucideIcon; title: string; text: string; items: string[] }> = [
  {
    icon: Search,
    title: "SEO",
    text: "Lo que Google lee antes de decidir dónde te coloca.",
    items: ["Title y meta description", "Open Graph y Twitter Cards", "Canonical, robots y sitemap", "Datos estructurados"],
  },
  {
    icon: Gauge,
    title: "Velocidad & Seguridad",
    text: "Si tu web va lenta o sin candado, el visitante se va.",
    items: [
      "Certificado SSL y HTTPS",
      "Tiempo de respuesta del servidor",
      "Compresión y peso del HTML",
      "Cabeceras de seguridad y HSTS",
    ],
  },
  {
    icon: LayoutTemplate,
    title: "Estructura",
    text: "El esqueleto que entienden buscadores y lectores de pantalla.",
    items: ["Encabezados H1 y H2", "Atributos alt en imágenes", "Adaptación a móvil", "Contenido y favicon"],
  },
]

export function WhatWeCheck() {
  return (
    <section id="que-revisamos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-badge-foreground uppercase">El reglamento</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
          Qué revisa el agente Pikolete
        </h2>
        <p className="mt-3 text-muted-foreground">
          26 controles agrupados en tres áreas. Cada infracción viene con su diagnóstico y su solución.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {AREAS.map(({ icon: Icon, title, text, items }) => (
          <article key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
            <span className="grid size-12 place-items-center rounded-xl bg-primary text-badge">
              <Icon className="size-6" />
            </span>
            <h3 className="mt-5 text-xl font-bold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-badge" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
