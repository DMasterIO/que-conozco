import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './lib/i18n'
import { loadCountryIndex } from './lib/countries'

registerSW({ immediate: true })

loadCountryIndex()
  .catch(() => {
    /* degraded mode: app still renders, stats will be empty */
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <I18nProvider>
          <App />
        </I18nProvider>
      </StrictMode>,
    )
  })
