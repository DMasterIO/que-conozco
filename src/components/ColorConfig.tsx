import { useState } from 'react'
import Modal from './Modal'
import { useStore, DEFAULT_COLORS } from '../store'
import type { MapColors } from '../types'
import { useI18n } from '../lib/i18n-context'
import type { MessageKey } from '../lib/translations'

const FIELDS: { key: keyof MapColors; labelKey: MessageKey }[] = [
  { key: 'visited', labelKey: 'countriesVisited' },
  { key: 'wish', labelKey: 'wishColor' },
  { key: 'notVisited', labelKey: 'notVisitedCountries' },
  { key: 'hover', labelKey: 'hover' },
  { key: 'border', labelKey: 'borders' },
]

export default function ColorConfig({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const colors = useStore((s) => s.colors)
  const setColors = useStore((s) => s.setColors)
  const [local, setLocal] = useState<MapColors>(colors)

  function update(key: keyof MapColors, value: string) {
    const next = { ...local, [key]: value }
    setLocal(next)
    setColors(next)
  }

  return (
    <Modal title={t('mapColors')} onClose={onClose}>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">{t('colorHint')}</p>
      <div className="mb-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('colorPreview')}
        </div>
        <div className="flex h-8 overflow-hidden rounded-lg ring-1 ring-black/10">
          <span className="flex-1" style={{ background: local.visited }} title={t('countriesVisited')} />
          <span className="flex-1" style={{ background: local.wish }} title={t('wishColor')} />
          <span className="flex-1" style={{ background: local.notVisited }} title={t('notVisitedCountries')} />
          <span className="flex-1" style={{ background: local.hover }} title={t('hover')} />
          <span className="flex-1" style={{ background: local.border }} title={t('borders')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
            <input
              type="color"
              value={local[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              className="h-10 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
            />
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{t(f.labelKey)}</div>
              <div className="font-mono text-xs text-slate-500 dark:text-slate-400">{local[f.key]}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-6 flex justify-between gap-2">
        <button
          onClick={() => {
            setLocal(DEFAULT_COLORS)
            setColors(DEFAULT_COLORS)
          }}
          className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {t('resetColors')}
        </button>
        <button
          onClick={onClose}
          className="rounded-xl bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          {t('done')}
        </button>
      </div>
    </Modal>
  )
}
