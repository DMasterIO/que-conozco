import { feature } from 'topojson-client'
import type { Feature, FeatureCollection } from 'geojson'
import worldTopo from 'world-atlas/countries-110m.json'

type Topo = Parameters<typeof feature>[0]

const topo = worldTopo as unknown as Topo

export const world: FeatureCollection = feature(
  topo,
  (topo as unknown as { objects: { countries: unknown } }).objects.countries as never,
) as unknown as FeatureCollection

export const worldFeatures: Feature[] = world.features

export const featureByCcn3 = new Map<string, Feature>()
for (const f of worldFeatures) {
  const id = (f as { id?: string }).id
  if (id) featureByCcn3.set(String(id), f)
}

export function featureForCcn3(ccn3: string): Feature | undefined {
  return featureByCcn3.get(ccn3)
}
