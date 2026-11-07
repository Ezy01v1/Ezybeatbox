import type { CharacterRole, PackManifest } from './schema'

/**
 * The first sounds of each section are the main grooves; the rest are variations (swing, half
 * time, fills, stops, double time) that sound best one or two at a time.
 */
export const MAIN_SOUNDS_PER_SECTION = 5
/** At most this many characters get a variation in one surprise mix. */
export const MAX_SURPRISE_VARIATIONS = 2
/** Chance that a character plays a variation instead of a main groove (until the cap). */
const VARIATION_CHANCE = 0.3
/** The rhythm section always plays; voice and fx join with these odds. */
const PLAY_CHANCE: Record<CharacterRole, number> = {
  kick: 1,
  snare: 1,
  hihat: 1,
  bass: 1,
  voice: 0.6,
  fx: 0.5,
}
/** Re-rolls to avoid handing back the beat that is already playing. */
const MAX_ATTEMPTS = 8

export type SoundTargets = Readonly<Record<string, string | null | undefined>>

/**
 * "Sorpréndeme": a random beat that still sounds good. Every character plays a sound of its own
 * section (all of a pack's sounds share key, tempo and length), the rhythm section is always
 * on, and variations are capped so the groove stays readable. Differs from `current` when the
 * pack allows it.
 */
export function surpriseMix(
  manifest: PackManifest,
  current: SoundTargets = {},
  rng: () => number = Math.random,
): Record<string, string | null> {
  const pickOne = <T>(items: readonly T[]): T | undefined =>
    items[Math.min(items.length - 1, Math.floor(rng() * items.length))]

  const roll = (): Record<string, string | null> => {
    let variations = 0
    const mix: Record<string, string | null> = {}
    for (const character of manifest.characters) {
      const ids = character.sounds.map((s) => s.id)
      const main = ids.slice(0, MAIN_SOUNDS_PER_SECTION)
      const extra = ids.slice(MAIN_SOUNDS_PER_SECTION)
      if (rng() >= PLAY_CHANCE[character.role]) {
        mix[character.id] = null
        continue
      }
      const useVariation =
        extra.length > 0 && variations < MAX_SURPRISE_VARIATIONS && rng() < VARIATION_CHANCE
      if (useVariation) variations++
      mix[character.id] = pickOne(useVariation ? extra : main) ?? null
    }
    return mix
  }

  const same = (mix: Record<string, string | null>) =>
    manifest.characters.every(({ id }) => (current[id] ?? null) === mix[id])

  let mix = roll()
  for (let attempt = 1; attempt < MAX_ATTEMPTS && same(mix); attempt++) mix = roll()
  return mix
}
