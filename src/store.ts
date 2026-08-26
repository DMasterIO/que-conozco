import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MapColors } from './types'
import { citiesFor, cityKey } from './lib/countries'

export const DEFAULT_COLORS: MapColors = {
  visited: '#14b8a6',
  notVisited: '#e2e8f0',
  hover: '#0f766e',
  border: '#ffffff',
}

interface AppState {
  visited: string[]
  colors: MapColors
  selectedCountry: string | null
  toggleCity: (id: number) => void
  toggleCountry: (cca2: string) => void
  setColors: (colors: MapColors) => void
  setSelectedCountry: (cca2: string | null) => void
  clearAll: () => void
  importData: (data: { visited: string[]; colors: MapColors }) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      visited: [],
      colors: DEFAULT_COLORS,
      selectedCountry: null,

      toggleCity: (id) => {
        const key = cityKey(id)
        const visited = get().visited
        const next = visited.includes(key) ? visited.filter((k) => k !== key) : [...visited, key]
        set({ visited: next })
      },

      toggleCountry: (cca2) => {
        const cities = citiesFor(cca2)
        if (cities.length === 0) return
        const visited = new Set(get().visited)
        const keys = cities.map((c) => cityKey(c.id))
        const allVisited = keys.every((k) => visited.has(k))
        if (allVisited) {
          set({ visited: get().visited.filter((k) => !keys.includes(k)) })
        } else {
          const merged = new Set([...get().visited, ...keys])
          set({ visited: Array.from(merged) })
        }
      },

      setColors: (colors) => set({ colors }),
      setSelectedCountry: (cca2) => set({ selectedCountry: cca2 }),
      clearAll: () => set({ visited: [] }),
      importData: (data) => set({ visited: data.visited, colors: data.colors }),
    }),
    { name: 'que-conozco-v1', partialize: (s) => ({ visited: s.visited, colors: s.colors }) },
  ),
)
