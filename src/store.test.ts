import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './store'
import { countryCityIds } from './lib/countries'

const adIds = countryCityIds('AD')

beforeEach(() => {
  useStore.setState({ visited: [], wishlist: [] })
})

describe('toggleCity', () => {
  it('marks and unmarks a city', () => {
    const id = adIds[0]
    useStore.getState().toggleCity(id)
    expect(useStore.getState().visited).toContain(String(id))
    useStore.getState().toggleCity(id)
    expect(useStore.getState().visited).not.toContain(String(id))
  })

  it('removes the city from the wishlist when marking visited', () => {
    const id = adIds[0]
    useStore.setState({ wishlist: [String(id)] })
    useStore.getState().toggleCity(id)
    expect(useStore.getState().visited).toContain(String(id))
    expect(useStore.getState().wishlist).not.toContain(String(id))
  })
})

describe('cycleCity', () => {
  it('cycles none -> visited -> wish -> none', () => {
    const id = adIds[0]
    const key = String(id)

    useStore.getState().cycleCity(id)
    expect(useStore.getState().visited).toContain(key)

    useStore.getState().cycleCity(id)
    expect(useStore.getState().visited).not.toContain(key)
    expect(useStore.getState().wishlist).toContain(key)

    useStore.getState().cycleCity(id)
    expect(useStore.getState().visited).not.toContain(key)
    expect(useStore.getState().wishlist).not.toContain(key)
  })
})

describe('toggleCountry', () => {
  it('marks and unmarks the whole country', () => {
    const s = useStore.getState()
    s.toggleCountry('AD')
    for (const id of adIds) expect(useStore.getState().visited).toContain(String(id))

    useStore.getState().toggleCountry('AD')
    expect(useStore.getState().visited).toHaveLength(0)
  })

  it('clears wishlist entries for the country', () => {
    useStore.setState({ wishlist: adIds.map(String) })
    useStore.getState().toggleCountry('AD')
    expect(useStore.getState().wishlist).toHaveLength(0)
  })
})

describe('toggleWishCountry', () => {
  it('marks and unmarks the whole country as wished', () => {
    useStore.getState().toggleWishCountry('AD')
    for (const id of adIds) expect(useStore.getState().wishlist).toContain(String(id))
    expect(useStore.getState().visited).toHaveLength(0)

    useStore.getState().toggleWishCountry('AD')
    expect(useStore.getState().wishlist).toHaveLength(0)
  })

  it('clears visited entries for the country', () => {
    useStore.setState({ visited: adIds.map(String) })
    useStore.getState().toggleWishCountry('AD')
    expect(useStore.getState().visited).toHaveLength(0)
  })
})

describe('clearAll', () => {
  it('resets visited and wishlist', () => {
    useStore.setState({ visited: adIds.map(String), wishlist: [String(adIds[0])] })
    useStore.getState().clearAll()
    expect(useStore.getState().visited).toHaveLength(0)
    expect(useStore.getState().wishlist).toHaveLength(0)
  })
})
