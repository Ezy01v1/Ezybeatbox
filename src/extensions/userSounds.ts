/**
 * EXTENSION POINT — not implemented yet (Phase 5 defines the contract only).
 *
 * A "user sound" is a loop that does not come from a pack: recorded with the Loop Station or
 * rendered from a recognized beatbox pattern. Once registered in the engine it behaves exactly
 * like a pack sound: it lives on a character, starts on the next bar and is referenced by id in
 * a `Mix`. See docs/EXTENSIONS.md.
 */

/** Prefix that keeps user sound ids apart from pack ids (still valid kebab-case). */
export const USER_SOUND_ID_PREFIX = 'user-'

export type UserSoundId = `${typeof USER_SOUND_ID_PREFIX}${string}`

export type UserSoundSource = 'loop-station' | 'beat-recognizer'

export interface UserSoundMeta {
  id: UserSoundId
  /** Character (slot) the sound belongs to, like a pack sound. */
  characterId: string
  label: string
  source: UserSoundSource
  /** Tempo and length it was made for; it only fits packs with the same loop length. */
  bpm: number
  bars: number
  createdAt: string
}

export interface UserSound extends UserSoundMeta {
  /** Exactly `bars` long at `bpm`, trimmed and latency-compensated. */
  audio: AudioBuffer
}

/** Persistence for user sounds (planned: IndexedDB, later the backend's object storage). */
export interface UserSoundStore {
  list(): Promise<UserSoundMeta[]>
  load(id: UserSoundId): Promise<UserSound | null>
  save(sound: UserSound): Promise<void>
  delete(id: UserSoundId): Promise<void>
}

/**
 * What `AudioEngine` will implement to accept user sounds. Adding one creates a looping player
 * on the character's channel (same rules as pack sounds); `setSound(characterId, id)` then works
 * unchanged, and so do `Mix`, saved mixes and the stage.
 */
export interface UserSoundHost {
  addUserSound(sound: UserSound): void
  removeUserSound(id: UserSoundId): void
}
