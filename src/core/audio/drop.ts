import { findSound } from '../packs/sounds'
import type { CharacterRole, PackManifest } from '../packs/schema'

/**
 * Drop: for one bar only the kick and bass keep playing, then everyone comes back. It starts on
 * the next bar line, like every other change.
 */
export type DropState = 'idle' | 'queued' | 'dropping'

/** Sections that keep sounding during a drop. */
export const DROP_KEEP_ROLES: readonly CharacterRole[] = ['kick', 'bass']

/** Bars the drop lasts. */
export const DROP_BARS = 1

/**
 * Characters that keep sounding during a drop: the ones playing a sound from a kick or bass
 * section, wherever that sound sits (any character can play any sound).
 */
export function dropKeeps(
  manifest: PackManifest,
  playing: Readonly<Record<string, string | null | undefined>>,
): Set<string> {
  const keep = new Set<string>()
  for (const { id } of manifest.characters) {
    const soundId = playing[id]
    const role = soundId ? findSound(manifest, soundId)?.section.role : undefined
    if (role && DROP_KEEP_ROLES.includes(role)) keep.add(id)
  }
  return keep
}
