import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import CountryZoomMap from './CountryZoomMap'
import { byCca2, cityKey, loadCityDetails } from '../lib/countries'
import { countryStat, countryWishCount, continentStats, fmtPct, worldStat } from '../lib/stats'
import { useStore } from '../store'
import { useI18n } from '../lib/i18n-context'
import { countryName, continentLabel } from '../lib/translations'
import type { City } from '../types'

export default function CountryDetail({ cca2, onClose }: { cca2: string; onClose: () => void }) {
  const visitedArr = useStore((s) => s.visited)
  const visited = useMemo(() => new Set(visitedArr), [visitedArr])
  const wishArr = useStore((s) => s.wishlist)
  const wishlist = useMemo(() => new Set(wishArr), [wishArr])
  const colors = useStore((s) => s.colors)
  const cycleCity = useStore((s) => s.cycleCity)
  const toggleCountry = useStore((s) => s.toggleCountry)
  const toggleWishCountry = useStore((s) => s.toggleWishCountry)
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [loaded, setLoaded] = useState<{ cca2: string; cities: City[] } | null>(null)

  const meta = byCca2.get(cca2)
  const stat = useMemo(() => (meta ? countryStat(meta, visited) : null), [meta, visited])
  const wishCount = useMemo(() => (meta ? countryWishCount(meta, wishlist) : 0), [meta, wishlist])
  const contAgg = useMemo(
    () => (meta ? continentStats(visited).find((c) => c.key === meta.continentKey) : null),
    [meta, visited],
  )
  const world = useMemo(() => worldStat(visited), [visited])

  useEffect(() => {
    let active = true
    loadCityDetails(cca2)
      .then((list) => {
        if (active) setLoaded({ cca2, cities: list })
      })
      .catch(() => {
        if (active) setLoaded({ cca2, cities: [] })
      })
    return () => {
      active = false
    }
  }, [cca2])

  if (!meta || !stat) return null

  const loading = loaded === null || loaded.cca2 !== cca2
  const cityList = loading ? [] : loaded.cities
  const q = normalize(query.trim())
  const filtered = q
    ? cityList.filter((c) => normalize(c.n).includes(q) || normalize(c.a ?? '').includes(q))
    : cityList

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <span>{meta.flag}</span>
          <span>{countryName(meta.name, meta.nameEn, lang)}</span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
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
          cities={cityList}
          visited={visited}
          wishlist={wishlist}
          colors={colors}
          onToggleCity={(id) => cycleCity(id)}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('localitiesVisited', { visited: stat.visited, total: stat.total })}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => toggleWishCountry(cca2)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                wishCount > 0
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900'
              }`}
            >
              {wishCount > 0 ? t('unwishAll') : t('wishAllCountry')}
            </button>
            <button
              onClick={() => toggleCountry(cca2)}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
            >
              {stat.status === 'full' ? t('unmarkAll') : t('markAllCountry')}
            </button>
          </div>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchLocality', { name: countryName(meta.name, meta.nameEn, lang) })}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-teal-950"
        />

        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              {t('loading')}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              {t('noResults', { query })}
            </div>
          )}
          {filtered.map((c) => {
            const key = cityKey(c.id)
            const isVisited = visited.has(key)
            const isWished = wishlist.has(key)
            return (
              <button
                key={c.id}
                onClick={() => cycleCity(c.id)}
                className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-2.5 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition ${
                    isVisited || isWished ? '' : 'border-slate-300 dark:border-slate-600'
                  }`}
                  style={{
                    background: isVisited
                      ? colors.visited
                      : isWished
                        ? colors.wish
                        : 'transparent',
                  }}
                >
                  {isVisited ? '✓' : isWished ? '★' : ''}
                </span>
                <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{c.n}</span>
                {c.a && <span className="text-xs text-slate-400 dark:text-slate-500">{c.a}</span>}
                <span className="w-20 text-right text-xs text-slate-400 dark:text-slate-500">
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
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <div className="text-xs text-slate-400 dark:text-slate-500">{label}</div>
      <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  )
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
