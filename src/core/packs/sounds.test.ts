import { findSound, placeSound } from './sounds'
import { makeTestManifest } from './testing'

const manifest = makeTestManifest()
const empty = Object.fromEntries(manifest.characters.map((c) => [c.id, null]))

describe('findSound', () => {
  it('finds a sound and its section anywhere in the pack', () => {
    expect(findSound(manifest, 'bass-2')?.section.id).toBe('bass')
    expect(findSound(manifest, 'nope')).toBeUndefined()
  })
})

describe('placeSound', () => {
  it('goes to its section character when free or swapping within the section', () => {
    expect(placeSound(manifest, 'kick-2', empty)).toBe('kick')
    expect(placeSound(manifest, 'kick-2', { ...empty, kick: 'kick-1' })).toBe('kick')
  })

  it('stays where it already is', () => {
    expect(placeSound(manifest, 'kick-2', { ...empty, voice: 'kick-2' })).toBe('voice')
  })

  it('takes the first free character when its own plays another section', () => {
    expect(placeSound(manifest, 'kick-2', { ...empty, kick: 'snare-1', snare: 'snare-2' })).toBe(
      'hihat',
    )
  })

  it('replaces its own character when nobody is free', () => {
    const full = Object.fromEntries(manifest.characters.map((c) => [c.id, 'x']))
    expect(placeSound(manifest, 'kick-2', { ...full, kick: 'snare-1' })).toBe('kick')
  })
})
