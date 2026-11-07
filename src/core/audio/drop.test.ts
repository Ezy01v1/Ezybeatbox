import { makeTestManifest } from '../packs/testing'
import { dropKeeps } from './drop'

const manifest = makeTestManifest()

describe('dropKeeps', () => {
  it('keeps the characters playing a kick or bass sound', () => {
    const playing = {
      kick: 'kick-1',
      snare: 'snare-1',
      hihat: 'hihat-2',
      bass: 'bass-1',
      voice: 'voice-1',
      fx: null,
    }
    expect([...dropKeeps(manifest, playing)].sort()).toEqual(['bass', 'kick'])
  })

  it('follows the sound, not the character', () => {
    const playing = { kick: 'snare-1', voice: 'kick-2', fx: 'bass-2' }
    expect([...dropKeeps(manifest, playing)].sort()).toEqual(['fx', 'voice'])
  })

  it('keeps nobody when no kick or bass is playing', () => {
    expect(dropKeeps(manifest, { snare: 'snare-1', kick: null }).size).toBe(0)
  })
})
