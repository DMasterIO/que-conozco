import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { worldFeatures } from './geo'
import { byCcn3 } from './countries'
import { countryStat, fmtPct, mostVisitedCountry, worldStat } from './stats'
import type { MapColors } from '../types'
import { messages, type Lang } from './translations'

const W = 1080
const H = 1920

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

export function renderStoryCard(visited: Set<string>, colors: MapColors, lang: Lang): string {
  const m = messages[lang]
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0f172a')
  bg.addColorStop(1, '#020617')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'

  ctx.fillStyle = '#64748b'
  ctx.font = '600 40px system-ui, sans-serif'
  ctx.fillText('¿QUÉ CONOZCO?', W / 2, 160)

  const world = worldStat(visited)
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 150px system-ui, sans-serif'
  ctx.fillText(fmtPct(world.pct), W / 2, 320)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '500 52px system-ui, sans-serif'
  ctx.fillText(m.storySubtitle, W / 2, 400)

  const mapW = W - 140
  const mapH = 820
  const mapTop = 500

  const p = geoNaturalEarth1()
  p.fitSize([mapW, mapH], { type: 'Sphere' })
  const path = geoPath(p)

  ctx.save()
  ctx.translate((W - mapW) / 2, mapTop)

  for (const f of worldFeatures) {
    const id = (f as { id?: string }).id
    if (!id) continue
    const meta = byCcn3.get(String(id))
    if (!meta) continue
    const d = path(f)
    if (!d) continue
    const stat = countryStat(meta, visited)
    const p2 = new Path2D(d)
    ctx.fillStyle = stat.status === 'none' ? '#1e293b' : colors.visited
    ctx.fill(p2)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2
    ctx.stroke(p2)
  }
  ctx.restore()

  const cards: [string, string][] = [
    [m.countriesVisited, `${world.countriesVisited} / ${world.countriesTotal}`],
    [m.storyLocalities, `${world.visited} / ${world.total}`],
  ]
  const cardTop = 1400
  const cardH = 200
  const cardW = 400
  const gap = 40
  const totalW = cards.length * cardW + (cards.length - 1) * gap
  let cx = (W - totalW) / 2 + cardW / 2
  for (const [label, value] of cards) {
    card(ctx, cx - cardW / 2, cardTop, cardW, cardH)
    ctx.fillStyle = '#64748b'
    ctx.font = '500 36px system-ui, sans-serif'
    ctx.fillText(label, cx, cardTop + 70)
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 64px system-ui, sans-serif'
    ctx.fillText(value, cx, cardTop + 155)
    cx += cardW + gap
  }

  const bannerTop = 1680
  const bannerH = 130
  card(ctx, 120, bannerTop, W - 240, bannerH)
  const mostVisited = mostVisitedCountry(visited)
  ctx.fillStyle = '#64748b'
  ctx.font = '500 30px system-ui, sans-serif'
  ctx.fillText(m.mostVisitedCountry.toUpperCase(), W / 2, bannerTop + 45)
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 46px system-ui, sans-serif'
  ctx.fillText(
    mostVisited
      ? `${mostVisited.meta.flag} ${lang === 'en' ? mostVisited.meta.nameEn : mostVisited.meta.name}`
      : '—',
    W / 2,
    bannerTop + 100,
  )

  ctx.fillStyle = '#334155'
  ctx.font = '500 34px system-ui, sans-serif'
  ctx.fillText('queconozco.com', W / 2, H - 80)

  return canvas.toDataURL('image/png')
}
