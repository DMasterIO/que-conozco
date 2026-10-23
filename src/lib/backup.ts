import type { MapColors } from '../types'

export interface Backup {
  visited: string[]
  wishlist: string[]
  colors: MapColors
}

const MAX_MARKS = 200_000
const HEX = /^#[0-9a-f]{6}$/i
const COLOR_KEYS: (keyof MapColors)[] = ['visited', 'wish', 'notVisited', 'hover', 'border']

function cityIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_MARKS) throw new Error('invalid marks')
  const out = new Set<string>()
  for (const v of value) {
    const id = typeof v === 'number' ? String(v) : v
    if (typeof id !== 'string' || !/^\d{1,10}$/.test(id)) throw new Error('invalid city id')
    out.add(id)
  }
  return Array.from(out)
}

// Parses and validates a backup file. Throws on anything unexpected so a bad file can never
// replace the user's data. Missing colors fall back to the current ones.
export function parseBackup(text: string, currentColors: MapColors): Backup {
  const data: unknown = JSON.parse(text)
  if (typeof data !== 'object' || data === null) throw new Error('not an object')
  const raw = data as Record<string, unknown>

  const visited = cityIds(raw.visited)
  const visitedSet = new Set(visited)
  const wishlist = raw.wishlist === undefined ? [] : cityIds(raw.wishlist).filter((id) => !visitedSet.has(id))

  const colors = { ...currentColors }
  if (raw.colors !== undefined) {
    if (typeof raw.colors !== 'object' || raw.colors === null) throw new Error('invalid colors')
    const given = raw.colors as Record<string, unknown>
    for (const key of COLOR_KEYS) {
      const v = given[key]
      if (v === undefined) continue
      if (typeof v !== 'string' || !HEX.test(v)) throw new Error('invalid color')
      colors[key] = v
    }
  }
  return { visited, wishlist, colors }
}

export function serializeBackup(data: Backup): string {
  return JSON.stringify({ app: 'que-conozco', version: 1, ...data }, null, 2)
}
