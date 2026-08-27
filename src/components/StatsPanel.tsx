import { useMemo } from 'react'
import Modal from './Modal'
import { useStore } from '../store'
import { continentStats, fmtPct, mostVisitedCountry, worldStat } from '../lib/stats'
import { useI18n } from '../lib/i18n-context'
import { countryName, continentLabel } from '../lib/translations'

export default function StatsPanel({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n()
  const visitedArr = useStore((s) => s.visited)
  const visited = useMemo(() => new Set(visitedArr), [visitedArr])
  const world = useMemo(() => worldStat(visited), [visited])
  const continents = useMemo(() => continentStats(visited), [visited])
  const mostVisited = useMemo(() => mostVisitedCountry(visited), [visited])

  return (
    <Modal title={t('stats')} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label={t('countriesVisited')} value={`${world.countriesVisited}/${world.countriesTotal}`} />
          <Card label={t('localities')} value={`${world.visited}/${world.total}`} />
          <Card label={t('world')} value={fmtPct(world.pct)} />
          <Card
            label={t('mostVisitedCountry')}
            value={
              mostVisited
                ? `${mostVisited.meta.flag} ${countryName(mostVisited.meta.name, mostVisited.meta.nameEn, lang)}`
                : '—'
            }
          />
        </div>

        {mostVisited && (
          <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
            <span className="text-2xl">{mostVisited.meta.flag}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  {countryName(mostVisited.meta.name, mostVisited.meta.nameEn, lang)}
                </span>
                <span className="text-sm text-slate-500">
                  {mostVisited.visited}/{mostVisited.total} · {fmtPct(mostVisited.pct)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all"
                  style={{ width: `${Math.min(100, mostVisited.pct)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {continents.map((c) => {
            const pct = c.total === 0 ? 0 : (c.visited / c.total) * 100
            return (
              <div key={c.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{continentLabel(c.key, lang)}</span>
                  <span className="text-slate-500">
                    {c.visited}/{c.total} · {fmtPct(pct)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 truncate text-2xl font-bold text-slate-800">{value}</div>
    </div>
  )
}
