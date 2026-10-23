import { feature } from 'topojson-client'
import type { Feature, FeatureCollection } from 'geojson'
import worldTopo from 'world-atlas/countries-110m.json'

type Topo = Parameters<typeof feature>[0]

const KOSOVO_CCN3 = '926'

const topo = worldTopo as unknown as Topo

export const world: FeatureCollection = feature(
  topo,
  (topo as unknown as { objects: { countries: unknown } }).objects.countries as never,
) as unknown as FeatureCollection

export const worldFeatures: Feature[] = world.features

// Natural Earth ships Kosovo without a numeric id; give it the one the country list uses.
for (const f of worldFeatures) {
  if ((f as { id?: string }).id === undefined && f.properties?.name === 'Kosovo') {
    ;(f as { id?: string }).id = KOSOVO_CCN3
  }
}

export const featureByCcn3 = new Map<string, Feature>()
for (const f of worldFeatures) {
  const id = (f as { id?: string }).id
  if (id) featureByCcn3.set(String(id), f)
}

export function featureForCcn3(ccn3: string): Feature | undefined {
  return featureByCcn3.get(ccn3)
}
