import type { Metadata } from "next"
import { Suspense } from "react"

import { InspectionLoader } from "@/components/results/inspection-loader"
import { ResultsView } from "@/components/results/results-view"

export const metadata: Metadata = {
  title: "La Multa de Pikolete",
  robots: { index: false },
}

async function Results({ searchParams }: { searchParams: PageProps<"/resultados">["searchParams"] }) {
  const params = await searchParams
  const url = typeof params.url === "string" ? params.url : ""
  const justUnlocked = params.desbloqueado === "1"
  return <ResultsView key={url} url={url} justUnlocked={justUnlocked} />
}

export default function ResultadosPage({ searchParams }: PageProps<"/resultados">) {
  return (
    <Suspense fallback={<InspectionLoader url="" />}>
      <Results searchParams={searchParams} />
    </Suspense>
  )
}
