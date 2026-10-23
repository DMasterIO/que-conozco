import { useStore } from '../store'
import { byCca2 } from '../lib/countries'
import { countryStat, countryWishCount, fmtPct } from '../lib/stats'
import { useI18n } from '../lib/i18n-context'
import { countryName } from '../lib/translations'

interface Props {
  cca2: string
  visited: Set<string>
  wishlist: Set<string>
  onClose: () => void
  onOpenCities: () => void
}

// Summary and actions for the country picked on the map. Marking a whole country is an
// explicit action here instead of a side effect of tapping the map.
export default function CountryCard({ cca2, visited, wishlist, onClose, onOpenCities }: Props) {
  const { t, lang } = useI18n()
  const toggleCountry = useStore((s) => s.toggleCountry)
  const toggleWishCountry = useStore((s) => s.toggleWishCountry)
  const meta = byCca2.get(cca2)
  if (!meta) return null
  const stat = countryStat(meta, visited)
  const wishCount = countryWishCount(meta, wishlist)

  return (
    <div
      role="region"
      aria-label={countryName(meta.name, meta.nameEn, lang)}
      className="z-20 flex flex-col gap-3 border-t border-slate-100 p-3 sm:absolute sm:inset-x-3 sm:bottom-3 sm:mx-auto sm:max-w-xl sm:flex-row sm:items-center sm:rounded-2xl sm:border-0 sm:bg-white/95 sm:shadow-xl sm:ring-1 sm:ring-slate-200 sm:backdrop-blur dark:border-slate-800 dark:sm:bg-slate-900/95 dark:sm:ring-slate-700"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="text-2xl">{meta.flag}</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{countryName(meta.name, meta.nameEn, lang)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {stat.visited}/{stat.total} · {fmtPct(stat.pct)}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label={t('countryCardClose')}
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 pointer-coarse:h-11 pointer-coarse:w-11 sm:hidden dark:hover:bg-slate-800"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toggleCountry(cca2)}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 pointer-coarse:min-h-11"
        >
          {stat.status === 'full' ? t('unmarkAll') : t('markAllCountry')}
        </button>
        <button
          onClick={() => toggleWishCountry(cca2)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium pointer-coarse:min-h-11 ${
            wishCount > 0
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900'
          }`}
        >
          {wishCount > 0 ? t('unwishAll') : t('wishAllCountry')}
        </button>
        <button
          onClick={onOpenCities}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 pointer-coarse:min-h-11 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {t('cities')} →
        </button>
        <button
          onClick={onClose}
          aria-label={t('countryCardClose')}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 sm:flex dark:hover:bg-slate-800"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
