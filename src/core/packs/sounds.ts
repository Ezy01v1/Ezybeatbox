import type { CharacterDef, PackManifest, SoundDef } from './schema'

/**
 * Sounds are grouped in sections (a pack character's `sounds`: kicks, snares, …), but any
 * character can play any sound of the pack, one character per sound at a time.
 */
export interface SoundEntry {
  sound: SoundDef
  /** The character whose section lists the sound: its role, color and glyph. */
  section: CharacterDef
}

export function findSound(manifest: PackManifest, soundId: string): SoundEntry | undefined {
  for (const section of manifest.characters) {
    const sound = section.sounds.find((s) => s.id === soundId)
    if (sound) return { sound, section }
  }
  return undefined
}

/**
 * Where a tapped (not dragged) palette sound goes, so one tap keeps doing the obvious thing:
 * - a sound already on a character stays there;
 * - its section's own character, if free or playing another sound of the same section (swap);
 * - otherwise the first free character (that one was moved to another section on purpose);
 * - otherwise its section's character, replacing what it plays.
 */
export function placeSound(
  manifest: PackManifest,
  soundId: string,
  targets: Readonly<Record<string, string | null | undefined>>,
): string | undefined {
  const entry = findSound(manifest, soundId)
  if (!entry) return undefined
  const holder = manifest.characters.find((c) => targets[c.id] === soundId)
  if (holder) return holder.id

  const home = entry.section
  const homeTarget = targets[home.id] ?? null
  if (homeTarget === null || home.sounds.some((s) => s.id === homeTarget)) return home.id
  const free = manifest.characters.find((c) => (targets[c.id] ?? null) === null)
  return free?.id ?? home.id
}
