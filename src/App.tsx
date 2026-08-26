import { useMemo, useRef, useState } from 'react'
import WorldMap from './components/WorldMap'
import CountryList from './components/CountryList'
import StatsPanel from './components/StatsPanel'
import ColorConfig from './components/ColorConfig'
import ShareModal from './components/ShareModal'
import CountryDetail from './components/CountryDetail'
import { useStore } from './store'
import { continentStats, fmtPct, worldStat } from './lib/stats'
import { COUNTRIES, citiesFor } from './lib/countries'

type ModalKind = 'stats' | 'colors' | 'share' | null

const SHOW_IMPORT_EXPORT = false

export default function App() {
  const visitedArr = useStore((s) => s.visited)
  const colors = useStore((s) => s.colors)
  const toggleCountry = useStore((s) => s.toggleCountry)
  const setSelectedCountry = useStore((s) => s.setSelectedCountry)
  const selectedCountry = useStore((s) => s.selectedCountry)
  const clearAll = useStore((s) => s.clearAll)
  const importData = useStore((s) => s.importData)

  const [modal, setModal] = useState<ModalKind>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const visited = useMemo(() => new Set(visitedArr), [visitedArr])
  const world = useMemo(() => worldStat(visited), [visited])
  const continents = useMemo(() => continentStats(visited), [visited])

  const countriesWithCities = COUNTRIES.filter((c) => citiesFor(c.cca2).length > 0).length
  const visitedContinents = continents.filter((c) => c.visited > 0).length

  function exportJson() {
    const data = JSON.stringify({ visited: visitedArr, colors }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'que-conozco-datos.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (Array.isArray(data.visited)) {
          importData({ visited: data.visited, colors: data.colors ?? colors })
        }
      } catch {
        /* invalid file */
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-xl">
              🌍
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">¿Qué conozco?</h1>
              <p className="text-xs text-slate-500">Tu mapa de países y localidades visitados</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <HeaderButton onClick={() => setModal('share')}>📤 Compartir</HeaderButton>
            <HeaderButton onClick={() => setModal('colors')}>🎨 Colores</HeaderButton>
            <HeaderButton onClick={() => setModal('stats')}>📊 Estadísticas</HeaderButton>
            {SHOW_IMPORT_EXPORT && (
              <>
                <HeaderButton onClick={exportJson}>⬇ Exportar</HeaderButton>
                <HeaderButton onClick={() => fileRef.current?.click()}>⬆ Importar</HeaderButton>
              </>
            )}
            <HeaderButton onClick={() => clearAll()} danger>
              Reiniciar
            </HeaderButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-600">Mapa del mundo</h2>
            <span className="text-xs text-slate-400">Clic: marcar país · Doble clic: ver ciudades</span>
          </div>
          <WorldMap
            visited={visited}
            colors={colors}
            onToggle={toggleCountry}
            onOpenCountry={setSelectedCountry}
          />
          <div className="flex items-center gap-4 border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">
            <Legend color={colors.visited} label="Visitado" />
            <Legend color={colors.notVisited} label="No visitado" />
            <Legend color={colors.hover} label="Hover" />
            <Legend color={colors.border} label="Borde" />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickStat label="Mundo explorado" value={fmtPct(world.pct)} />
          <QuickStat label="Países visitados" value={`${world.countriesVisited}/${world.countriesTotal}`} />
          <QuickStat label="Localidades" value={`${world.visited}/${world.total}`} />
          <QuickStat label="Continentes" value={`${visitedContinents}/${continents.length}`} />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold">Países</h2>
          <CountryList
            visited={visited}
            colors={colors}
            onToggle={toggleCountry}
            onOpen={setSelectedCountry}
          />
        </section>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          ¿Qué conozco? · queconozco.com · {countriesWithCities} países y sus localidades · tus datos se guardan en tu navegador
        </footer>
      </main>

      {modal === 'stats' && <StatsPanel onClose={() => setModal(null)} />}
      {modal === 'colors' && <ColorConfig onClose={() => setModal(null)} />}
      {modal === 'share' && <ShareModal onClose={() => setModal(null)} />}
      {selectedCountry && (
        <CountryDetail cca2={selectedCountry} onClose={() => setSelectedCountry(null)} />
      )}

      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
    </div>
  )
}

function HeaderButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        danger ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm ring-1 ring-black/10" style={{ background: color }} />
      {label}
    </span>
  )
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
}
