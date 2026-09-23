import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { worldFeatures } from '../lib/geo'
import { byCca2, byCcn3 } from '../lib/countries'
import { countryStat, countryWishCount, fmtPct } from '../lib/stats'
import type { MapColors } from '../types'
import { useI18n } from '../lib/i18n-context'
import { countryName } from '../lib/translations'

const W = 1000
const H = 520

const clampZoom = (k: number) => Math.min(12, Math.max(1, k))

interface Props {
  visited: Set<string>
  wishlist: Set<string>
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

interface Fill {
  fill: string
  opacity: number
}

export default function WorldMap({ visited, wishlist, colors, onToggle, onOpenCountry }: Props) {
  const { t } = useI18n()
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
  const rafRef = useRef<number | null>(null)
  const pointerRef = useRef<{ x: number; y: number; cca2: string | null } | null>(null)
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
      setZoom((z) => {
        const k = clampZoom(z.k * factor)
        const px = (vx - z.x) / z.k
        const py = (vy - z.y) / z.k
        return { k, x: vx - px * k, y: vy - py * k }
      })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
  }, [])

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

  const fillMap = useMemo(() => {
    const map = new Map<string, Fill>()
    for (const { cca2 } of paths) {
      const meta = byCca2.get(cca2)
      if (!meta) continue
      const stat = countryStat(meta, visited)
      const wishCount = countryWishCount(meta, wishlist)
      if (stat.status === 'full') map.set(cca2, { fill: colors.visited, opacity: 1 })
      else if (stat.status === 'partial') map.set(cca2, { fill: colors.visited, opacity: 0.6 })
      else if (wishCount > 0) map.set(cca2, { fill: colors.wish, opacity: 1 })
      else map.set(cca2, { fill: colors.notVisited, opacity: 1 })
    }
    return map
  }, [paths, visited, wishlist, colors])

  const mapGroup = useMemo(
    () => (
      <g transform={`translate(${zoom.x},${zoom.y}) scale(${zoom.k})`}>
        {paths.map(({ d, cca2 }) => {
          const f = fillMap.get(cca2) ?? { fill: colors.notVisited, opacity: 1 }
          return (
            <path
              key={cca2}
              d={d}
              data-cca2={cca2}
              fill={f.fill}
              fillOpacity={f.opacity}
              stroke={colors.border}
              strokeWidth={0.5 / zoom.k}
              className="country-path"
              style={{ cursor: 'pointer' }}
            />
          )
        })}
      </g>
    ),
    [paths, fillMap, colors, zoom],
  )

  function scheduleTooltip() {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const p = pointerRef.current
      setTooltip(p && p.cca2 ? { cca2: p.cca2, x: p.x, y: p.y } : null)
    })
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return
    const target = e.target as Element
    const cca2 = target.getAttribute?.('data-cca2') ?? null
    svgRef.current?.setPointerCapture(e.pointerId)
    drag.current = { sx: e.clientX, sy: e.clientY, ox: zoom.x, oy: zoom.y, moved: false, cca2 }
    pointerRef.current = null
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
    const cca2 = target.getAttribute?.('data-cca2') ?? null
    pointerRef.current = { x: e.clientX, y: e.clientY, cca2 }
    scheduleTooltip()
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
        role="img"
        aria-label={t('mapAriaLabel')}
        className="block w-full touch-none cursor-grab active:cursor-grabbing"
        style={{ '--map-hover': colors.hover } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          drag.current = null
          pointerRef.current = null
          setTooltip(null)
        }}
      >
        {mapGroup}
      </svg>

      <div className="absolute left-3 top-3 flex flex-col gap-1">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-bold shadow ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700 dark:hover:bg-slate-800"
          onClick={() => zoomBy(1.25)}
          title={t('zoomIn')}
          aria-label={t('zoomIn')}
        >
          +
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-bold shadow ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700 dark:hover:bg-slate-800"
          onClick={() => zoomBy(0.8)}
          title={t('zoomOut')}
          aria-label={t('zoomOut')}
        >
          −
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm shadow ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700 dark:hover:bg-slate-800"
          onClick={() => setZoom({ k: 1, x: 0, y: 0 })}
          title={t('restore')}
          aria-label={t('restore')}
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
          wishlist={wishlist}
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
  wishlist,
  colors,
}: {
  cca2: string
  x: number
  y: number
  visited: Set<string>
  wishlist: Set<string>
  colors: MapColors
}) {
  const { t, lang } = useI18n()
  const meta = byCca2.get(cca2)
  if (!meta) return null
  const stat = countryStat(meta, visited)
  const wishCount = countryWishCount(meta, wishlist)
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
      style={{ left: x, top: y - 64 }}
    >
      <div className="font-semibold">
        {meta.flag} {countryName(meta.name, meta.nameEn, lang)}
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-slate-300">
        <span
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ background: stat.status === 'none' ? colors.notVisited : colors.visited }}
        />
        {stat.visited}/{stat.total} · {fmtPct(stat.pct)}
      </div>
      {wishCount > 0 && (
        <div className="mt-0.5 flex items-center gap-2 text-slate-300">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: colors.wish }} />
          {wishCount} {t('wishCities')}
        </div>
      )}
      <div className="mt-1 text-[10px] text-slate-400">{t('doubleClickHint')}</div>
    </div>
  )
}
