import type { CountryMeta, ContinentAgg } from '../types'
import { countryCityIds, CONTINENTS, CONTINENT_ORDER, COUNTRIES } from './countries'

export interface CountryStat {
  meta: CountryMeta
  total: number
  visited: number
  status: 'none' | 'partial' | 'full'
  pct: number
}

export function countryStat(meta: CountryMeta, visited: Set<string>): CountryStat {
  const ids = countryCityIds(meta.cca2)
  const total = ids.length
  let visitedCount = 0
  for (const id of ids) {
    if (visited.has(String(id))) visitedCount++
  }
  const status =
    total === 0 ? 'none' : visitedCount === 0 ? 'none' : visitedCount === total ? 'full' : 'partial'
  return {
    meta,
    total,
    visited: visitedCount,
    status,
    pct: total === 0 ? 0 : (visitedCount / total) * 100,
  }
}

export interface WorldStat {
  total: number
  visited: number
  pct: number
  countriesVisited: number
  countriesTotal: number
}

export function worldStat(visited: Set<string>): WorldStat {
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
  return {
    total,
    visited: visitedCount,
    pct: total === 0 ? 0 : (visitedCount / total) * 100,
    countriesVisited,
    countriesTotal,
  }
}

export function continentStats(visited: Set<string>): ContinentAgg[] {
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
  return CONTINENT_ORDER.map((key) => map.get(key)!).filter((a) => a.total > 0)
}

export function countryWishCount(meta: CountryMeta, wishlist: Set<string>): number {
  let n = 0
  for (const id of countryCityIds(meta.cca2)) {
    if (wishlist.has(String(id))) n++
  }
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
