import { createStore } from 'zustand/vanilla'
// Type-only import of the engine keeps Tone.js out of this module (and out of jsdom tests).
import type { AudioEngine, ContextState, SlotSnapshot } from '@/core/audio/AudioEngine'
import { AUDIO_CONFIG } from '@/core/audio/config'
import { PackLoadError, fetchManifest } from '@/core/packs/loader'
import type { PackManifest } from '@/core/packs/schema'

/** The engine surface the UI uses. Narrow on purpose so tests can provide a fake. */
export type EngineLike = Pick<
  AudioEngine,
  | 'on'
  | 'unlock'
  | 'loadPack'
  | 'start'
  | 'stop'
  | 'setSound'
  | 'clearSound'
  | 'setMute'
  | 'setSolo'
  | 'setMasterVolume'
  | 'getSlot'
  | 'getMeter'
  | 'getMasterMeter'
  | 'getBeatClock'
  | 'getOutputLatency'
  | 'contextState'
  | 'isPlaying'
>

export type AppPhase = 'start' | 'loading' | 'ready' | 'error'

export type AppError =
  { kind: 'pack'; details: readonly string[] } | { kind: 'audio-blocked' } | { kind: 'unknown' }

export interface AppState {
  phase: AppPhase
  /** 0–1 while `phase === 'loading'`. */
  progress: number
  error: AppError | null
  manifest: PackManifest | null
  slots: Record<string, SlotSnapshot>
  playing: boolean
  /** Zero-based; updated once per beat (never per frame). */
  position: { bar: number; beat: number }
  contextState: ContextState
  masterVolumeDb: number
}

export interface AppActions {
  /** "Toca para empezar": unlocks audio and loads the pack. Call from a user gesture. */
  begin(): Promise<void>
  /** Resumes a suspended/interrupted AudioContext. Call from a user gesture. */
  resumeAudio(): Promise<void>
  togglePlay(): Promise<void>
  setSound(characterId: string, soundId: string): void
  clearSound(characterId: string): void
  toggleMute(characterId: string): void
  toggleSolo(characterId: string): void
  setMasterVolume(volumeDb: number): void
}

export type AppStore = ReturnType<typeof createAppStore>

export interface AppStoreOptions {
  engine: EngineLike
  packUrl: string
  fetchFn?: typeof fetch
}

export function createAppStore({ engine, packUrl, fetchFn }: AppStoreOptions) {
  const store = createStore<AppState & AppActions>()((set, get) => {
    const refreshSlot = (characterId: string) =>
      set((state) => ({
        slots: { ...state.slots, [characterId]: engine.getSlot(characterId) },
      }))

    const refreshAllSlots = () => {
      const manifest = get().manifest
      if (!manifest) return
      set({
        slots: Object.fromEntries(manifest.characters.map((c) => [c.id, engine.getSlot(c.id)])),
      })
    }

    engine.on('soundQueued', ({ characterId }) => refreshSlot(characterId))
    engine.on('soundStarted', ({ characterId }) => refreshSlot(characterId))
    engine.on('soundStopped', ({ characterId }) => refreshSlot(characterId))
    engine.on('beat', (position) => set({ position }))
    engine.on('transportChanged', ({ playing }) => {
      set({ playing, ...(playing ? {} : { position: { bar: 0, beat: 0 } }) })
      refreshAllSlots()
    })
    engine.on('contextStateChanged', ({ state }) => set({ contextState: state }))

    return {
      phase: 'start',
      progress: 0,
      error: null,
      manifest: null,
      slots: {},
      playing: false,
      position: { bar: 0, beat: 0 },
      contextState: engine.contextState,
      masterVolumeDb: AUDIO_CONFIG.defaultMasterVolumeDb,

      async begin() {
        if (get().phase === 'loading') return
        try {
          await engine.unlock()
        } catch {
          set({ phase: 'error', error: { kind: 'audio-blocked' } })
          return
        }
        set({ phase: 'loading', progress: 0, error: null, contextState: engine.contextState })
        try {
          const manifest = await fetchManifest(packUrl, fetchFn)
          await engine.loadPack(manifest, packUrl, {
            onProgress: (progress) => set({ progress }),
          })
          set({ manifest, phase: 'ready' })
          refreshAllSlots()
        } catch (error) {
          set({
            phase: 'error',
            error:
              error instanceof PackLoadError
                ? { kind: 'pack', details: error.details }
                : { kind: 'unknown' },
          })
        }
      },

      async resumeAudio() {
        try {
          await engine.unlock()
        } finally {
          set({ contextState: engine.contextState })
        }
      },

      async togglePlay() {
        if (engine.isPlaying) engine.stop()
        else await engine.start()
      },

      setSound(characterId, soundId) {
        engine.setSound(characterId, soundId)
      },

      clearSound(characterId) {
        engine.clearSound(characterId)
      },

      toggleMute(characterId) {
        engine.setMute(characterId, !engine.getSlot(characterId).muted)
        refreshSlot(characterId)
      },

      toggleSolo(characterId) {
        engine.setSolo(characterId, !engine.getSlot(characterId).solo)
        refreshSlot(characterId)
      },

      setMasterVolume(volumeDb) {
        engine.setMasterVolume(volumeDb)
        set({ masterVolumeDb: volumeDb })
      },
    }
  })
  return store
}
