// Generates the 3-level locality dataset (country -> admin1/region -> city) from GeoNames.
//
// Standard: the leaf is a *city*, never a sub-city unit. The reduction is driven by
// agglomeration: a smaller place is folded into a nearby dominant city so metro sprawl does
// not show up as dozens of leaves (Gran Santiago -> Santiago, Paris arrondissements -> Paris).
// The merge radius scales with the dominant city's population, and the dominant city must be
// clearly bigger (DOMINANCE x) so distinct peer cities are not merged. Only abandoned /
// destroyed / historical places are dropped outright (they are not visitable).
//
// Names are localized: the base name is GeoNames' own `name` (usually with diacritics) and,
// when an alternate exists, `nEs`/`nEn` (city) and `aEs`/`aEn` (region) are added for Spanish
// and English.
//
// Outputs:
//   public/data/country-index.json   cca2 -> [city ids]                    (loaded once at startup)
//   public/data/<cca2>.json          { id, n, lat, lng, p, a, aEs..., nEs... } (lazy per country)
//   public/data/migration.json       oldId -> retainedId                   (remaps persisted visits)
//
// Run with: node scripts/gen-localities.mjs
// Network is required on the first run (caches GeoNames under GEONAMES_DIR, default /tmp/opencode/geonames).
import { execFileSync } from 'node:child_process'
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/data')
const cacheDir = process.env.GEONAMES_DIR || resolve(tmpdir(), 'opencode/geonames')

const CITIES_URL = 'https://download.geonames.org/export/dump/cities15000.zip'
const ADMIN1_URL = 'https://download.geonames.org/export/dump/admin1CodesASCII.txt'
const ALT_NAMES_URL = 'https://download.geonames.org/export/dump/alternateNamesV2.zip'

// Abandoned / destroyed / historical places are not visitable, so they never become cities.
// Everything else in feature class P is a candidate: sub-city units (PPLX) are deliberately
// left in and resolved by the agglomeration step below, so real places that GeoNames happens
// to label as a "section" are not lost.
const NON_VISITABLE_FEATURE_CODES = new Set(['PPLQ', 'PPLW', 'PPLH', 'PPLCH'])

// Capitals/seats are kept even when GeoNames reports no population (micro-states).
const SEAT_FEATURE_CODES = new Set(['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLA5', 'PPLG'])

// A dominant city must have at least this many times the population of the place it absorbs.
const DOMINANCE = 3
// Max distance to reattach a dropped non-visitable entry to its nearest surviving city.
const MAX_REATTACH_KM = 50

const LOCALIZED_LANGS = ['es', 'en']

