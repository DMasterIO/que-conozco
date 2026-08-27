import { useMemo, useState } from 'react'
import Modal from './Modal'
import { useStore } from '../store'
import { renderStoryCard } from '../lib/share'
import { useI18n } from '../lib/i18n-context'

export default function ShareModal({ onClose }: { onClose: () => void }) {
  const visitedArr = useStore((s) => s.visited)
  const visited = useMemo(() => new Set(visitedArr), [visitedArr])
  const colors = useStore((s) => s.colors)
  const { t, lang } = useI18n()
  const [status, setStatus] = useState<string>('')

  const dataUrl = useMemo(() => renderStoryCard(visited, colors, lang), [visited, colors, lang])

  async function download() {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'que-conozco-historia.png'
    a.click()
  }

  async function share() {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], 'que-conozco-historia.png', { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Mis viajes' })
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
        <img
          src={dataUrl}
          alt="Tarjeta para historias"
          className="h-[420px] rounded-2xl shadow-lg ring-1 ring-slate-200"
        />
        {status && <p className="text-center text-xs text-slate-500">{status}</p>}
        <p className="text-center text-xs text-slate-400">{t('shareDescription')}</p>
        <div className="flex w-full gap-2">
          <button
            onClick={download}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            {t('downloadImage')}
          </button>
          <button
            onClick={share}
            className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            {t('share')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
