import { describe, expect, it } from 'vitest'
import { characterArt, svgStyle } from './characterArt'

describe('character art', () => {
  it.each(['kick', 'snare', 'hihat', 'bass', 'voice', 'fx'] as const)(
    'uses Rive for Trap and SVG for Boom Bap (%s)',
    (role) => {
      expect(characterArt('trap-01', role)).toBe(
        `${import.meta.env.BASE_URL}packs/trap-01/${role}.riv`,
      )
      expect(characterArt('boom-bap-01', role)).toBeUndefined()
      expect(characterArt('unknown-pack', role)).toBeUndefined()
    },
  )

  it('draws Boom Bap with the streetwear SVG and the rest with the classic one', () => {
    expect(svgStyle('boom-bap-01')).toBe('streetwear')
    expect(svgStyle('trap-01')).toBe('classic')
    expect(svgStyle(undefined)).toBe('classic')
  })
})
