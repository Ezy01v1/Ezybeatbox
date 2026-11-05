import { AUDIO_CONFIG } from '../audio/config'
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
  characters: Record<string, CharacterMix>
}

/**
 * Adapts a mix (saved, shared or synced) to the loaded pack: unknown characters are ignored,
 * missing sounds become silence. `missingCount` tells the UI something was dropped.
 */
export function fitMixToPack(mix: Mix, manifest: PackManifest): { mix: Mix; missingCount: number } {
  const fitted = createEmptyMix(manifest)
  fitted.masterVolumeDb = mix.masterVolumeDb
  let missingCount = 0
  for (const [characterId, source] of Object.entries(mix.characters)) {
    const character = manifest.characters.find((c) => c.id === characterId)
    const target = fitted.characters[characterId]
    if (!character || !target) {
      if (source.soundId) missingCount++
      continue
    }
    const soundExists = character.sounds.some((s) => s.id === source.soundId)
    if (source.soundId && !soundExists) missingCount++
    Object.assign(target, { ...source, soundId: soundExists ? source.soundId : null })
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
