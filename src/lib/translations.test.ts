import { describe, it, expect, vi, afterEach } from 'vitest'
import { continentLabel, countryName, detectLang, messages } from './translations'

describe('countryName', () => {
  it('picks Spanish in es and English in en', () => {
    expect(countryName('España', 'Spain', 'es')).toBe('España')
    expect(countryName('España', 'Spain', 'en')).toBe('Spain')
  })
})

describe('continentLabel', () => {
  it('localizes continents', () => {
    expect(continentLabel('europe', 'es')).toBe('Europa')
    expect(continentLabel('europe', 'en')).toBe('Europe')
  })

  it('falls back to the key for unknown continents', () => {
    expect(continentLabel('nope', 'es')).toBe('nope')
  })
})

describe('messages', () => {
  it('keeps the same keys across languages', () => {
    const esKeys = Object.keys(messages.es).sort()
    const enKeys = Object.keys(messages.en).sort()
    expect(enKeys).toEqual(esKeys)
  })
})

describe('detectLang', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects English from the browser language', () => {
    vi.stubGlobal('navigator', { language: 'en-US' })
    expect(detectLang()).toBe('en')
  })

  it('defaults to Spanish for non-English languages', () => {
    vi.stubGlobal('navigator', { language: 'es-ES' })
    expect(detectLang()).toBe('es')
  })
})
