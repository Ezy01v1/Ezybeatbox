/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const BACKGROUND = '#f5f3ee'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The app asks before reloading (an update mid-beat would cut the audio).
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'EzyBeatbox',
        short_name: 'EzyBeatbox',
        description: 'Arma tu beat de beatbox, capa por capa.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: BACKGROUND,
        theme_color: BACKGROUND,
        categories: ['music', 'entertainment'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell + the default pack (manifest and Ogg loops), so the app works offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}', 'packs/**/*.{json,ogg,jpg}'],
        // The .m4a fallbacks are only fetched by browsers without Ogg (older Safari): cache them
        // on first use instead of making every device download both formats.
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/packs/') && url.pathname.endsWith('.m4a'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ezybeatbox-pack-fallbacks',
              expiration: { maxEntries: 200 },
            },
          },
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
