import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const read = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../public/data/${name}`, import.meta.url), 'utf8'))

const index = read('country-index.json') as Record<string, number[]>
const migration = read('migration.json') as Record<string, number>
const allIds = new Set<number>(Object.values(index).flat())

describe('generated data', () => {
  it('has countries with cities', () => {
    expect(Object.keys(index).length).toBeGreaterThan(200)
    expect(allIds.size).toBeGreaterThan(10000)
  })

  it('every migration target is a current city id', () => {
    const bad = Object.values(migration).filter((id) => !allIds.has(id))
    expect(bad).toEqual([])
  })

  it('migration has no self-mappings', () => {
    const self = Object.entries(migration).filter(([oldId, newId]) => Number(oldId) === newId)
    expect(self).toEqual([])
  })

  it('localized names, when present, differ from the base name', () => {
    for (const cca2 of ['CL', 'FR', 'DE', 'US']) {
      const list = read(`${cca2}.json`) as Array<{ n: string; a?: string; nEs?: string; nEn?: string; aEs?: string; aEn?: string }>
      for (const c of list) {
        if (c.nEs) expect(c.nEs).not.toBe(c.n)
        if (c.nEn) expect(c.nEn).not.toBe(c.n)
        if (c.aEs) expect(c.aEs).not.toBe(c.a)
        if (c.aEn) expect(c.aEn).not.toBe(c.a)
      }
    }
  })
})
