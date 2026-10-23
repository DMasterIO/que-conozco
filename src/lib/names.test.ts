import { describe, it, expect } from 'vitest'
import { cityName, regionLabel } from './names'
import type { City } from '../types'

const base: City = { id: 1, c: 'XX', n: 'Munich', lat: 0, lng: 0, p: 1, a: 'Bavaria' }

describe('cityName', () => {
  it('falls back to the base name', () => {
    expect(cityName(base, 'es')).toBe('Munich')
    expect(cityName(base, 'en')).toBe('Munich')
  })

  it('prefers the localized name when present', () => {
    const city = { ...base, nEs: 'Múnich', nEn: 'Munich' }
    expect(cityName(city, 'es')).toBe('Múnich')
    expect(cityName(city, 'en')).toBe('Munich')
  })
})

describe('regionLabel', () => {
  it('returns undefined when the city has no region', () => {
    expect(regionLabel({ ...base, a: undefined }, 'es')).toBeUndefined()
  })

  it('prefers the localized region name', () => {
    const city = { ...base, aEs: 'Baviera' }
    expect(regionLabel(city, 'es')).toBe('Baviera')
    expect(regionLabel(city, 'en')).toBe('Bavaria')
  })
})
