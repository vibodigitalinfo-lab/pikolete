const STEPS = [
  { n: "01", title: "Pega tu URL", text: "Sin registros ni instalaciones. Solo la dirección de tu web." },
  { n: "02", title: "Pikolete patrulla", text: "Analizamos el HTML, las cabeceras, el SSL y la velocidad en tiempo real." },
  { n: "03", title: "Recibe tu multa", text: "Una nota de 0 a 100, cada infracción explicada y cómo corregirla." },
]

export function HowItWorks() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Así funciona la inspección</h2>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="font-mono text-sm font-bold text-badge">{s.n}</span>
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-primary-foreground/75">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
