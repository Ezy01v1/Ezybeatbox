import { makeTestManifest } from '../packs/testing'
import { decodeShareLink, encodeShareLink, resolveSharedMix } from './shareLink'
import { createEmptyMix } from './types'

const manifest = makeTestManifest()

function sampleMix() {
  const mix = createEmptyMix(manifest)
  mix.characters.kick!.soundId = 'kick-2'
  mix.characters.snare!.soundId = 'snare-1'
  mix.characters.snare!.muted = true
  mix.characters.voice!.solo = true
  mix.characters.bass!.volumeDb = -3.04
  mix.masterVolumeDb = -2
  return mix
}

describe('encodeShareLink', () => {
  it('is compact, readable and needs no percent-escaping', () => {
    const hash = encodeShareLink(sampleMix())
    expect(hash).toBe(
      'v=1&p=test-pack&pv=1&s=kick.kick-2~snare.snare-1&m=snare&o=voice&vol=bass.-3&mv=-2',
    )
    expect(hash).not.toContain('%')
  })

  it('never writes non-finite volumes (they would make the link invalid)', () => {
    const mix = createEmptyMix(manifest)
    mix.characters.snare!.volumeDb = -Infinity
    mix.masterVolumeDb = Infinity
    const hash = encodeShareLink(mix)
    expect(hash).toBe('v=1&p=test-pack&pv=1&vol=snare.-60&mv=6')
    expect(decodeShareLink(hash).ok).toBe(true)
  })

  it('omits defaults for an empty mix', () => {
    expect(encodeShareLink(createEmptyMix(manifest))).toBe('v=1&p=test-pack&pv=1')
  })
})

describe('decodeShareLink + resolveSharedMix', () => {
  it('round-trips a mix', () => {
    const mix = sampleMix()
    const decoded = decodeShareLink(`#${encodeShareLink(mix)}`)
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) return

    const resolved = resolveSharedMix(decoded.shared, manifest)
    mix.characters.bass!.volumeDb = -3 // rounded to 0.1 dB in the link
    expect(resolved).toEqual({ mix, packVersionChanged: false, missingCount: 0 })
  })

  it.each([
    ['', 'invalid'],
    ['#hello', 'invalid'],
    ['#v=abc&p=test-pack&pv=1', 'invalid'],
    ['#v=1&p=../../etc&pv=1', 'invalid'],
    ['#v=1&p=test-pack', 'invalid'],
    ['#v=1&p=test-pack&pv=1&s=kick', 'invalid'],
    ['#v=1&p=test-pack&pv=1&s=Kick.<script>', 'invalid'],
    ['#v=1&p=test-pack&pv=1&vol=bass.loud', 'invalid'],
    ['#v=2&p=test-pack&pv=1', 'newer-version'],
  ])('rejects %s as %s', (hash, error) => {
    expect(decodeShareLink(hash)).toEqual({ ok: false, error })
  })

  it('clamps out-of-range volumes', () => {
    const decoded = decodeShareLink('#v=1&p=test-pack&pv=1&vol=bass.99&mv=-500')
    expect(decoded.ok && decoded.shared.volumes.bass).toBe(6)
    expect(decoded.ok && decoded.shared.masterVolumeDb).toBe(-60)
  })

  it('skips sounds and characters the pack no longer has, and flags pack version changes', () => {
    const decoded = decodeShareLink('#v=1&p=test-pack&pv=7&s=kick.kick-9~ghost.ghost-1~bass.bass-1')
    if (!decoded.ok) throw new Error('expected ok')
    const resolved = resolveSharedMix(decoded.shared, manifest)
    expect(resolved.missingCount).toBe(2)
    expect(resolved.packVersionChanged).toBe(true)
    expect(resolved.mix.characters.bass?.soundId).toBe('bass-1')
    expect(resolved.mix.characters.kick?.soundId).toBeNull()
  })

  it('carries the live tempo, clamped to the pack range, and omits the pack tempo', () => {
    const mix = { ...sampleMix(), bpm: 96 }
    const hash = encodeShareLink(mix)
    expect(hash).toContain('&t=96')
    expect(encodeShareLink(sampleMix())).not.toContain('t=')

    const decoded = decodeShareLink(hash)
    if (!decoded.ok) throw new Error('expected ok')
    expect(resolveSharedMix(decoded.shared, manifest).mix.bpm).toBe(96)

    const fast = decodeShareLink('#v=1&p=test-pack&pv=1&t=500')
    if (!fast.ok) throw new Error('expected ok')
    expect(resolveSharedMix(fast.shared, manifest).mix.bpm).toBe(103)
    expect(decodeShareLink('#v=1&p=test-pack&pv=1&t=fast')).toEqual({ ok: false, error: 'invalid' })
  })
})
