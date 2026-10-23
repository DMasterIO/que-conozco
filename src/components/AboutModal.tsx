import Modal from './Modal'
import { useI18n } from '../lib/i18n-context'

const LINKS: { key: string; href: string }[] = [
  { key: 'creditsGeonames', href: 'https://www.geonames.org/' },
  { key: 'creditsAtlas', href: 'https://github.com/topojson/world-atlas' },
  { key: 'creditsCountries', href: 'https://github.com/mledoze/countries' },
  { key: 'creditsFlags', href: 'https://github.com/twitter/twemoji' },
]

export default function AboutModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  return (
    <Modal title={t('aboutTitle')} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col gap-5 text-sm text-slate-600 dark:text-slate-300">
        <section>
          <h3 className="mb-1 font-semibold text-slate-800 dark:text-slate-100">{t('privacyHeading')}</h3>
          <p>{t('privacyText')}</p>
        </section>
        <section>
          <h3 className="mb-1 font-semibold text-slate-800 dark:text-slate-100">{t('creditsHeading')}</h3>
          <ul className="flex flex-col gap-1.5">
            {LINKS.map((l) => (
              <li key={l.key}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-slate-300 underline-offset-2 hover:text-teal-700 dark:decoration-slate-600 dark:hover:text-teal-300"
                >
                  {t(l.key)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  )
}
