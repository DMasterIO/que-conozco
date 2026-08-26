import { useMemo, useState } from 'react'
import { CONTINENT_ORDER, COUNTRIES, CONTINENTS } from '../lib/countries'
import { countryStat, fmtPct } from '../lib/stats'
import type { MapColors } from '../types'

interface Props {
  visited: Set<string>
  colors: MapColors
  onToggle: (cca2: string) => void
  onOpen: (cca2: string) => void
}

export default function CountryList({ visited, colors, onToggle, onOpen }: Props) {
  const [query, setQuery] = useState('')
  const [continent, setContinent] = useState<string>('all')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CONTINENT_ORDER.map((key) => {
      const list = COUNTRIES.filter((c) => {
        if (c.continentKey !== key) return false
        if (continent !== 'all' && c.continentKey !== continent) return false
        if (q && !(c.name.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q))) return false
        return true
      }).map((c) => ({ meta: c, stat: countryStat(c, visited) }))
      return { key, name: CONTINENTS[key], list }
    }).filter((g) => g.list.length > 0)
  }, [query, continent, visited])

  const totalCount = groups.reduce((n, g) => n + g.list.length, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar país..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
        <select
          value={continent}
          onChange={(e) => setContinent(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        >
          <option value="all">Todos los continentes</option>
          {CONTINENT_ORDER.map((key) => (
            <option key={key} value={key}>
              {CONTINENTS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="text-xs text-slate-500">{totalCount} países</div>

      {groups.map((group) => (
        <div key={group.key}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {group.name}
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {group.list.map(({ meta, stat }) => (
              <div
                key={meta.cca2}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-teal-200"
              >
                <button
                  onClick={() => onToggle(meta.cca2)}
                  title={meta.name}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white transition ${
                    stat.status === 'full'
                      ? 'opacity-100'
                      : stat.status === 'partial'
                        ? 'opacity-60'
                        : 'opacity-20 hover:opacity-40'
                  }`}
                  style={{ background: stat.status === 'none' ? '#94a3b8' : colors.visited }}
                >
                  ✓
                </button>
                <button
                  onClick={() => onOpen(meta.cca2)}
                  className="flex min-w-0 flex-1 flex-col items-start text-left"
                >
                  <span className="truncate text-sm font-medium text-slate-800">
                    {meta.flag} {meta.name}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="rounded bg-slate-100 px-1 font-mono text-[10px] text-slate-500">
                      {meta.cca2}
                    </span>
                    {stat.visited}/{stat.total} · {fmtPct(stat.pct)}
                  </span>
                </button>
                <button
                  onClick={() => onOpen(meta.cca2)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-teal-600 hover:bg-teal-50"
                >
                  Ciudades
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
