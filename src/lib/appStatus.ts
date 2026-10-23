import { create } from 'zustand'
import { DATA_VERSION, loadCountryIndex, loadMigration } from './countries'
import { useStore } from '../store'

type DataStatus = 'loading' | 'ready' | 'error'

interface AppStatus {
  data: DataStatus
}

export const useAppStatus = create<AppStatus>(() => ({ data: 'loading' }))

// Loads the country index (required) and, if the saved marks predate the current dataset,
// the id migration map. The UI renders right away and reacts to `data`.
export async function bootData(): Promise<void> {
  useAppStatus.setState({ data: 'loading' })
  try {
    await loadCountryIndex()
    const { visited, wishlist, migratedWith, applyMigration } = useStore.getState()
    if ((visited.length > 0 || wishlist.length > 0) && migratedWith !== DATA_VERSION) {
      applyMigration(await loadMigration(), DATA_VERSION)
    } else if (migratedWith !== DATA_VERSION) {
      useStore.setState({ migratedWith: DATA_VERSION })
    }
    useAppStatus.setState({ data: 'ready' })
  } catch {
    useAppStatus.setState({ data: 'error' })
  }
}
