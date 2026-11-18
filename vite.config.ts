import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/hayko_webstore/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Hayko Webstore',
        short_name: 'Hayko',
        description: 'Deine persönliche App-Zentrale',
        theme_color: '#101525',
        background_color: '#101525',
        display: 'standalone',
        start_url: '/hayko_webstore/',
        scope: '/hayko_webstore/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/hayko_webstore/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,json,ico}']
      }
    })
  ]
})
