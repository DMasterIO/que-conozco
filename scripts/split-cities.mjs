// Splits the large GeoNames cities dataset into:
//   - src/data/countryCities.ts   (cca2 -> city ids, for synchronous counts/toggles)
//   - public/data/<cca2>.json     (full city details, lazy-loaded per country)
// Run with: node scripts/split-cities.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(resolve(root, 'src/data/cities.ts'), 'utf8')

const m = src.match(/export const cities: City\[\] = (\[[\s\S]*\]);?\s*$/)
if (!m) {
  console.error('Could not locate the cities array in src/data/cities.ts')
  process.exit(1)
}
const cities = JSON.parse(m[1])

function compareCity(a, b) {
  const ra = a.a ?? ''
  const rb = b.a ?? ''
  if (ra !== rb) {
    if (ra === '') return 1
    if (rb === '') return -1
    const byRegion = ra.localeCompare(rb, 'es')
    if (byRegion !== 0) return byRegion
  }
  return a.n.localeCompare(b.n, 'es')
}

const countryCities = {}
const byCountry = {}
for (const c of cities) {
  ;(countryCities[c.c] ??= []).push(c.id)
  const detail = { id: c.id, n: c.n, lat: c.lat, lng: c.lng, p: c.p }
  if (c.a) detail.a = c.a
  ;(byCountry[c.c] ??= []).push(detail)
}

for (const list of Object.values(byCountry)) {
  list.sort(compareCity)
}

writeFileSync(
  resolve(root, 'src/data/countryCities.ts'),
  '// Auto-generated from GeoNames cities15000. Do not edit manually.\n' +
    'export const countryCities: Record<string, number[]> = ' +
    JSON.stringify(countryCities) +
    '\n',
)

const outDir = resolve(root, 'public/data')
mkdirSync(outDir, { recursive: true })
for (const [cca2, list] of Object.entries(byCountry)) {
  writeFileSync(resolve(outDir, `${cca2}.json`), JSON.stringify(list))
}

console.log(`countries: ${Object.keys(countryCities).length}`)
console.log(`cities: ${cities.length}`)
console.log(`chunks written to public/data/ (${Object.keys(byCountry).length} files)`)
