import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import WorldMap from './components/WorldMap'
import CountryList from './components/CountryList'
import CountryCard from './components/CountryCard'
import Modal from './components/Modal'
import { useStore } from './store'
import { continentStats, fmtPct, worldStat } from './lib/stats'
import { COUNTRIES, countryCityIds } from './lib/countries'
import { useI18n } from './lib/i18n-context'
import { applyTheme } from './lib/theme'
import { parseBackup, serializeBackup } from './lib/backup'
import { bootData, useAppStatus } from './lib/appStatus'
import type { Theme } from './types'

const StatsPanel = lazy(() => import('./components/StatsPanel'))
const ColorConfig = lazy(() => import('./components/ColorConfig'))
const ShareModal = lazy(() => import('./components/ShareModal'))
const CountryDetail = lazy(() => import('./components/CountryDetail'))
const AboutModal = lazy(() => import('./components/AboutModal'))

type ModalKind = 'stats' | 'colors' | 'share' | 'about' | null

// Country data loads in the background; remounting once it is ready makes every derived stat
// (cached per marks) recompute against the loaded index.
export default function App() {
  const data = useAppStatus((s) => s.data)
  return <AppContent key={data === 'ready' ? 'ready' : 'boot'} />
}

function AppContent() {
  const visitedArr = useStore((s) => s.visited)
  const wishArr = useStore((s) => s.wishlist)
  const colors = useStore((s) => s.colors)
  const toggleCountry = useStore((s) => s.toggleCountry)
  const toggleWishCountry = useStore((s) => s.toggleWishCountry)
  const setSelectedCountry = useStore((s) => s.setSelectedCountry)
  const selectedCountry = useStore((s) => s.selectedCountry)
  const clearAll = useStore((s) => s.clearAll)
  const importData = useStore((s) => s.importData)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const canUndo = useStore((s) => s.canUndo)
  const undo = useStore((s) => s.undo)
  const { t, lang, setLang } = useI18n()
  const dataStatus = useAppStatus((s) => s.data)
  const applyUpdate = useAppStatus((s) => s.applyUpdate)

  const [picked, setPicked] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalKind>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isTouch = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    [],
  )

  useEffect(() => {
    applyTheme(theme)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(theme)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const visited = useMemo(() => new Set(visitedArr), [visitedArr])
  const wishlist = useMemo(() => new Set(wishArr), [wishArr])
  const world = useMemo(() => worldStat(visited), [visited])
  const continents = useMemo(() => continentStats(visited), [visited])

  const countriesWithCities = COUNTRIES.filter((c) => countryCityIds(c.cca2).length > 0).length
  const visitedContinents = continents.filter((c) => c.visited > 0).length
  const isEmpty = visitedArr.length === 0 && wishArr.length === 0

  function exportJson() {
    const data = serializeBackup({ visited: visitedArr, wishlist: wishArr, colors })
    const blob = new Blob([data], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `que-conozco-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importData(parseBackup(String(reader.result), colors))
        setNotice(t('importDone'))
      } catch {
        setNotice(t('importInvalid'))
      }
    }
    reader.onerror = () => setNotice(t('importInvalid'))
    reader.readAsText(file)
  }

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(id)
  }, [notice])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = `${t('appName')} · ${t('appTagline')}`
  }, [lang, t])

  const openModal = (kind: ModalKind) => {
    setModal(kind)
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-xl">
              🌍
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t('appName')}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('appSubtitle')}</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <HeaderButton onClick={() => setModal('share')}>📤 {t('share')}</HeaderButton>
              <HeaderButton onClick={() => setModal('colors')}>🎨 {t('colors')}</HeaderButton>
              <HeaderButton onClick={() => setModal('stats')}>📊 {t('stats')}</HeaderButton>
              <HeaderButton onClick={exportJson}>⬇ {t('exportData')}</HeaderButton>
              <HeaderButton onClick={() => fileRef.current?.click()}>⬆ {t('importData')}</HeaderButton>
              <ThemeControl theme={theme} onSelect={setTheme} />
              <HeaderButton onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>
                🌐 {lang === 'es' ? 'EN' : 'ES'}
              </HeaderButton>
              <HeaderButton onClick={() => setConfirmReset(true)} danger>
                {t('resetAll')}
              </HeaderButton>
            </div>

            <div className="relative sm:hidden">
              <HeaderButton onClick={() => setMenuOpen((o) => !o)} ariaLabel={t('menu')}>
                ⋯
              </HeaderButton>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-slate-100 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <MenuItem onClick={() => openModal('share')}>📤 {t('share')}</MenuItem>
                    <MenuItem onClick={() => openModal('colors')}>🎨 {t('colors')}</MenuItem>
                    <MenuItem onClick={() => openModal('stats')}>📊 {t('stats')}</MenuItem>
                    <MenuItem onClick={() => { exportJson(); setMenuOpen(false) }}>⬇ {t('exportData')}</MenuItem>
                    <MenuItem onClick={() => { fileRef.current?.click(); setMenuOpen(false) }}>⬆ {t('importData')}</MenuItem>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{t('theme')}</span>
                      <ThemeControl theme={theme} onSelect={setTheme} />
                    </div>
                    <MenuItem onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>
                      🌐 {lang === 'es' ? 'English' : 'Español'}
                    </MenuItem>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <MenuItem onClick={() => { setConfirmReset(true); setMenuOpen(false) }} danger>
                      {t('resetAll')}
                    </MenuItem>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <a
          href="#countries"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow dark:focus:bg-slate-800"
        >
          {t('skipToList')}
        </a>
        {dataStatus === 'loading' && (
          <div role="status" className="mb-4 rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {t('loadingData')}
          </div>
        )}
        {dataStatus === 'error' && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">
            <span>{t('dataError')}</span>
            <button onClick={() => void bootData()} className="rounded-lg bg-rose-600 px-3 py-1 font-medium text-white hover:bg-rose-700 pointer-coarse:min-h-11">
              {t('retry')}
            </button>
          </div>
        )}
        {isEmpty && (
          <section className="mb-6 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/40">
            <div className="font-semibold text-teal-900 dark:text-teal-100">{t('onboardingTitle')}</div>
            <p className="mt-1 text-sm text-teal-800/80 dark:text-teal-200/80">{t('onboardingText')}</p>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('worldMap')}</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t(isTouch ? 'touchHint' : 'mapHint')}</span>
          </div>
          <div className="relative">
            <WorldMap
              visited={visited}
              wishlist={wishlist}
              colors={colors}
              selected={picked}
              onSelect={setPicked}
            />
            {picked && (
              <CountryCard
                cca2={picked}
                visited={visited}
                wishlist={wishlist}
                onClose={() => setPicked(null)}
                onOpenCities={() => setSelectedCountry(picked)}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <Legend color={colors.visited} label={t('visited')} />
            <Legend color={colors.visited} label={t('partial')} opacity={0.6} />
            <Legend color={colors.wish} label={t('wishlist')} />
            <Legend color={colors.notVisited} label={t('notVisited')} />
            <Legend color={colors.border} label={t('border')} />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickStat label={t('worldExplored')} value={fmtPct(world.pct)} />
          <QuickStat label={t('countriesVisited')} value={`${world.countriesVisited}/${world.countriesTotal}`} />
          <QuickStat label={t('localities')} value={`${world.visited}/${world.total}`} />
          <QuickStat label={t('continents')} value={`${visitedContinents}/${continents.length}`} />
        </section>

        <section id="countries" className="mt-8 scroll-mt-20">
          <h2 className="mb-4 text-xl font-bold">{t('countries')}</h2>
          <CountryList
            visited={visited}
            wishlist={wishlist}
            colors={colors}
            onToggle={toggleCountry}
            onToggleWish={toggleWishCountry}
            onOpen={setSelectedCountry}
          />
        </section>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          ¿Qué conozco? · queconozco.com · {t('footerCountries', { n: countriesWithCities })} ·{' '}
          {t('footerNote')} ·{' '}
          <button onClick={() => setModal('about')} className="underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-300">
            {t('about')}
          </button>
        </footer>
      </main>

      <Suspense fallback={null}>
        {modal === 'stats' && <StatsPanel onClose={() => setModal(null)} />}
        {modal === 'colors' && <ColorConfig onClose={() => setModal(null)} />}
        {modal === 'share' && <ShareModal onClose={() => setModal(null)} />}
        {modal === 'about' && <AboutModal onClose={() => setModal(null)} />}
        {selectedCountry && (
          <CountryDetail cca2={selectedCountry} onClose={() => setSelectedCountry(null)} />
        )}
      </Suspense>

      {confirmReset && (
        <Modal title={t('resetConfirmTitle')} onClose={() => setConfirmReset(false)} maxWidth="max-w-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('resetConfirmText')}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setConfirmReset(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => {
                clearAll()
                setConfirmReset(false)
              }}
              className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              {t('resetConfirm')}
            </button>
          </div>
        </Modal>
      )}

      <div className="fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {applyUpdate && (
          <div role="status" className="flex items-center gap-3 rounded-full bg-teal-700 px-4 py-2 text-sm text-white shadow-lg">
            {t('updateAvailable')}
            <button onClick={applyUpdate} className="rounded-full bg-white/20 px-3 py-0.5 font-medium hover:bg-white/30">
              {t('update')}
            </button>
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg ring-1 ring-slate-700">
            {notice}
          </div>
        )}
        {canUndo && (
          <button
            onClick={undo}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-slate-700 transition hover:bg-slate-700 pointer-coarse:min-h-11 dark:bg-slate-800 dark:ring-slate-600"
          >
            ↩ {t('undo')}
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
    </div>
  )
}

function HeaderButton({
  children,
  onClick,
  danger,
  ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
  ariaLabel?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition pointer-coarse:min-h-11 ${
        danger
          ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition pointer-coarse:min-h-11 ${
        danger
          ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

const THEME_OPTIONS: { value: Theme; icon: string; labelKey: string }[] = [
  { value: 'light', icon: '☀️', labelKey: 'themeLight' },
  { value: 'dark', icon: '🌙', labelKey: 'themeDark' },
  { value: 'system', icon: '💻', labelKey: 'themeSystem' },
]

function ThemeControl({ theme, onSelect }: { theme: Theme; onSelect: (next: Theme) => void }) {
  const { t } = useI18n()
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
      role="group"
      aria-label={t('theme')}
    >
      {THEME_OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onSelect(o.value)}
          title={t(o.labelKey)}
          aria-label={t(o.labelKey)}
          aria-pressed={theme === o.value}
          className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition pointer-coarse:h-10 pointer-coarse:w-10 ${
            theme === o.value
              ? 'bg-white shadow-sm dark:bg-slate-600'
              : 'hover:bg-white/60 dark:hover:bg-slate-700'
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  )
}

function Legend({ color, label, opacity = 1 }: { color: string; label: string; opacity?: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm ring-1 ring-black/10" style={{ background: color, opacity }} />
      {label}
    </span>
  )
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  )
}
