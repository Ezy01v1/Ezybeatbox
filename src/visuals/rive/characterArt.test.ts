import { describe, expect, it } from 'vitest'
import { characterArt } from './characterArt'

describe('Rive character art', () => {
  it.each(['kick', 'snare', 'hihat', 'bass', 'voice', 'fx'] as const)(
    'selects %s art for both packs',
    (role) => {
      expect(characterArt('boom-bap-01', role)).toBe(
        `${import.meta.env.BASE_URL}packs/boom-bap-01/${role}.riv`,
      )
      expect(characterArt('trap-01', role)).toBe(
        `${import.meta.env.BASE_URL}packs/trap-01/${role}.riv`,
      )
      expect(characterArt('unknown-pack', role)).toBeUndefined()
    },
  )
})
