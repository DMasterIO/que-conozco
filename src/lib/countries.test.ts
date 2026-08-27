import { describe, it, expect } from 'vitest'
import { byCca2, COUNTRIES, countryCityIds, cityKey } from './countries'

describe('cityKey', () => {
  it('stringifies ids', () => {
    expect(cityKey(123)).toBe('123')
    expect(cityKey(0)).toBe('0')
  })
})

describe('countryCityIds', () => {
  it('returns ids for a known country', () => {
    const ids = countryCityIds('AD')
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) expect(typeof id).toBe('number')
  })

  it('returns an empty array for an unknown country', () => {
    expect(countryCityIds('XX')).toEqual([])
  })
})

describe('COUNTRIES', () => {
  it('has a reasonable number of countries', () => {
    expect(COUNTRIES.length).toBeGreaterThan(100)
  })

  it('maps every country code', () => {
    for (const c of COUNTRIES) {
      expect(byCca2.get(c.cca2)).toBe(c)
    }
  })
})
