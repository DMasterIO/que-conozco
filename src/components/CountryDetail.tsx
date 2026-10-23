import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from './Modal'
import CountryZoomMap from './CountryZoomMap'
import { byCca2, cityKey, loadCityDetails } from '../lib/countries'
import { countryStat, countryWishCount, continentStats, fmtPct, worldStat } from '../lib/stats'
import { useStore } from '../store'
import { useI18n } from '../lib/i18n-context'
import { countryName, continentLabel } from '../lib/translations'
import { cityName, regionLabel } from '../lib/names'
import type { City } from '../types'

// Rows rendered up front and added each time the list is scrolled to its end. India alone has
// thousands of localities, so mounting them all at once is what made opening a country slow.
const PAGE_SIZE = 250

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<{ key: string; n: number }>({ key: '', n: PAGE_SIZE })
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


  const loading = loaded === null || loaded.cca2 !== cca2
  const cityList = loading ? [] : loaded.cities
  const q = normalize(query.trim())
  const filtered = q
    ? cityList.filter(
        (c) =>
          normalize(c.n).includes(q) ||
          normalize(c.nEs ?? '').includes(q) ||
          normalize(c.nEn ?? '').includes(q) ||
          normalize(c.a ?? '').includes(q) ||
          normalize(c.aEs ?? '').includes(q) ||
          normalize(c.aEn ?? '').includes(q),
      )
    : cityList

  // A new country or search starts again from the first page.
  const listKey = `${cca2}|${q}`
  const limit = shown.key === listKey ? shown.n : PAGE_SIZE
  const visibleCities = filtered.length > limit ? filtered.slice(0, limit) : filtered
  const hasMore = visibleCities.length < filtered.length

  // `cityList` is pre-sorted by region, so grouping preserves that order.
  const groups: { region: string; cities: City[] }[] = []
  const groupIndex = new Map<string, City[]>()
  for (const c of visibleCities) {
    const region = c.a ?? ''
    let list = groupIndex.get(region)
    if (!list) {
      list = []
      groupIndex.set(region, list)
      groups.push({ region, cities: list })
    }
    list.push(c)
  }

  useEffect(() => {
    const el = sentinelRef.current
    if (!hasMore || !el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown((cur) => ({ key: listKey, n: (cur.key === listKey ? cur.n : PAGE_SIZE) + PAGE_SIZE }))
        }
      },
      { root: scrollRef.current, rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, listKey, limit])

  if (!meta || !stat) return null

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <span>{meta.flag}</span>
          <span>{countryName(meta.name, meta.nameEn, lang)}</span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
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
              className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
            >
              {stat.status === 'full' ? t('unmarkAll') : t('markAllCountry')}
            </button>
          </div>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('searchLocality', { name: countryName(meta.name, meta.nameEn, lang) })}
          placeholder={t('searchLocality', { name: countryName(meta.name, meta.nameEn, lang) })}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-teal-950"
        />

        <div ref={scrollRef} className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('loading')}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('noResults', { query })}
            </div>
          )}
          {groups.map(({ region, cities }) => {
            const regionVisited = cities.reduce((n, c) => n + (visited.has(cityKey(c.id)) ? 1 : 0), 0)
            return (
              <div key={region || '__no_region__'} className="cv-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/95 px-4 py-1.5 backdrop-blur dark:border-slate-800 dark:bg-slate-800/95">
                  <span className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {regionLabel(cities[0], lang) ?? t('noRegion')}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {regionVisited}/{cities.length}
                  </span>
                </div>
                {cities.map((c) => {
                  const key = cityKey(c.id)
                  const isVisited = visited.has(key)
                  const isWished = wishlist.has(key)
                  return (
                    <button
                      key={c.id}
                      onClick={() => cycleCity(c.id)}
                      className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-2.5 text-left pointer-coarse:min-h-12 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
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
                      <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                        {cityName(c, lang)}
                      </span>
                      <span className="w-20 text-right text-xs text-slate-500 dark:text-slate-400">
                        {c.p.toLocaleString(lang)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
          {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-8" />}
        </div>
      </div>
    </Modal>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
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
