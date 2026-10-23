import { useEffect, useMemo, useState } from 'react'
import type { ShareVariant } from '../lib/share'
import Modal from './Modal'
import { useStore } from '../store'
import type { MapColors } from '../types'
import { useI18n } from '../lib/i18n-context'
import type { Lang, MessageKey } from '../lib/translations'
import { fmtPct, worldStat } from '../lib/stats'

const VARIANTS: { id: ShareVariant; labelKey: MessageKey }[] = [
  { id: 'full', labelKey: 'shareVariantFull' },
  { id: 'map', labelKey: 'shareVariantMap' },
  { id: 'stats', labelKey: 'shareVariantStats' },
]

interface RenderResult {
  variant: ShareVariant
  wishlist: Set<string>
  visited: Set<string>
  colors: MapColors
  lang: Lang
  url: string
}

export default function ShareModal({ onClose }: { onClose: () => void }) {
  const visitedArr = useStore((s) => s.visited)
  const visited = useMemo(() => new Set(visitedArr), [visitedArr])
  const wishArr = useStore((s) => s.wishlist)
  const wishlist = useMemo(() => new Set(wishArr), [wishArr])
  const colors = useStore((s) => s.colors)
  const { t, lang } = useI18n()
  const [variant, setVariant] = useState<ShareVariant>('full')
  const [status, setStatus] = useState<string>('')
  const [result, setResult] = useState<RenderResult | null>(null)

  useEffect(() => {
    let active = true
    let raf = 0
    raf = requestAnimationFrame(() => {
      import('../lib/share')
        .then(({ renderStoryCard }) => renderStoryCard(visited, wishlist, colors, lang, variant))
        .then((url) => {
          if (active) setResult({ variant, wishlist, visited, colors, lang, url })
        })
    })
    return () => {
      active = false
      cancelAnimationFrame(raf)
    }
  }, [visited, wishlist, colors, lang, variant])

  const dataUrl =
    result &&
    result.variant === variant &&
    result.wishlist === wishlist &&
    result.visited === visited &&
    result.colors === colors &&
    result.lang === lang
      ? result.url
      : null

  async function download() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'que-conozco-historia.png'
    a.click()
  }

  async function share() {
    if (!dataUrl) return
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], 'que-conozco-historia.png', { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: t('shareCardTitle'),
          text: t('shareText', { pct: fmtPct(worldStat(visited).pct) }),
        })
      } catch {
        /* user cancelled */
      }
    } else {
      setStatus(t('shareUnsupported'))
      download()
    }
  }

  return (
    <Modal title={t('shareTitle')} onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col items-center gap-4">
        <div role="group" aria-label={t('shareVariant')} className="flex w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVariant(v.id)}
              aria-pressed={variant === v.id}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium pointer-coarse:min-h-11 ${
                variant === v.id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                  : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {t(v.labelKey)}
            </button>
          ))}
        </div>
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={t('shareImageAlt')}
            className="h-[420px] rounded-2xl shadow-lg ring-1 ring-slate-200"
          />
        ) : (
          <div className="flex h-[420px] w-full items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            {t('generating')}
          </div>
        )}
        {status && <p className="text-center text-xs text-slate-500 dark:text-slate-400">{status}</p>}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">{t('shareDescription')}</p>
        <div className="flex w-full gap-2">
          <button
            onClick={download}
            disabled={!dataUrl}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {t('downloadImage')}
          </button>
          <button
            onClick={share}
            disabled={!dataUrl}
            className="flex-1 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {t('share')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
