import type { CountryMeta, ContinentAgg } from '../types'
import { countryCityIds, CONTINENTS, CONTINENT_ORDER, COUNTRIES } from './countries'

export interface CountryStat {
  meta: CountryMeta
  total: number
  visited: number
  status: 'none' | 'partial' | 'full'
  pct: number
}

const countryStatCache = new WeakMap<Set<string>, Map<string, CountryStat>>()
const countryWishCache = new WeakMap<Set<string>, Map<string, number>>()
const worldStatCache = new WeakMap<Set<string>, WorldStat>()
const continentStatsCache = new WeakMap<Set<string>, ContinentAgg[]>()

export function countryStat(meta: CountryMeta, visited: Set<string>): CountryStat {
  let perSet = countryStatCache.get(visited)
  if (!perSet) {
    perSet = new Map()
    countryStatCache.set(visited, perSet)
  }
  const cached = perSet.get(meta.cca2)
  if (cached) return cached

  const ids = countryCityIds(meta.cca2)
  const total = ids.length
  let visitedCount = 0
  for (const id of ids) {
    if (visited.has(String(id))) visitedCount++
  }
  const status =
    total === 0 ? 'none' : visitedCount === 0 ? 'none' : visitedCount === total ? 'full' : 'partial'
  const result: CountryStat = {
    meta,
    total,
    visited: visitedCount,
    status,
    pct: total === 0 ? 0 : (visitedCount / total) * 100,
  }
  perSet.set(meta.cca2, result)
  return result
}

export interface WorldStat {
  total: number
  visited: number
  pct: number
  countriesVisited: number
  countriesTotal: number
}

export function worldStat(visited: Set<string>): WorldStat {
  const cached = worldStatCache.get(visited)
  if (cached) return cached

  let total = 0
  let visitedCount = 0
  let countriesVisited = 0
  let countriesTotal = 0
  for (const meta of COUNTRIES) {
    const ids = countryCityIds(meta.cca2)
    if (ids.length === 0) continue
    countriesTotal++
    let cVisited = 0
    for (const id of ids) {
      if (visited.has(String(id))) cVisited++
    }
    total += ids.length
    visitedCount += cVisited
    if (cVisited > 0) countriesVisited++
  }
  const result: WorldStat = {
    total,
    visited: visitedCount,
    pct: total === 0 ? 0 : (visitedCount / total) * 100,
    countriesVisited,
    countriesTotal,
  }
  worldStatCache.set(visited, result)
  return result
}

export function continentStats(visited: Set<string>): ContinentAgg[] {
  const cached = continentStatsCache.get(visited)
  if (cached) return cached

  const map = new Map<string, ContinentAgg>()
  for (const key of CONTINENT_ORDER) {
    map.set(key, { key, name: CONTINENTS[key], total: 0, visited: 0 })
  }
  for (const meta of COUNTRIES) {
    const agg = map.get(meta.continentKey)
    if (!agg) continue
    const ids = countryCityIds(meta.cca2)
    agg.total += ids.length
    for (const id of ids) {
      if (visited.has(String(id))) agg.visited++
    }
  }
  const result = CONTINENT_ORDER.map((key) => map.get(key)!).filter((a) => a.total > 0)
  continentStatsCache.set(visited, result)
  return result
}

export function countryWishCount(meta: CountryMeta, wishlist: Set<string>): number {
  let perSet = countryWishCache.get(wishlist)
  if (!perSet) {
    perSet = new Map()
    countryWishCache.set(wishlist, perSet)
  }
  const cached = perSet.get(meta.cca2)
  if (cached !== undefined) return cached

  let n = 0
  for (const id of countryCityIds(meta.cca2)) {
    if (wishlist.has(String(id))) n++
  }
  perSet.set(meta.cca2, n)
  return n
}

export interface WishStat {
  cities: number
  countries: number
}

export function wishlistStats(wishlist: Set<string>): WishStat {
  let countries = 0
  for (const meta of COUNTRIES) {
    if (countryWishCount(meta, wishlist) > 0) countries++
  }
  return { cities: wishlist.size, countries }
}

export function mostVisitedCountry(visited: Set<string>): CountryStat | null {
  let best: CountryStat | null = null
  for (const meta of COUNTRIES) {
    const s = countryStat(meta, visited)
    if (s.visited === 0) continue
    if (!best || s.visited > best.visited || (s.visited === best.visited && s.pct > best.pct)) {
      best = s
    }
  }
  return best
}

export function fmtPct(pct: number, digits = 2): string {
  if (!isFinite(pct)) return '0%'
  if (pct === 0) return '0%'
  if (pct < 0.01) return '<0.01%'
  return `${pct.toFixed(digits).replace(/\.?0+$/, '')}%`
}
