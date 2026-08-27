export type Lang = 'es' | 'en'

export const STORAGE_KEY = 'que-conozco-lang'

export function detectLang(): Lang {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
  }
  return 'es'
}

const CONTINENT_NAMES: Record<string, { es: string; en: string }> = {
  'north-america': { es: 'América del Norte', en: 'North America' },
  'south-america': { es: 'América del Sur', en: 'South America' },
  europe: { es: 'Europa', en: 'Europe' },
  africa: { es: 'África', en: 'Africa' },
  asia: { es: 'Asia', en: 'Asia' },
  oceania: { es: 'Oceanía', en: 'Oceania' },
  antarctica: { es: 'Antártida', en: 'Antarctica' },
}

const es: Record<string, string> = {
  appSubtitle: 'Tu mapa de países y localidades visitados',
  share: 'Compartir',
  colors: 'Colores',
  stats: 'Estadísticas',
  resetAll: 'Reiniciar',
  theme: 'Tema',
  themeLight: 'Tema claro',
  themeDark: 'Tema oscuro',
  themeSystem: 'Tema del sistema',
  worldMap: 'Mapa del mundo',
  mapHint: 'Clic: marcar país · Doble clic: ver ciudades',
  visited: 'Visitado',
  notVisited: 'No visitado',
  hover: 'Hover',
  border: 'Borde',
  wishlist: 'Quiero ir',
  wishColor: 'Deseado',
  wishCountries: 'Países deseados',
  wishCities: 'Localidades deseadas',
  wishAllCountry: 'Quiero ir a todo el país',
  unwishAll: 'Quitar de deseos',
  worldExplored: 'Mundo explorado',
  countriesVisited: 'Países visitados',
  localities: 'Localidades',
  continents: 'Continentes',
  countries: 'Países',
  footerCountries: '{n} países y sus localidades',
  footerNote: 'tus datos se guardan en tu navegador',
  exportData: 'Exportar',
  importData: 'Importar',
  searchCountry: 'Buscar país...',
  allContinents: 'Todos los continentes',
  countriesCount: '{n} países',
  cities: 'Ciudades',
  country: 'País',
  world: 'Mundo',
  localitiesVisited: '{visited} de {total} localidades visitadas',
  markAllCountry: 'Marcar todo el país',
  unmarkAll: 'Desmarcar todo',
  searchLocality: 'Buscar localidad en {name}...',
  noResults: 'Sin resultados para «{query}»',
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
  restore: 'Restablecer',
  doubleClickHint: 'Doble clic para ver ciudades',
  detailedMapUnavailable: 'Mapa detallado no disponible',
  mapColors: 'Colores del mapa',
  colorHint: 'Personaliza solo los colores del mapa, sin afectar el resto de la página.',
  notVisitedCountries: 'No visitados',
  borders: 'Bordes',
  apply: 'Aplicar',
  mostVisitedCountry: 'País más visitado',
  shareTitle: 'Compartir en Instagram',
  shareUnsupported:
    'Tu navegador no permite compartir directo. Usa "Descargar imagen" y súbela a Instagram.',
  shareDescription: 'Imagen en formato vertical (1080×1920) lista para historias de Instagram.',
  downloadImage: 'Descargar imagen',
  storySubtitle: 'del mundo explorado',
  storyLocalities: 'Localidades visitadas',
}

const en: Record<string, string> = {
  appSubtitle: 'Your map of visited countries and places',
  share: 'Share',
  colors: 'Colors',
  stats: 'Statistics',
  resetAll: 'Reset',
  theme: 'Theme',
  themeLight: 'Light theme',
  themeDark: 'Dark theme',
  themeSystem: 'System theme',
  worldMap: 'World map',
  mapHint: 'Click: mark country · Double click: view cities',
  visited: 'Visited',
  notVisited: 'Not visited',
  hover: 'Hover',
  border: 'Border',
  wishlist: 'Wishlist',
  wishColor: 'Wished',
  wishCountries: 'Wished countries',
  wishCities: 'Wished localities',
  wishAllCountry: 'Wish entire country',
  unwishAll: 'Remove from wishlist',
  worldExplored: 'World explored',
  countriesVisited: 'Visited countries',
  localities: 'Localities',
  continents: 'Continents',
  countries: 'Countries',
  footerCountries: '{n} countries and their localities',
  footerNote: 'your data is stored in your browser',
  exportData: 'Export',
  importData: 'Import',
  searchCountry: 'Search country...',
  allContinents: 'All continents',
  countriesCount: '{n} countries',
  cities: 'Cities',
  country: 'Country',
  world: 'World',
  localitiesVisited: '{visited} of {total} localities visited',
  markAllCountry: 'Mark entire country',
  unmarkAll: 'Unmark all',
  searchLocality: 'Search locality in {name}...',
  noResults: 'No results for “{query}”',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  restore: 'Reset',
  doubleClickHint: 'Double click to view cities',
  detailedMapUnavailable: 'Detailed map not available',
  mapColors: 'Map colors',
  colorHint: 'Customize only the map colors, without affecting the rest of the page.',
  notVisitedCountries: 'Not visited',
  borders: 'Borders',
  apply: 'Apply',
  mostVisitedCountry: 'Most visited country',
  shareTitle: 'Share on Instagram',
  shareUnsupported:
    'Your browser does not support direct sharing. Use "Download image" and upload it to Instagram.',
  shareDescription: 'Vertical image (1080×1920) ready for Instagram stories.',
  downloadImage: 'Download image',
  storySubtitle: 'of the world explored',
  storyLocalities: 'Visited localities',
}

export const messages: Record<Lang, Record<string, string>> = { es, en }

export function continentLabel(key: string, lang: Lang): string {
  const entry = CONTINENT_NAMES[key]
  if (!entry) return key
  return entry[lang] ?? entry.es
}

export function countryName(name: string, nameEn: string, lang: Lang): string {
  return lang === 'en' ? nameEn : name
}
