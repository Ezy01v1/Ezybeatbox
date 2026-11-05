import { makeTestManifest } from '../packs/testing'
import { createEmptyMix, fitMixToPack } from './types'

describe('fitMixToPack', () => {
  const manifest = makeTestManifest()

  it('keeps everything that exists in the pack', () => {
    const mix = createEmptyMix(manifest)
    mix.characters.kick!.soundId = 'kick-2'
    mix.characters.kick!.muted = true
    mix.characters.bass!.volumeDb = -12
    mix.masterVolumeDb = -3
    expect(fitMixToPack(mix, manifest)).toEqual({ mix, missingCount: 0 })
  })

  it('drops unknown sounds and characters and counts them', () => {
    const mix = createEmptyMix(manifest)
    mix.characters.kick!.soundId = 'kick-99'
    mix.characters.ghost = { soundId: 'ghost-1', muted: false, solo: false, volumeDb: -6 }
    const result = fitMixToPack(mix, manifest)
    expect(result.missingCount).toBe(2)
    expect(result.mix.characters.kick?.soundId).toBeNull()
    expect(result.mix.characters.ghost).toBeUndefined()
  })
})
