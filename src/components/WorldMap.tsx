import { useEffect, useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { worldFeatures } from '../lib/geo'
import { byCca2, byCcn3 } from '../lib/countries'
import { countryStat, fmtPct } from '../lib/stats'
import type { MapColors } from '../types'

const W = 1000
const H = 520

const clampZoom = (k: number) => Math.min(12, Math.max(1, k))

interface Props {
  visited: Set<string>
  colors: MapColors
  onToggle: (cca2: string) => void
  onOpenCountry: (cca2: string) => void
}

interface Zoom {
  k: number
  x: number
  y: number
}

interface TooltipState {
  cca2: string
  x: number
  y: number
}

export default function WorldMap({ visited, colors, onToggle, onOpenCountry }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{
    sx: number
    sy: number
    ox: number
    oy: number
    moved: boolean
    cca2: string | null
  } | null>(null)
  const lastClick = useRef<{ time: number; cca2: string } | null>(null)
  const [zoom, setZoom] = useState<Zoom>({ k: 1, x: 0, y: 0 })
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const vx = ((e.clientX - rect.left) / rect.width) * W
      const vy = ((e.clientY - rect.top) / rect.height) * H
      const factor = e.deltaY < 0 ? 1.25 : 0.8
      const k = clampZoom(zoom.k * factor)
      const px = (vx - zoom.x) / zoom.k
      const py = (vy - zoom.y) / zoom.k
      setZoom({ k, x: vx - px * k, y: vy - py * k })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [zoom])

  const path = useMemo(() => {
    const p = geoNaturalEarth1()
    p.fitSize([W, H], { type: 'Sphere' })
    return geoPath(p)
  }, [])

  const paths = useMemo(() => {
    const out: { d: string; cca2: string }[] = []
    for (const f of worldFeatures) {
      const id = (f as { id?: string }).id
      if (!id) continue
      const meta = byCcn3.get(String(id))
      const d = path(f)
      if (!d || !meta) continue
      out.push({ d, cca2: meta.cca2 })
    }
    return out
  }, [path])

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return
    const target = e.target as Element
    const cca2 = target.getAttribute?.('data-cca2') ?? null
    svgRef.current?.setPointerCapture(e.pointerId)
    drag.current = { sx: e.clientX, sy: e.clientY, ox: zoom.x, oy: zoom.y, moved: false, cca2 }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (drag.current) {
      const dx = e.clientX - drag.current.sx
      const dy = e.clientY - drag.current.sy
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true
      if (drag.current.moved) {
        const rect = svgRef.current!.getBoundingClientRect()
        setZoom({
          k: zoom.k,
          x: drag.current.ox + (dx / rect.width) * W,
          y: drag.current.oy + (dy / rect.height) * H,
        })
        setTooltip(null)
      }
      return
    }
    const target = e.target as Element
    const cca2 = target.getAttribute?.('data-cca2')
    setTooltip(cca2 ? { cca2, x: e.clientX, y: e.clientY } : null)
  }

  function onPointerUp() {
    const info = drag.current
    drag.current = null
    if (!info || info.moved || !info.cca2) return
    const cca2 = info.cca2
    onToggle(cca2)
    const now = Date.now()
    const prev = lastClick.current
    if (prev && prev.cca2 === cca2 && now - prev.time < 400) {
      lastClick.current = null
      onOpenCountry(cca2)
    } else {
      lastClick.current = { time: now, cca2 }
    }
  }

  function zoomBy(factor: number) {
    setZoom((z) => {
      const k = clampZoom(z.k * factor)
      const cx = W / 2
      const cy = H / 2
      const p = { x: (cx - z.x) / z.k, y: (cy - z.y) / z.k }
      return { k, x: cx - p.x * k, y: cy - p.y * k }
    })
  }

  return (
    <div className="relative w-full select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          drag.current = null
          setTooltip(null)
        }}
      >
        <g transform={`translate(${zoom.x},${zoom.y}) scale(${zoom.k})`}>
          {paths.map(({ d, cca2 }) => {
            const meta = byCca2.get(cca2)
            const stat = meta ? countryStat(meta, visited) : null
            const isHover = tooltip?.cca2 === cca2
            const fill =
              isHover
                ? colors.hover
                : stat && stat.status !== 'none'
                  ? colors.visited
                  : colors.notVisited
            return (
              <path
                key={cca2}
                d={d}
                data-cca2={cca2}
                fill={fill}
                stroke={colors.border}
                strokeWidth={0.5 / zoom.k}
                className="transition-[fill] duration-150"
                style={{ cursor: 'pointer' }}
              />
            )
          })}
        </g>
      </svg>

      <div className="absolute left-3 top-3 flex flex-col gap-1">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-bold shadow ring-1 ring-slate-200 hover:bg-slate-50"
          onClick={() => zoomBy(1.25)}
          title="Acercar"
        >
          +
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-bold shadow ring-1 ring-slate-200 hover:bg-slate-50"
          onClick={() => zoomBy(0.8)}
          title="Alejar"
        >
          −
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm shadow ring-1 ring-slate-200 hover:bg-slate-50"
          onClick={() => setZoom({ k: 1, x: 0, y: 0 })}
          title="Restablecer"
        >
          ⟲
        </button>
      </div>

      {tooltip && (
        <Tooltip
          cca2={tooltip.cca2}
          x={tooltip.x}
          y={tooltip.y}
          visited={visited}
          colors={colors}
        />
      )}
    </div>
  )
}

function Tooltip({
  cca2,
  x,
  y,
  visited,
  colors,
}: {
  cca2: string
  x: number
  y: number
  visited: Set<string>
  colors: MapColors
}) {
  const meta = byCca2.get(cca2)
  if (!meta) return null
  const stat = countryStat(meta, visited)
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
      style={{ left: x, top: y - 64 }}
    >
      <div className="font-semibold">
        {meta.flag} {meta.name}
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-slate-300">
        <span
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ background: stat.status === 'none' ? colors.notVisited : colors.visited }}
        />
        {stat.visited}/{stat.total} · {fmtPct(stat.pct)}
      </div>
      <div className="mt-1 text-[10px] text-slate-400">Doble clic para ver ciudades</div>
    </div>
  )
}
