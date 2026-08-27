import { useMemo, useState } from 'react'
import Modal from './Modal'
import CountryZoomMap from './CountryZoomMap'
import { byCca2, citiesFor, cityKey } from '../lib/countries'
import { countryStat, continentStats, fmtPct, worldStat } from '../lib/stats'
import { useStore } from '../store'
import { useI18n } from '../lib/i18n-context'
import { countryName, continentLabel } from '../lib/translations'

export default function CountryDetail({ cca2, onClose }: { cca2: string; onClose: () => void }) {
  const visitedArr = useStore((s) => s.visited)
  const visited = useMemo(() => new Set(visitedArr), [visitedArr])
  const colors = useStore((s) => s.colors)
  const toggleCity = useStore((s) => s.toggleCity)
  const toggleCountry = useStore((s) => s.toggleCountry)
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')

  const meta = byCca2.get(cca2)
  const stat = useMemo(() => (meta ? countryStat(meta, visited) : null), [meta, visited])
  const contAgg = useMemo(
    () => (meta ? continentStats(visited).find((c) => c.key === meta.continentKey) : null),
    [meta, visited],
  )
  const world = useMemo(() => worldStat(visited), [visited])

  if (!meta || !stat) return null

  const cities = citiesFor(cca2)
  const q = normalize(query.trim())
  const filtered = q
    ? cities.filter((c) => normalize(c.n).includes(q) || normalize(c.a ?? '').includes(q))
    : cities

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <span>{meta.flag}</span>
          <span>{countryName(meta.name, meta.nameEn, lang)}</span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-500">
            {meta.cca2}
          </span>
        </span>
      }
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label={t('country')} value={fmtPct(stat.pct)} />
          <Stat
            label={continentLabel(meta.continentKey, lang)}
            value={contAgg ? fmtPct((contAgg.visited / contAgg.total) * 100) : '-'}
          />
          <Stat label={t('world')} value={fmtPct(world.pct)} />
        </div>

        <CountryZoomMap
          cca2={cca2}
          visited={visited}
          colors={colors}
          onToggleCity={(id) => toggleCity(id)}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {t('localitiesVisited', { visited: stat.visited, total: stat.total })}
          </p>
          <button
            onClick={() => toggleCountry(cca2)}
            className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
          >
            {stat.status === 'full' ? t('unmarkAll') : t('markAllCountry')}
          </button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchLocality', { name: countryName(meta.name, meta.nameEn, lang) })}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />

        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              {t('noResults', { query })}
            </div>
          )}
          {filtered.map((c) => {
            const key = cityKey(c.id)
            const isVisited = visited.has(key)
            return (
              <button
                key={c.id}
                onClick={() => toggleCity(c.id)}
                className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-2.5 text-left hover:bg-slate-50"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold text-white transition ${
                    isVisited ? '' : 'border-slate-300'
                  }`}
                  style={{ background: isVisited ? colors.visited : 'transparent' }}
                >
                  {isVisited ? '✓' : ''}
                </span>
                <span className="flex-1 truncate text-sm text-slate-700">{c.n}</span>
                {c.a && <span className="text-xs text-slate-400">{c.a}</span>}
                <span className="w-20 text-right text-xs text-slate-400">
                  {c.p.toLocaleString('es')}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
    </div>
  )
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
