import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './lib/i18n'
import { bootData, useAppStatus } from './lib/appStatus'
import { initFlagFont } from './lib/flagFont'

initFlagFont()

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    useAppStatus.setState({ applyUpdate: () => void updateSW(true) })
  },
})

void bootData()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