async function download(url, dest) {
  process.stdout.write(`downloading ${url}\n`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

async function ensureInputs() {
  mkdirSync(cacheDir, { recursive: true })
  const citiesFile = resolve(cacheDir, 'cities15000.txt')
  const zipFile = resolve(cacheDir, 'cities15000.zip')
  const adminFile = resolve(cacheDir, 'admin1CodesASCII.txt')

  if (!existsSync(citiesFile)) {
    if (!existsSync(zipFile)) await download(CITIES_URL, zipFile)
    execFileSync('unzip', ['-o', zipFile, '-d', cacheDir], { stdio: 'ignore' })
  }
  if (!existsSync(adminFile)) await download(ADMIN1_URL, adminFile)
  return { citiesFile, adminFile }
}

async function ensureAlternateNames() {
  const txt = resolve(cacheDir, 'alternateNamesV2.txt')
  if (existsSync(txt)) return txt
  const zip = resolve(cacheDir, 'alternateNamesV2.zip')
  if (!existsSync(zip)) await download(ALT_NAMES_URL, zip)
  execFileSync('unzip', ['-o', zip, '-d', cacheDir], { stdio: 'ignore' })
  return existsSync(txt) ? txt : null
}

// Agglomeration radius scales with the dominant city's population: bigger metro -> wider sprawl.
export function radiusFor(pop) {
  if (pop >= 5_000_000) return 45
  if (pop >= 2_000_000) return 35
  if (pop >= 1_000_000) return 28
  if (pop >= 500_000) return 22
  if (pop >= 200_000) return 15
  if (pop >= 100_000) return 10
  return 7
}

function haversine(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function parseInputs(citiesFile, adminFile) {
  // admin1 code ("CL.12") -> { name, ascii, id }
  const admin1 = new Map()
  for (const line of readFileSync(adminFile, 'utf8').split('\n')) {
    if (!line) continue
    const [code, name, ascii, id] = line.split('\t')
    admin1.set(code, { name, ascii, id: id ? +id : null })
  }

  const all = []
  for (const line of readFileSync(citiesFile, 'utf8').split('\n')) {
    if (!line) continue
    const f = line.split('\t')
    const pop = +f[14] || 0
    if (!pop && !SEAT_FEATURE_CODES.has(f[7])) continue
    all.push({
      id: +f[0],
      name: f[1], // local/preferred name (usually with diacritics)
      ascii: f[2],
      lat: +f[4],
      lng: +f[5],
      fcode: f[7],
      cc: f[8],
      a1: f[10],
      pop,
    })
  }
  return { admin1, all }
}

function isCandidate(c) {
  return c.fcode.startsWith('P') && !NON_VISITABLE_FEATURE_CODES.has(c.fcode)
}

function regionOf(admin1, c) {
  if (!c.a1) return undefined
  return admin1.get(`${c.cc}.${c.a1}`)
}

export function build({ admin1, all }) {
  const byCountry = new Map()
  for (const c of all) {
    if (!isCandidate(c)) continue
    const arr = byCountry.get(c.cc) ?? []
    arr.push(c)
    byCountry.set(c.cc, arr)
  }

  const cities = []
  const migration = {} // oldId -> retainedId

  for (const list of byCountry.values()) {
    list.sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name, 'es'))
    const parent = new Map()
    const find = (x) => {
      while (parent.get(x) !== x) {
        parent.set(x, parent.get(parent.get(x)))
        x = parent.get(x)
      }
      return x
    }
    const roots = new Map()
    for (const c of list) {
      parent.set(c.id, c.id)
      let best = null
      let bestD = Infinity
      for (const r of roots.values()) {
        if (r.pop < c.pop * DOMINANCE) continue
        const d = haversine(c, r)
        if (d <= radiusFor(r.pop) && d < bestD) {
          bestD = d
          best = r
        }
      }
      if (best) {
        parent.set(c.id, best.id)
        migration[c.id] = best.id
      } else {
        roots.set(c.id, c)
      }
    }
    for (const r of roots.values()) {
      const root = list.find((x) => x.id === find(r.id))
      cities.push(root)
    }
  }

  // Reattach non-visitable entries (abandoned/historical) to their nearest surviving city.
  const retainedByCountry = new Map()
  for (const c of cities) {
    const arr = retainedByCountry.get(c.cc) ?? []
    arr.push(c)
    retainedByCountry.set(c.cc, arr)
  }
  for (const c of all) {
    if (isCandidate(c)) continue
    const list = retainedByCountry.get(c.cc)
    if (!list || !list.length) continue
    let best = null
    let bestD = Infinity
    for (const r of list) {
      const d = haversine(c, r)
      if (d < bestD) {
        bestD = d
        best = r
      }
    }
    if (best && bestD <= MAX_REATTACH_KM) migration[c.id] = best.id
  }

  return { admin1, cities, migration }
}

function shortestName(list) {
  return list.reduce((a, b) => (b.name.length < a.name.length ? b : a))
}

function sameName(a, b) {
  return a.toLowerCase() === b.toLowerCase()
}

// Picks a localized name, or the base name when the alternate is just a variant of it.
function pickLocalized(cands, base, ascii) {
  if (!cands || !cands.length) return null
  const valid = cands.filter((a) => a.name && !a.hist && !a.coll)
  if (!valid.length) return null
  const baseLower = base.toLowerCase()
  const asciiLower = (ascii ?? '').toLowerCase()
  const preferred = valid.filter((a) => a.pref)
  let chosen
  if (preferred.length) {
    chosen = shortestName(preferred).name
  } else if (valid.some((a) => sameName(a.name, base) || sameName(a.name, ascii))) {
    chosen = base
  } else if (
    valid.some(
      (a) => a.name.toLowerCase().startsWith(`${baseLower} `) || a.name.toLowerCase().startsWith(`${asciiLower} `),
    )
  ) {
    chosen = base
  } else {
    const short = valid.filter((a) => a.short)
    chosen = (short.length ? shortestName(short) : shortestName(valid)).name
  }
  return sameName(chosen, base) ? base : chosen
}

// Streams alternateNamesV2 once and keeps es/en alternates for the wanted geoname ids.
async function collectAlternateNames(txtFile, wanted) {
  const alts = new Map() // id -> { es: [], en: [] }
  const rl = createInterface({ input: createReadStream(txtFile), crlfDelay: Infinity })
  for await (const line of rl) {
    if (!line) continue
    const f = line.split('\t')
    const id = +f[1]
    if (!wanted.has(id)) continue
    const lang = f[2]
    if (!LOCALIZED_LANGS.includes(lang)) continue
    let entry = alts.get(id)
    if (!entry) {
      entry = { es: [], en: [] }
      alts.set(id, entry)
    }
    entry[lang].push({ name: f[3], pref: f[4] === '1', short: f[5] === '1', coll: f[6] === '1', hist: f[7] === '1' })
  }
  return alts
}

function addRegionNames(detail, region, entry) {
  if (!entry) return
  const es = pickLocalized(entry.es, region.name, region.ascii)
  const en = pickLocalized(entry.en, region.name, region.ascii)
  if (es && es !== region.name) detail.aEs = es
  if (en && en !== region.name) detail.aEn = en
}

function addCityNames(detail, city, entry) {
  if (!entry) return
  const es = pickLocalized(entry.es, city.name, city.ascii)
  const en = pickLocalized(entry.en, city.name, city.ascii)
  if (es && es !== city.name) detail.nEs = es
  if (en && en !== city.name) detail.nEn = en
}

function writeOutputs({ admin1, cities, migration, alts }) {
  mkdirSync(outDir, { recursive: true })

  const byCountry = new Map()
  for (const c of cities) {
    const region = regionOf(admin1, c)
    const detail = { id: c.id, n: c.name, lat: c.lat, lng: c.lng, p: c.pop }
    if (region) {
      detail.a = region.name
      if (region.id) addRegionNames(detail, region, alts.get(region.id))
    }
    addCityNames(detail, c, alts.get(c.id))
    const arr = byCountry.get(c.cc) ?? []
    arr.push(detail)
    byCountry.set(c.cc, arr)
  }

  for (const list of byCountry.values()) {
    list.sort((a, b) => {
      const ra = a.a ?? ''
      const rb = b.a ?? ''
      if (ra !== rb) {
        if (ra === '') return 1
        if (rb === '') return -1
        const byRegion = ra.localeCompare(rb, 'es')
        if (byRegion !== 0) return byRegion
      }
      return b.p - a.p || a.n.localeCompare(b.n, 'es')
    })
  }

  // Index order mirrors each file so ids and details line up one-to-one.
  const index = {}
  for (const [cca2, list] of byCountry) index[cca2] = list.map((d) => d.id)

  writeFileSync(resolve(outDir, 'country-index.json'), JSON.stringify(index))
  for (const [cca2, list] of byCountry) {
    writeFileSync(resolve(outDir, `${cca2}.json`), JSON.stringify(list))
  }

  // Exclude self-mappings: only ids that actually changed are worth persisting.
  const compact = {}
  for (const [oldId, newId] of Object.entries(migration)) {
    if (Number(oldId) !== newId) compact[oldId] = newId
  }
  writeFileSync(resolve(outDir, 'migration.json'), JSON.stringify(compact))

  return { countries: Object.keys(index).length, cities: cities.length, migrations: Object.keys(compact).length }
}

async function main() {
  const { citiesFile, adminFile } = await ensureInputs()
  const inputs = parseInputs(citiesFile, adminFile)
  const result = build(inputs)

  let alts = new Map()
  const altFile = await ensureAlternateNames()
  if (!altFile) {
    console.warn('alternateNamesV2 unavailable: generating without localized names')
  } else {
    const wanted = new Set()
    for (const c of result.cities) {
      wanted.add(c.id)
      const region = regionOf(result.admin1, c)
      if (region?.id) wanted.add(region.id)
    }
    process.stdout.write(`streaming alternate names for ${wanted.size} ids...\n`)
    alts = await collectAlternateNames(altFile, wanted)
  }

  const stats = writeOutputs({ ...result, alts })
  console.log(
    `countries: ${stats.countries}\ncities: ${stats.cities}\nmigrations: ${stats.migrations}\nwritten to public/data/`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
