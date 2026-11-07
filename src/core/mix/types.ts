import { findSound } from '../packs/sounds'
import { AUDIO_CONFIG } from '../audio/config'
import { clampTempo } from '../audio/tempo'
import type { PackManifest } from '../packs/schema'

/** Bumped whenever the serialized shape of `Mix` changes (Phase 4 adds migrations). */
export const MIX_SCHEMA_VERSION = 1

export interface CharacterMix {
  soundId: string | null
  muted: boolean
  solo: boolean
  volumeDb: number
}

/** Everything that defines "what is sounding". Plain data: safe to save, share and sync. */
export interface Mix {
  schemaVersion: number
  packId: string
  packVersion: number
  masterVolumeDb: number
  /** Live tempo, only when it differs from the pack's (older mixes have none). */
  bpm?: number | undefined
  characters: Record<string, CharacterMix>
}

/**
 * Adapts a mix (saved, shared or synced) to the loaded pack: unknown characters are ignored,
 * missing sounds become silence. `missingCount` tells the UI something was dropped.
 */
export function fitMixToPack(mix: Mix, manifest: PackManifest): { mix: Mix; missingCount: number } {
  const fitted = createEmptyMix(manifest)
  fitted.masterVolumeDb = mix.masterVolumeDb
  const bpm = mix.bpm === undefined ? manifest.bpm : clampTempo(mix.bpm, manifest.bpm)
  if (bpm !== manifest.bpm) fitted.bpm = bpm
  let missingCount = 0
  for (const [characterId, source] of Object.entries(mix.characters)) {
    const character = manifest.characters.find((c) => c.id === characterId)
    const target = fitted.characters[characterId]
    if (!character || !target) {
      if (source.soundId) missingCount++
      continue
    }
    // Any sound of the pack fits any character, once: a repeat becomes silence.
    const usable =
      source.soundId !== null &&
      findSound(manifest, source.soundId) !== undefined &&
      !Object.values(fitted.characters).some((c) => c.soundId === source.soundId)
    if (source.soundId && !usable) missingCount++
    Object.assign(target, { ...source, soundId: usable ? source.soundId : null })
  }
  return { mix: fitted, missingCount }
}

export function createEmptyMix(manifest: PackManifest): Mix {
  return {
    schemaVersion: MIX_SCHEMA_VERSION,
    packId: manifest.id,
    packVersion: manifest.version,
    masterVolumeDb: AUDIO_CONFIG.defaultMasterVolumeDb,
    characters: Object.fromEntries(
      manifest.characters.map((character) => [
        character.id,
        {
          soundId: null,
          muted: false,
          solo: false,
          volumeDb: AUDIO_CONFIG.defaultChannelVolumeDb,
        },
      ]),
    ),
  }
}
