import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'

// Content hash of every generated dataset file. Data requests carry it as `?v=`, so a
// regenerated dataset gets new URLs and neither the browser nor the service worker can
// serve the previous one.
function dataVersion(): string {
  const hash = createHash('sha1')
  for (const file of readdirSync('public/data').sort()) {
    hash.update(file)
    hash.update(readFileSync(`public/data/${file}`))
  }
  return hash.digest('hex').slice(0, 10)
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    __DATA_VERSION__: JSON.stringify(dataVersion()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '¿Qué conozco? · Mapa de viajes',
        short_name: '¿Qué conozco?',
        description: 'Registra los países y localidades que has visitado sobre un mapa del mundo.',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: './',
        scope: './',
        background_color: '#f8fafc',
        theme_color: '#14b8a6',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        globIgnores: ['**/og-image.png'],
        // Static pages that are not the SPA shell must not be answered with index.html.
        navigateFallbackDenylist: [/legal\.html$/, /third-party-licenses\.txt$/],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json(\?.*)?$/,
            handler: 'CacheFirst',
            options: {
              // Safe to cache forever: data URLs are versioned with `?v=<content hash>`.
              cacheName: 'country-data',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
})
