import type { CountryMeta, City } from '../types'
import { worldCountries } from '../data/countries'
import { countryCities } from '../data/countryCities'

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

export function countryCityIds(cca2: string): number[] {
  return countryCities[cca2] ?? []
}

const cityDetailsCache = new Map<string, City[]>()

export async function loadCityDetails(cca2: string): Promise<City[]> {
  const cached = cityDetailsCache.get(cca2)
  if (cached) return cached
  const base = import.meta.env.BASE_URL ?? './'
  const res = await fetch(`${base}data/${cca2}.json`)
  if (!res.ok) throw new Error(`Failed to load localities for ${cca2}`)
  const list = (await res.json()) as Omit<City, 'c'>[]
  const full = list.map((d) => ({ ...d, c: cca2 }))
  cityDetailsCache.set(cca2, full)
  return full
}
