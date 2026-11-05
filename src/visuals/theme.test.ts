import { parseManifest } from '@/core/packs/loader'
import { makeTestManifest } from '@/core/packs/testing'
import boomBapManifest from '../../public/packs/boom-bap-01/manifest.json'
import { DEFAULT_THEME, contrastRatio, readableInk, resolveTheme } from './theme'

describe('resolveTheme', () => {
  it('falls back to the default theme', () => {
    expect(resolveTheme(null)).toBe(DEFAULT_THEME)
    expect(resolveTheme(makeTestManifest())).toBe(DEFAULT_THEME)
  })

  it('uses the pack theme when present', () => {
    const theme = { ...DEFAULT_THEME, id: 'custom' }
    expect(resolveTheme(makeTestManifest({ theme }))).toBe(theme)
  })
})

describe('readableInk', () => {
  it('uses dark ink on light colors and white on dark ones', () => {
    expect(readableInk('#f0b93a')).toBe('#202124')
    expect(readableInk('#2a3550')).toBe('#ffffff')
  })

  it('always reaches at least 4.5:1 on the shipped role colors', () => {
    const manifest = parseManifest(boomBapManifest)
    for (const theme of [DEFAULT_THEME, resolveTheme(manifest)]) {
      for (const color of Object.values(theme.roles)) {
        expect(contrastRatio(color, readableInk(color))).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})

describe('shipped themes', () => {
  it('stage ink is readable on the stage background and on the cards', () => {
    const manifest = parseManifest(boomBapManifest)
    for (const { stage } of [DEFAULT_THEME, resolveTheme(manifest)]) {
      expect(contrastRatio(stage.ink, stage.background)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(stage.ink, stage.panel)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
