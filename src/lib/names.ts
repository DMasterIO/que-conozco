import type { City } from '../types'
import type { Lang } from './translations'

// Localized city name, falling back to the base GeoNames name.
export function cityName(city: City, lang: Lang): string {
  return (lang === 'es' ? city.nEs : city.nEn) ?? city.n
}

// Localized region (admin1) name, or undefined when the city has no region.
export function regionLabel(city: City, lang: Lang): string | undefined {
  if (!city.a) return undefined
  return (lang === 'es' ? city.aEs : city.aEn) ?? city.a
}
