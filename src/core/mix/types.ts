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
