import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates favicon.ico, PWA icons (64/192/512), maskable and apple-touch icons from icon.svg.
// Run with `npm run generate:icons` after changing public/icon.svg.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // icon.svg is full-bleed and already keeps the character inside the maskable safe zone,
    // so it needs no extra padding.
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0,
      resizeOptions: { background: '#0a0a0a' },
    },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#0a0a0a' } },
  },
  images: ['public/icon.svg'],
})
