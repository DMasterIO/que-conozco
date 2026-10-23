import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { worldFeatures } from '../lib/geo'
import { byCca2, byCcn3 } from '../lib/countries'
import { MICROSTATES } from '../data/microstates'
import { countryStat, countryWishCount, fmtPct } from '../lib/stats'
import type { MapColors } from '../types'
import { useI18n } from '../lib/i18n-context'
import { countryName } from '../lib/translations'

const W = 1000
const H = 520
const MAX_ZOOM = 12
// Pointer travel (px) under which a press still counts as a click.
const CLICK_SLOP = 6

interface Props {
  visited: Set<string>
  wishlist: Set<string>
  colors: MapColors
  selected: string | null
  onSelect: (cca2: string | null) => void
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

// Keeps the map covering the viewport so it can never be dragged out of view.
function clampZoom(z: Zoom): Zoom {
  const k = Math.min(MAX_ZOOM, Math.max(1, z.k))
  return {
    k,
    x: Math.min(0, Math.max(W - W * k, z.x)),
    y: Math.min(0, Math.max(H - H * k, z.y)),
  }
}

// Zoom around a viewBox point, keeping that point fixed on screen.
function zoomAt(z: Zoom, vx: number, vy: number, factor: number): Zoom {
  const k = Math.min(MAX_ZOOM, Math.max(1, z.k * factor))
  const px = (vx - z.x) / z.k
  const py = (vy - z.y) / z.k
  return clampZoom({ k, x: vx - px * k, y: vy - py * k })
}

export default function WorldMap({ visited, wishlist, colors, selected, onSelect }: Props) {
  const { t } = useI18n()
  const svgRef = useRef<SVGSVGElement>(null)
  const groupRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<Zoom>({ k: 1, x: 0, y: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{
    sx: number
    sy: number
    ox: number
    oy: number
    moved: boolean
    cca2: string | null
    pinch: number
  } | null>(null)
  const rafRef = useRef<number | null>(null)
  const pointerRef = useRef<{ x: number; y: number; cca2: string | null } | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // The pan/zoom transform is written straight to the DOM: React never re-renders the ~250
  // shapes while a gesture is in progress.
  function applyZoom(next: Zoom) {
    zoomRef.current = next
    groupRef.current?.setAttribute('transform', `translate(${next.x},${next.y}) scale(${next.k})`)
    svgRef.current?.style.setProperty('--k', String(next.k))
  }

  function toViewBox(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect()
    return { vx: ((clientX - rect.left) / rect.width) * W, vy: ((clientY - rect.top) / rect.height) * H, rect }
  }

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const { vx, vy } = toViewBox(e.clientX, e.clientY)
      applyZoom(zoomAt(zoomRef.current, vx, vy, e.deltaY < 0 ? 1.25 : 0.8))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
  }, [])

  const projection = useMemo(() => {
    const p = geoNaturalEarth1()
    p.fitSize([W, H], { type: 'Sphere' })
    return p
  }, [])

  const paths = useMemo(() => {
    const path = geoPath(projection)
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
  }, [projection])

  // Countries too small for the 110m atlas are drawn as dots so they stay reachable.
  const dots = useMemo(() => {
    const out: { cx: number; cy: number; cca2: string }[] = []
    for (const [cca2, [lat, lng]] of Object.entries(MICROSTATES)) {
      const pt = projection([lng, lat])
      if (pt && byCca2.has(cca2)) out.push({ cx: pt[0], cy: pt[1], cca2 })
    }
    return out
  }, [projection])

  const fillMap = useMemo(() => {
    const map = new Map<string, Fill>()
    const ids = [...paths.map((p) => p.cca2), ...dots.map((d) => d.cca2)]
    for (const cca2 of ids) {
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
  }, [paths, dots, visited, wishlist, colors])

  const selectedPath = useMemo(() => paths.find((p) => p.cca2 === selected)?.d ?? null, [paths, selected])

  const shapes = useMemo(
    () => (
      <>
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
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
              className="country-path"
              style={{ cursor: 'pointer' }}
            />
          )
        })}
        {dots.map(({ cx, cy, cca2 }) => {
          const f = fillMap.get(cca2) ?? { fill: colors.notVisited, opacity: 1 }
          return (
            <g key={cca2} className="micro-dot" style={{ transformOrigin: `${cx}px ${cy}px` }}>
              <circle cx={cx} cy={cy} r={9} fill="transparent" data-cca2={cca2} />
              <circle
                cx={cx}
                cy={cy}
                r={3.6}
                fill={f.fill}
                fillOpacity={f.opacity}
                stroke="#64748b"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
                className="country-path"
                data-cca2={cca2}
                style={{ cursor: 'pointer' }}
              />
            </g>
          )
        })}
      </>
    ),
    [paths, dots, fillMap, colors],
  )

  function scheduleTooltip() {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const p = pointerRef.current
      setTooltip(p && p.cca2 ? { cca2: p.cca2, x: p.x, y: p.y } : null)
    })
  }

  function countryAt(e: React.PointerEvent): string | null {
    return (e.target as Element).getAttribute?.('data-cca2') ?? null
  }

  function startGesture(e: React.PointerEvent, cca2: string | null) {
    const z = zoomRef.current
    gesture.current = { sx: e.clientX, sy: e.clientY, ox: z.x, oy: z.y, moved: false, cca2, pinch: 0 }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    svgRef.current?.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    pointerRef.current = null
    setTooltip(null)
    if (pointers.current.size === 1) {
      startGesture(e, countryAt(e))
    } else if (gesture.current) {
      // Second finger: switch to pinch and never treat this gesture as a click.
      const [a, b] = Array.from(pointers.current.values())
      gesture.current.moved = true
      gesture.current.pinch = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const known = pointers.current.get(e.pointerId)
    if (known) {
      known.x = e.clientX
      known.y = e.clientY
    }
    const g = gesture.current
    if (g && pointers.current.size >= 2 && g.pinch > 0) {
      const [a, b] = Array.from(pointers.current.values())
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const { vx, vy } = toViewBox((a.x + b.x) / 2, (a.y + b.y) / 2)
      applyZoom(zoomAt(zoomRef.current, vx, vy, dist / g.pinch))
      g.pinch = dist
      return
    }
    if (g) {
      const dx = e.clientX - g.sx
      const dy = e.clientY - g.sy
      if (Math.abs(dx) > CLICK_SLOP || Math.abs(dy) > CLICK_SLOP) g.moved = true
      if (g.moved) {
        const rect = svgRef.current!.getBoundingClientRect()
        applyZoom(
          clampZoom({
            k: zoomRef.current.k,
            x: g.ox + (dx / rect.width) * W,
            y: g.oy + (dy / rect.height) * H,
          }),
        )
      }
      return
    }
    if (e.pointerType !== 'mouse') return
    pointerRef.current = { x: e.clientX, y: e.clientY, cca2: countryAt(e) }
    scheduleTooltip()
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    const g = gesture.current
    if (pointers.current.size > 0) {
      // One finger left after a pinch: continue panning from where it is.
      const [rest] = Array.from(pointers.current.values())
      if (g && rest) {
        g.sx = rest.x
        g.sy = rest.y
        g.ox = zoomRef.current.x
        g.oy = zoomRef.current.y
        g.pinch = 0
      }
      return
    }
    gesture.current = null
    if (!g || g.moved) return
    onSelect(g.cca2)
  }

  function onPointerCancel(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) gesture.current = null
  }

  function zoomBy(factor: number) {
    applyZoom(zoomAt(zoomRef.current, W / 2, H / 2, factor))
  }

  const btn =
    'flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold shadow ring-1 ring-slate-200 hover:bg-slate-50 pointer-coarse:h-9 pointer-coarse:w-9 dark:bg-slate-900 dark:ring-slate-700 dark:hover:bg-slate-800'

  return (
    <div className="relative w-full select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('mapAriaLabel')}
        className="block w-full touch-none cursor-grab active:cursor-grabbing"
        style={{ '--map-hover': colors.hover, '--k': 1 } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={() => {
          pointerRef.current = null
          setTooltip(null)
        }}
      >
        <g ref={groupRef}>
          {shapes}
          {selectedPath && (
            <path
              d={selectedPath}
              fill="none"
              className="stroke-slate-900 dark:stroke-white"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}
        </g>
      </svg>

      <div className="absolute left-3 top-3 flex flex-col gap-1">
        <button className={`${btn} text-lg`} onClick={() => zoomBy(1.25)} title={t('zoomIn')} aria-label={t('zoomIn')}>
          +
        </button>
        <button className={`${btn} text-lg`} onClick={() => zoomBy(0.8)} title={t('zoomOut')} aria-label={t('zoomOut')}>
          −
        </button>
        <button
          className={`${btn} text-sm`}
          onClick={() => applyZoom({ k: 1, x: 0, y: 0 })}
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
      className="pointer-events-none fixed z-30 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
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
