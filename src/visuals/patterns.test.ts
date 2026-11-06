import type { PackTheme } from '../core/packs/schema'
import { patternMarkup } from './patterns'

const theme: PackTheme = {
  id: 'test',
  stage: {
    background: '#111111',
    panel: '#222222',
    outline: '#333333',
    ink: '#ffffff',
    glow: '#444444',
  },
  roles: {
    kick: '#aa0001',
    snare: '#aa0002',
    hihat: '#aa0003',
    bass: '#aa0004',
    voice: '#aa0005',
    fx: '#aa0006',
  },
}

describe('patternMarkup', () => {
  it.each(['sun', 'lights', 'speed', 'kente'] as const)('draws %s with the theme colors', (p) => {
    const markup = patternMarkup(p, theme)
    expect(markup).toMatch(/#aa000\d/)
    expect(markup).not.toContain('undefined')
    expect(markup).not.toContain('NaN')
  })
})
