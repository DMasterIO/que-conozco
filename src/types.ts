export interface City {
  id: number
  c: string
  n: string
  lat: number
  lng: number
  p: number
  a?: string
}

export interface CountryMeta {
  cca2: string
  cca3: string
  ccn3: string
  name: string
  nameEn: string
  continent: string
  continentKey: string
  flag: string
}

export interface MapColors {
  visited: string
  notVisited: string
  hover: string
  border: string
}

export type Theme = 'light' | 'dark' | 'system'

export type CountryStatus = 'none' | 'partial' | 'full'

export interface ContinentAgg {
  key: string
  name: string
  total: number
  visited: number
}
