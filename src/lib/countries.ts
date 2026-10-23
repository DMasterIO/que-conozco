import type { CountryMeta, City } from '../types'
import { worldCountries } from '../data/countries'

export const CONTINENTS: Record<string, string> = {
  'north-america': 'América del Norte',
  'south-america': 'América del Sur',
  europe: 'Europa',
  africa: 'África',
  asia: 'Asia',
  oceania: 'Oceanía',
  antarctica: 'Antártida',
}

export const CONTINENT_ORDER = [
  'north-america',
  'south-america',
  'europe',
  'africa',
  'asia',
  'oceania',
  'antarctica',
]

function continentKeyFor(region: string, subregion: string): string {
  if (region === 'Americas') {
    return subregion === 'South America' ? 'south-america' : 'north-america'
  }
  if (region === 'Antarctic') return 'antarctica'
  switch (region) {
    case 'Africa':
      return 'africa'
    case 'Asia':
      return 'asia'
    case 'Europe':
      return 'europe'
    case 'Oceania':
      return 'oceania'
    default:
      return 'africa'
  }
}

interface RawCountry {
  cca2: string
  cca3: string
  ccn3: string
  en: string
  es?: string
  region: string
  subregion?: string
  flag: string
}

const raw = worldCountries as RawCountry[]

function buildMeta(): CountryMeta[] {
  return raw
    .filter((c) => c.ccn3 && c.cca2)
    .map((c) => {
      const spanish = c.es
      const continentKey = continentKeyFor(c.region, c.subregion ?? '')
      return {
        cca2: c.cca2,
        cca3: c.cca3,
        ccn3: c.ccn3,
        name: spanish || c.en,
        nameEn: c.en,
        continent: CONTINENTS[continentKey],
        continentKey,
        flag: c.flag,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export const COUNTRIES: CountryMeta[] = buildMeta()

export const byCcn3 = new Map<string, CountryMeta>()
export const byCca2 = new Map<string, CountryMeta>()
for (const c of COUNTRIES) {
  byCcn3.set(c.ccn3, c)
  byCca2.set(c.cca2, c)
}

export function cityKey(id: number): string {
  return String(id)
}

let index: Record<string, number[]> = {}
let indexPromise: Promise<void> | null = null

export const DATA_VERSION = __DATA_VERSION__

const FETCH_TIMEOUT_MS = 15000

function baseUrl(): string {
  return import.meta.env.BASE_URL ?? './'
}

// Dataset files are fetched with the content hash in the URL (see vite.config.ts) and a timeout,
// so a stalled connection surfaces as an error instead of an endless spinner.
function fetchData(file: string): Promise<Response> {
  return fetch(`${baseUrl()}data/${file}?v=${DATA_VERSION}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
}

export function isCountryIndexLoaded(): boolean {
  return Object.keys(index).length > 0
}

export function countryCityIds(cca2: string): number[] {
  return index[cca2] ?? []
}

export function setCountryIndex(data: Record<string, number[]>): void {
  index = data
  indexPromise = null
}

export function loadCountryIndex(): Promise<void> {
  if (isCountryIndexLoaded()) return Promise.resolve()
  if (indexPromise) return indexPromise
  indexPromise = fetchData('country-index.json')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load country index: ${res.status}`)
      return res.json()
    })
    .then((data: Record<string, number[]>) => {
      index = data
    })
    .catch((err) => {
      indexPromise = null
      throw err
    })
  return indexPromise
}

export type MigrationMap = Record<string, number>

let migration: MigrationMap | null = null
let migrationPromise: Promise<MigrationMap> | null = null

// Remaps ids from the old, over-granular dataset to the current city ids.
export function loadMigration(): Promise<MigrationMap> {
  if (migration) return Promise.resolve(migration)
  if (migrationPromise) return migrationPromise
  migrationPromise = fetchData('migration.json')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load migration map: ${res.status}`)
      return res.json()
    })
    .then((data: MigrationMap) => {
      migration = data
      return data
    })
    .catch((err) => {
      migrationPromise = null
      throw err
    })
  return migrationPromise
}

export function setMigration(data: MigrationMap): void {
  migration = data
  migrationPromise = null
}

const cityDetailsCache = new Map<string, City[]>()

export async function loadCityDetails(cca2: string): Promise<City[]> {
  const cached = cityDetailsCache.get(cca2)
  if (cached) return cached
  const res = await fetchData(`${cca2}.json`)
  if (!res.ok) throw new Error(`Failed to load localities for ${cca2}`)
  const list = (await res.json()) as Omit<City, 'c'>[]
  const full = list.map((d) => ({ ...d, c: cca2 }))
  cityDetailsCache.set(cca2, full)
  return full
}
