import { describe, it, expect } from 'vitest'
import { byCca2, countryCityIds } from './countries'
import {
  continentStats,
  countryStat,
  countryWishCount,
  fmtPct,
  mostVisitedCountry,
  wishlistStats,
  worldStat,
} from './stats'

const ad = byCca2.get('AD')!
const adIds = countryCityIds('AD')

describe('countryStat', () => {
  it('reports no visit for a fresh country', () => {
    const s = countryStat(ad, new Set())
    expect(s.total).toBe(adIds.length)
    expect(s.visited).toBe(0)
    expect(s.status).toBe('none')
    expect(s.pct).toBe(0)
  })

  it('reports partial for one city visited', () => {
    const s = countryStat(ad, new Set([String(adIds[0])]))
    expect(s.visited).toBe(1)
    expect(s.status).toBe('partial')
    expect(s.pct).toBeCloseTo((1 / adIds.length) * 100, 5)
  })

  it('reports full when every city is visited', () => {
    const s = countryStat(ad, new Set(adIds.map(String)))
    expect(s.visited).toBe(adIds.length)
    expect(s.status).toBe('full')
    expect(s.pct).toBe(100)
  })
})

describe('worldStat', () => {
  it('returns positive totals and zero visited when empty', () => {
    const w = worldStat(new Set())
    expect(w.total).toBeGreaterThan(0)
    expect(w.visited).toBe(0)
    expect(w.pct).toBe(0)
    expect(w.countriesVisited).toBe(0)
    expect(w.countriesTotal).toBeGreaterThan(0)
  })

  it('counts a single visited city', () => {
    const w = worldStat(new Set([String(adIds[0])]))
    expect(w.visited).toBe(1)
    expect(w.countriesVisited).toBe(1)
  })
})

describe('continentStats', () => {
  it('returns one entry per continent with cities', () => {
    const cs = continentStats(new Set())
    expect(cs.length).toBeGreaterThan(0)
    for (const c of cs) {
      expect(c.total).toBeGreaterThan(0)
      expect(c.visited).toBe(0)
    }
  })
})

describe('countryWishCount / wishlistStats', () => {
  it('counts wished cities per country and globally', () => {
    const wished = new Set([String(adIds[0])])
    expect(countryWishCount(ad, wished)).toBe(1)
    const w = wishlistStats(wished)
    expect(w.cities).toBe(1)
    expect(w.countries).toBe(1)
  })
})

describe('mostVisitedCountry', () => {
  it('returns null when nothing is visited', () => {
    expect(mostVisitedCountry(new Set())).toBeNull()
  })

  it('returns the visited country', () => {
    const best = mostVisitedCountry(new Set([String(adIds[0])]))
    expect(best).not.toBeNull()
    expect(best!.meta.cca2).toBe('AD')
    expect(best!.visited).toBe(1)
  })
})

describe('fmtPct', () => {
  it('formats common cases', () => {
    expect(fmtPct(0)).toBe('0%')
    expect(fmtPct(100)).toBe('100%')
    expect(fmtPct(50)).toBe('50%')
    expect(fmtPct(33.5)).toBe('33.5%')
    expect(fmtPct(0.005)).toBe('<0.01%')
  })
})
