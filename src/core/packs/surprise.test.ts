import { CHARACTER_ROLES } from './schema'
import { MAIN_SOUNDS_PER_SECTION, MAX_SURPRISE_VARIATIONS, surpriseMix } from './surprise'
import { makeTestManifest } from './testing'

/** Small deterministic PRNG (mulberry32) so every seed is reproducible. */
function seeded(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Eleven sounds per section, like the generated packs: five grooves plus six variations.
const manifest = makeTestManifest({
  characters: CHARACTER_ROLES.map((role) => ({
    id: role,
    role,
    label: role,
    sounds: Array.from({ length: 11 }, (_, i) => ({
      id: `${role}-${i + 1}`,
      label: `${role} ${i + 1}`,
      file: `${role}/${role}-${i + 1}.ogg`,
    })),
  })),
})
const sectionOf = (soundId: string) => soundId.replace(/-\d+$/, '')
const isVariation = (soundId: string) => Number(soundId.split('-').pop()) > MAIN_SOUNDS_PER_SECTION

describe('surpriseMix', () => {
  const mixes = Array.from({ length: 300 }, (_, seed) => surpriseMix(manifest, {}, seeded(seed)))

  it('gives every character a sound of its own section, or silence', () => {
    for (const mix of mixes) {
      expect(Object.keys(mix).sort()).toEqual([...CHARACTER_ROLES].sort())
      for (const [characterId, soundId] of Object.entries(mix)) {
        if (soundId) expect(sectionOf(soundId)).toBe(characterId)
      }
    }
  })

  it('always plays the rhythm section', () => {
    for (const mix of mixes) {
      for (const id of ['kick', 'snare', 'hihat', 'bass']) expect(mix[id]).not.toBeNull()
    }
  })

  it('caps the variations and still uses them sometimes', () => {
    const counts = mixes.map((mix) => Object.values(mix).filter((s) => s && isVariation(s)).length)
    expect(Math.max(...counts)).toBeLessThanOrEqual(MAX_SURPRISE_VARIATIONS)
    expect(counts.some((n) => n > 0)).toBe(true)
  })

  it('varies voice and fx, and the grooves themselves', () => {
    expect(new Set(mixes.map((m) => m.voice)).has(null)).toBe(true)
    expect(new Set(mixes.map((m) => m.fx)).has(null)).toBe(true)
    expect(new Set(mixes.map((m) => m.kick)).size).toBeGreaterThan(MAIN_SOUNDS_PER_SECTION)
  })

  it('does not hand back the beat that is already playing', () => {
    for (let seed = 0; seed < 50; seed++) {
      const current = surpriseMix(manifest, {}, seeded(seed))
      const next = surpriseMix(manifest, current, seeded(seed))
      expect(next).not.toEqual(current)
    }
  })

  it('works with sections that only have main grooves', () => {
    const small = makeTestManifest()
    const mix = surpriseMix(small, {}, seeded(1))
    expect(mix.kick).toMatch(/^kick-[12]$/)
  })
})
