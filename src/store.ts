import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MapColors, Theme } from './types'
import { countryCityIds, cityKey, type MigrationMap } from './lib/countries'

export const DEFAULT_COLORS: MapColors = {
  visited: '#14b8a6',
  wish: '#f59e0b',
  notVisited: '#e2e8f0',
  hover: '#0f766e',
  border: '#ffffff',
}

interface AppState {
  visited: string[]
  wishlist: string[]
  colors: MapColors
  theme: Theme
  selectedCountry: string | null
  canUndo: boolean
  toggleCity: (id: number) => void
  cycleCity: (id: number) => void
  toggleCountry: (cca2: string) => void
  toggleWishCountry: (cca2: string) => void
  setColors: (colors: MapColors) => void
  setTheme: (theme: Theme) => void
  setSelectedCountry: (cca2: string | null) => void
  clearAll: () => void
  importData: (data: { visited: string[]; wishlist?: string[]; colors: MapColors }) => void
  applyMigration: (migration: MigrationMap) => void
  undo: () => void
}

let snapshot: { visited: string[]; wishlist: string[] } | null = null

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const remember = () => {
        snapshot = { visited: get().visited, wishlist: get().wishlist }
      }

      return {
        visited: [],
        wishlist: [],
        colors: DEFAULT_COLORS,
        theme: 'system',
        selectedCountry: null,
        canUndo: false,

        toggleCity: (id) => {
          remember()
          const key = cityKey(id)
          const visited = get().visited
          const next = visited.includes(key) ? visited.filter((k) => k !== key) : [...visited, key]
          set({
            visited: next,
            wishlist: get().wishlist.filter((k) => k !== key),
            canUndo: true,
          })
        },

        cycleCity: (id) => {
          remember()
          const key = cityKey(id)
          const s = get()
          if (s.visited.includes(key)) {
            set({ visited: s.visited.filter((k) => k !== key), wishlist: [...s.wishlist, key], canUndo: true })
          } else if (s.wishlist.includes(key)) {
            set({ wishlist: s.wishlist.filter((k) => k !== key), canUndo: true })
          } else {
            set({ visited: [...s.visited, key], canUndo: true })
          }
        },

        toggleCountry: (cca2) => {
          const ids = countryCityIds(cca2)
          if (ids.length === 0) return
          remember()
          const visited = new Set(get().visited)
          const keys = ids.map((id) => cityKey(id))
          const allVisited = keys.every((k) => visited.has(k))
          if (allVisited) {
            set({ visited: get().visited.filter((k) => !keys.includes(k)), canUndo: true })
          } else {
            const merged = new Set([...get().visited, ...keys])
            set({
              visited: Array.from(merged),
              wishlist: get().wishlist.filter((k) => !keys.includes(k)),
              canUndo: true,
            })
          }
        },

        toggleWishCountry: (cca2) => {
          const ids = countryCityIds(cca2)
          if (ids.length === 0) return
          remember()
          const wishlist = new Set(get().wishlist)
          const keys = ids.map((id) => cityKey(id))
          const allWished = keys.every((k) => wishlist.has(k))
          if (allWished) {
            set({ wishlist: get().wishlist.filter((k) => !keys.includes(k)), canUndo: true })
          } else {
            const merged = new Set([...get().wishlist, ...keys])
            set({
              wishlist: Array.from(merged),
              visited: get().visited.filter((k) => !keys.includes(k)),
              canUndo: true,
            })
          }
        },

        setColors: (colors) => set({ colors }),
        setTheme: (theme) => set({ theme }),
        setSelectedCountry: (cca2) => set({ selectedCountry: cca2 }),
        clearAll: () => {
          remember()
          set({ visited: [], wishlist: [], canUndo: true })
        },
        importData: (data) => {
          snapshot = null
          set({
            visited: data.visited,
            wishlist: data.wishlist ?? [],
            colors: data.colors,
            canUndo: false,
          })
        },
        applyMigration: (migration) => {
          const remap = (ids: string[]): string[] => {
            const out = new Set<string>()
            for (const key of ids) {
              let id = key
              let next = migration[id]
              let hops = 0
              while (next !== undefined && String(next) !== id && hops++ < 8) {
                id = String(next)
                next = migration[id]
              }
              out.add(id)
            }
            return Array.from(out)
          }
          const s = get()
          const visited = remap(s.visited)
          const visitedSet = new Set(visited)
          set({ visited, wishlist: remap(s.wishlist).filter((k) => !visitedSet.has(k)) })
        },
        undo: () => {
          if (!snapshot) return
          const s = snapshot
          snapshot = null
          set({ visited: s.visited, wishlist: s.wishlist, canUndo: false })
        },
      }
    },
    {
      name: 'que-conozco-v1',
      partialize: (s) => ({ visited: s.visited, wishlist: s.wishlist, colors: s.colors, theme: s.theme }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>
        return {
          ...current,
          ...p,
          colors: { ...DEFAULT_COLORS, ...(p.colors ?? {}) },
        }
      },
    },
  ),
)
