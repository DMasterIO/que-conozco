import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './lib/i18n'
import { bootData } from './lib/appStatus'
import { initFlagFont } from './lib/flagFont'

initFlagFont()

// autoUpdate: a new service worker activates immediately and the page reloads into it. (A
// "prompt" worker waits for every old tab to close, which left returning visitors on a stale build.)
registerSW({ immediate: true })

void bootData()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
