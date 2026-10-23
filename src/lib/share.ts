import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { worldFeatures } from './geo'
import { byCcn3 } from './countries'
import { continentStats, countryStat, countryWishCount, fmtPct, mostVisitedCountry, worldStat } from './stats'
import type { MapColors } from '../types'
import { continentLabel, countryName, messages, type Lang } from './translations'

const W = 1080
const H = 1920
const FONT = '"Twemoji Country Flags", system-ui, sans-serif'

export type ShareVariant = 'full' | 'map' | 'stats'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  roundRect(ctx, x, y, w, h, 28)
  ctx.fillStyle = '#0f172a'
  ctx.fill()
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 2
  ctx.stroke()
}

interface Ctx2 {
  ctx: CanvasRenderingContext2D
  visited: Set<string>
  wishlist: Set<string>
  colors: MapColors
  lang: Lang
}

function drawMap({ ctx, visited, wishlist, colors }: Ctx2, top: number, w: number, h: number) {
  const p = geoNaturalEarth1()
  p.fitSize([w, h], { type: 'Sphere' })
  const path = geoPath(p)
  // fitSize fits the width, so centre the map vertically in the box it was given.
  const [[, y0], [, y1]] = path.bounds({ type: 'Sphere' })
  ctx.save()
  ctx.translate((W - w) / 2, top + (h - (y1 - y0)) / 2 - y0)
  for (const f of worldFeatures) {
    const id = (f as { id?: string }).id
    const meta = id ? byCcn3.get(String(id)) : undefined
    const d = meta && path(f)
    if (!meta || !d) continue
    const stat = countryStat(meta, visited)
    const path2d = new Path2D(d)
    ctx.fillStyle =
      stat.status !== 'none' ? colors.visited : countryWishCount(meta, wishlist) > 0 ? colors.wish : '#1e293b'
    ctx.fill(path2d)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2
    ctx.stroke(path2d)
  }
  ctx.restore()
}

function drawHeader({ ctx, visited, lang }: Ctx2, big: boolean) {
  const m = messages[lang]
  const world = worldStat(visited)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#64748b'
  ctx.font = '600 40px system-ui, sans-serif'
  ctx.fillText('¿QUÉ CONOZCO?', W / 2, 160)
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 ${big ? 220 : 150}px system-ui, sans-serif`
  ctx.fillText(fmtPct(world.pct), W / 2, big ? 400 : 320)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '500 52px system-ui, sans-serif'
  ctx.fillText(m.storySubtitle, W / 2, big ? 480 : 400)
}

function drawStatCards({ ctx, visited, lang }: Ctx2, top: number) {
  const m = messages[lang]
  const world = worldStat(visited)
  const cards: [string, string][] = [
    [m.countriesVisited, `${world.countriesVisited} / ${world.countriesTotal}`],
    [m.storyLocalities, `${world.visited} / ${world.total}`],
  ]
  const cardH = 200
  const cardW = 400
  const gap = 40
  const totalW = cards.length * cardW + gap
  let cx = (W - totalW) / 2 + cardW / 2
  for (const [label, value] of cards) {
    card(ctx, cx - cardW / 2, top, cardW, cardH)
    ctx.fillStyle = '#64748b'
    ctx.font = '500 36px system-ui, sans-serif'
    ctx.fillText(label, cx, top + 70)
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 ${value.length > 11 ? 52 : 64}px system-ui, sans-serif`
    ctx.fillText(value, cx, top + 155)
    cx += cardW + gap
  }
}

function drawMostVisited({ ctx, visited, lang }: Ctx2, top: number) {
  const m = messages[lang]
  const best = mostVisitedCountry(visited)
  card(ctx, 120, top, W - 240, 130)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#64748b'
  ctx.font = '500 30px system-ui, sans-serif'
  ctx.fillText(m.mostVisitedCountry.toUpperCase(), W / 2, top + 45)
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 46px ${FONT}`
  ctx.fillText(best ? `${best.meta.flag} ${countryName(best.meta.name, best.meta.nameEn, lang)}` : '—', W / 2, top + 100)
}

function drawContinents({ ctx, visited, colors, lang }: Ctx2, top: number) {
  const left = 120
  const barW = W - 240
  let y = top
  for (const c of continentStats(visited)) {
    const pct = c.total === 0 ? 0 : (c.visited / c.total) * 100
    ctx.textAlign = 'left'
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '600 38px system-ui, sans-serif'
    ctx.fillText(continentLabel(c.key, lang), left, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#94a3b8'
    ctx.font = '500 34px system-ui, sans-serif'
    ctx.fillText(fmtPct(pct), left + barW, y)
    roundRect(ctx, left, y + 18, barW, 26, 13)
    ctx.fillStyle = '#1e293b'
    ctx.fill()
    if (pct > 0) {
      roundRect(ctx, left, y + 18, Math.max(26, (barW * Math.min(100, pct)) / 100), 26, 13)
      ctx.fillStyle = colors.visited
      ctx.fill()
    }
    y += 112
  }
  ctx.textAlign = 'center'
}

export async function renderStoryCard(
  visited: Set<string>,
  wishlist: Set<string>,
  colors: MapColors,
  lang: Lang,
  variant: ShareVariant = 'full',
): Promise<string> {
  // Make sure the flag font (Windows fallback) is ready before the canvas uses it.
  const best = mostVisitedCountry(visited)
  if (best) await document.fonts.load('46px "Twemoji Country Flags"', best.meta.flag).catch(() => [])

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const c: Ctx2 = { ctx, visited, wishlist, colors, lang }

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0f172a')
  bg.addColorStop(1, '#020617')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  drawHeader(c, variant === 'map')
  if (variant === 'full') {
    drawMap(c, 500, W - 140, 820)
    drawStatCards(c, 1400)
    drawMostVisited(c, 1680)
  } else if (variant === 'map') {
    drawMap(c, 560, W - 20, 640)
    drawStatCards(c, 1280)
    drawMostVisited(c, 1680)
  } else {
    drawStatCards(c, 540)
    drawContinents(c, 860)
    drawMostVisited(c, 1680)
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = '#334155'
  ctx.font = '500 34px system-ui, sans-serif'
  ctx.fillText('queconozco.com', W / 2, H - 80)

  return canvas.toDataURL('image/png')
}
