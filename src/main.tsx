import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './lib/i18n'
import { loadCountryIndex, loadMigration } from './lib/countries'
import { useStore } from './store'

registerSW({ immediate: true })

async function bootstrap() {
  // Both are best-effort: on failure the app still renders (stats empty / no remap).
  const [migration] = await Promise.all([
    loadMigration().catch(() => null),
    loadCountryIndex().catch(() => null),
  ])
  if (migration) useStore.getState().applyMigration(migration)
}

bootstrap().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StrictMode>,
  )
})
