import { useMemo, useState } from 'react'
import { geoPath, geoNaturalEarth1 } from 'd3-geo'
import { featureForCcn3 } from '../lib/geo'
import { byCca2, citiesFor } from '../lib/countries'
import type { MapColors } from '../types'

const W = 600
const H = 400

interface Dot {
  id: number
  name: string
  admin?: string
  x: number
  y: number
}

interface Props {
  cca2: string
  visited: Set<string>
  colors: MapColors
  onToggleCity: (id: number) => void
}

export default function CountryZoomMap({ cca2, visited, colors, onToggleCity }: Props) {
  const [hovered, setHovered] = useState<Dot | null>(null)

  const { countryPath, dots } = useMemo(() => {
    const meta = byCca2.get(cca2)
    if (!meta) return { countryPath: null, dots: [] as Dot[] }
    const feature = featureForCcn3(meta.ccn3)
    if (!feature) return { countryPath: null, dots: [] as Dot[] }
    const p = geoNaturalEarth1()
    p.fitExtent(
      [
        [16, 16],
        [W - 16, H - 16],
      ],
      feature,
    )
    const path = geoPath(p)
    const dots: Dot[] = []
    for (const c of citiesFor(cca2)) {
      const pt = p([c.lng, c.lat])
      if (pt) dots.push({ id: c.id, name: c.n, admin: c.a, x: pt[0], y: pt[1] })
    }
    return { countryPath: path(feature), dots }
  }, [cca2])

  if (!countryPath) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
        Mapa detallado no disponible
      </div>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-xl bg-slate-50"
      onMouseLeave={() => setHovered(null)}
    >
      <path d={countryPath} fill={colors.notVisited} stroke={colors.border} strokeWidth={1.5} />
      {dots.map((dot) => {
        const isVisited = visited.has(String(dot.id))
        return (
          <circle
            key={dot.id}
            cx={dot.x}
            cy={dot.y}
            r={isVisited ? 4.5 : 3.5}
            fill={isVisited ? colors.visited : '#ffffff'}
            stroke={isVisited ? '#ffffff' : colors.visited}
            strokeWidth={1.5}
            className="cursor-pointer transition-all hover:opacity-80"
            onClick={() => onToggleCity(dot.id)}
            onMouseEnter={() => setHovered(dot)}
          />
        )
      })}
      {hovered && (
        <g pointerEvents="none">
          <text
            x={hovered.x}
            y={hovered.y - 10}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth={4}
            paintOrder="stroke"
          >
            {hovered.name}
          </text>
          {hovered.admin && (
            <text
              x={hovered.x}
              y={hovered.y + 12}
              textAnchor="middle"
              fontSize={10}
              fill="#64748b"
              stroke="#ffffff"
              strokeWidth={3}
              paintOrder="stroke"
            >
              {hovered.admin}
            </text>
          )}
        </g>
      )}
    </svg>
  )
}
