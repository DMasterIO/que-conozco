import { describe, it, expect } from 'vitest'
import { parseBackup, serializeBackup } from './backup'
import { DEFAULT_COLORS } from '../store'

describe('parseBackup', () => {
  it('round-trips a serialized backup', () => {
    const data = { visited: ['1', '2'], wishlist: ['3'], colors: { ...DEFAULT_COLORS, visited: '#ff0000' } }
    expect(parseBackup(serializeBackup(data), DEFAULT_COLORS)).toEqual(data)
  })

  it('accepts numeric ids and drops duplicates and wishes already visited', () => {
    const out = parseBackup('{"visited":[1,"1",2],"wishlist":[2,3]}', DEFAULT_COLORS)
    expect(out.visited).toEqual(['1', '2'])
    expect(out.wishlist).toEqual(['3'])
  })

  it('keeps current colors when the file has none', () => {
    expect(parseBackup('{"visited":[]}', DEFAULT_COLORS).colors).toEqual(DEFAULT_COLORS)
  })

  it.each([
    ['not json', 'nope'],
    ['not an object', '[1]'],
    ['missing visited', '{}'],
    ['bad id', '{"visited":["abc"]}'],
    ['object id', '{"visited":[{}]}'],
    ['bad color', '{"visited":[],"colors":{"visited":"red"}}'],
    ['css injection color', '{"visited":[],"colors":{"visited":"#fff;background:url(x)"}}'],
  ])('rejects %s', (_, text) => {
    expect(() => parseBackup(text, DEFAULT_COLORS)).toThrow()
  })
})
