import { describe, expect, it } from 'vitest'
import { characterArt, svgStyle } from './characterArt'

describe('character art', () => {
  it.each(['kick', 'snare', 'hihat', 'bass', 'voice', 'fx'] as const)(
    'draws every pack as SVG, without Rive files (%s)',
    (role) => {
      expect(characterArt('trap-01', role)).toBeUndefined()
      expect(characterArt('boom-bap-01', role)).toBeUndefined()
      expect(characterArt('unknown-pack', role)).toBeUndefined()
    },
  )

  it('draws the shipped packs with the streetwear SVG and unknown ones with the classic one', () => {
    for (const pack of [
      'boom-bap-01',
      'trap-01',
      'reggaeton-01',
      'house-01',
      'dnb-01',
      'afrobeat-01',
    ])
      expect(svgStyle(pack)).toBe('streetwear')
    expect(svgStyle('unknown-pack')).toBe('classic')
    expect(svgStyle(undefined)).toBe('classic')
  })
})
