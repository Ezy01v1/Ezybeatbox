import { createStore } from 'zustand/vanilla'
// Type-only import of the engine keeps Tone.js out of this module (and out of jsdom tests).
import type { AudioEngine, ContextState, SlotSnapshot } from '@/core/audio/AudioEngine'
import { AUDIO_CONFIG } from '@/core/audio/config'
import type { MixRepository, SavedMixSummary } from '@/core/mix/repository'
import {
  type SharedMix,
  type ShareLinkError,
  decodeShareLink,
  encodeShareLink,
  resolveSharedMix,
} from '@/core/mix/shareLink'
import { type Mix, fitMixToPack } from '@/core/mix/types'
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
  | 'setVolume'
  | 'setMasterVolume'
  | 'getSlot'
  | 'getMix'
  | 'getMeter'
  | 'getMasterMeter'
  | 'getBeatClock'
  | 'getOutputLatency'
  | 'canRecord'
  | 'startRecording'
  | 'stopRecording'
  | 'contextState'
  | 'isPlaying'
>

/** How many full loops an audio export contains. */
export const EXPORT_LOOP_COUNT = 2

export type AppPhase = 'start' | 'loading' | 'ready' | 'error'

export type AppError =
  { kind: 'pack'; details: readonly string[] } | { kind: 'audio-blocked' } | { kind: 'unknown' }

/** i18n-agnostic notice keys; the UI translates them (`notices.<key>`). */
export type NoticeKey =
  | 'linkLoaded'
  | 'linkInvalid'
  | 'linkNewerVersion'
  | 'linkPackVersionChanged'
  | 'missingSounds'
  | 'mixSaved'
  | 'mixLoaded'
  | 'mixDeleted'
  | 'mixOtherPack'
  | 'mixNotFound'
  | 'storageError'
  | 'exportDone'
  | 'exportUnsupported'
  | 'exportEmpty'
  | 'exportFailed'
  | 'exportCancelled'

export interface Notice {
  id: number
  tone: 'info' | 'error'
  key: NoticeKey
  params?: Record<string, string | number>
}

export type ExportStatus =
  | { state: 'idle' }
  | { state: 'waiting' }
  | { state: 'recording'; barsDone: number; barsTotal: number }

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
  /** The page was opened from a share link (shown on the start screen). */
  openingSharedMix: boolean
  notices: Notice[]
  savedMixes: SavedMixSummary[]
  exportStatus: ExportStatus
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
  /** Applies a whole mix; sound changes land on the next bar as usual. */
  applyMix(mix: Mix): { missingCount: number }
  getShareUrl(): string
  refreshSavedMixes(): Promise<void>
  saveCurrentMix(name: string): Promise<void>
  loadSavedMix(id: string): Promise<void>
  deleteSavedMix(id: string): Promise<void>
  /** Records `EXPORT_LOOP_COUNT` loops from the next loop start. Resolves to the audio, or null. */
  exportAudio(): Promise<Blob | null>
  /** A share link arrived while the page is open (e.g. pasted into the address bar). */
  openLink(hash: string): void
  dismissNotice(id: number): void
}

export type AppStore = ReturnType<typeof createAppStore>

export interface AppStoreOptions {
  engine: EngineLike
  /** Base URL that contains one folder per pack, e.g. `/packs/`. */
  packsBaseUrl: string
  defaultPackId: string
  repository: MixRepository
  /** Page URL without hash; share links are `${shareBaseUrl}#...`. */
  shareBaseUrl: string
  /** `location.hash` at startup; a share link here is applied after the pack loads. */
  initialHash?: string
  /** Called once a startup link was applied (e.g. to clear the hash from the address bar). */
  onLinkConsumed?: () => void
  fetchFn?: typeof fetch
}

export function createAppStore({
  engine,
  packsBaseUrl,
  defaultPackId,
  repository,
  shareBaseUrl,
  initialHash = '',
  onLinkConsumed,
  fetchFn,
}: AppStoreOptions) {
  let pendingShared: SharedMix | null = null
  let pendingLinkError: ShareLinkError | null = null

  /** Decodes a hash into the pending link. Returns false for an empty hash. */
  const receiveHash = (hash: string): boolean => {
    if (!hash.replace(/^#/, '')) return false
    const decoded = decodeShareLink(hash)
    pendingShared = decoded.ok ? decoded.shared : null
    pendingLinkError = decoded.ok ? null : decoded.error
    return true
  }
  receiveHash(initialHash)

  let nextNoticeId = 1

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

    const notify = (tone: Notice['tone'], key: NoticeKey, params?: Notice['params']) =>
      set((state) => ({
        notices: [...state.notices, { id: nextNoticeId++, tone, key, ...(params && { params }) }],
      }))

    /**
     * Calls `onBar` for every bar start until it returns true, then resolves. One listener for
     * the whole wait, so no bar can slip between subscriptions. Rejects if the transport stops.
     */
    const untilBar = (onBar: (bar: number) => boolean) =>
      new Promise<void>((resolve, reject) => {
        const offBar = engine.on('barStart', ({ bar }) => {
          if (!onBar(bar)) return
          cleanup()
          resolve()
        })
        const offStop = engine.on('transportChanged', ({ playing }) => {
          if (playing) return
          cleanup()
          reject(new Error('Transport stopped'))
        })
        const cleanup = () => {
          offBar()
          offStop()
        }
      })

    engine.on('soundQueued', ({ characterId }) => refreshSlot(characterId))
    engine.on('soundStarted', ({ characterId }) => refreshSlot(characterId))
    engine.on('soundStopped', ({ characterId }) => refreshSlot(characterId))
    engine.on('beat', (position) => set({ position }))
    engine.on('transportChanged', ({ playing }) => {
      set({ playing, ...(playing ? {} : { position: { bar: 0, beat: 0 } }) })
      refreshAllSlots()
    })
    engine.on('contextStateChanged', ({ state }) => set({ contextState: state }))

    const applySharedLink = (manifest: PackManifest) => {
      if (pendingLinkError) {
        notify('error', pendingLinkError === 'newer-version' ? 'linkNewerVersion' : 'linkInvalid')
      } else if (pendingShared && pendingShared.packId !== manifest.id) {
        // Only reachable from a link opened while running; switching packs live is not supported.
        notify('error', 'mixOtherPack', { pack: pendingShared.packId })
      } else if (pendingShared) {
        const { mix, packVersionChanged, missingCount } = resolveSharedMix(pendingShared, manifest)
        get().applyMix(mix)
        notify('info', 'linkLoaded')
        if (packVersionChanged) notify('info', 'linkPackVersionChanged')
        if (missingCount > 0) notify('error', 'missingSounds', { count: missingCount })
      } else {
        return
      }
      pendingShared = null
      pendingLinkError = null
      set({ openingSharedMix: false })
      onLinkConsumed?.()
    }

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
      openingSharedMix: pendingShared !== null,
      notices: [],
      savedMixes: [],
      exportStatus: { state: 'idle' },

      openLink(hash) {
        if (!receiveHash(hash)) return
        const manifest = get().manifest
        if (get().phase === 'ready' && manifest) applySharedLink(manifest)
        else set({ openingSharedMix: pendingShared !== null })
      },

      async begin() {
        if (get().phase === 'loading') return
        try {
          await engine.unlock()
        } catch {
          set({ phase: 'error', error: { kind: 'audio-blocked' } })
          return
        }
        set({ phase: 'loading', progress: 0, error: null, contextState: engine.contextState })
        // A shared link may ask for another pack; its id is validated kebab-case (no paths).
        const packUrl = `${packsBaseUrl}${pendingShared?.packId ?? defaultPackId}/`
        try {
          const manifest = await fetchManifest(packUrl, fetchFn)
          await engine.loadPack(manifest, packUrl, {
            onProgress: (progress) => set({ progress }),
          })
          set({ manifest, phase: 'ready' })
          refreshAllSlots()
          applySharedLink(manifest)
          void get().refreshSavedMixes()
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

      applyMix(source) {
        const manifest = get().manifest
        if (!manifest) return { missingCount: 0 }
        const { mix, missingCount } = fitMixToPack(source, manifest)
        for (const [id, character] of Object.entries(mix.characters)) {
          if (character.soundId) engine.setSound(id, character.soundId)
          else engine.clearSound(id)
          engine.setMute(id, character.muted)
          engine.setSolo(id, character.solo)
          engine.setVolume(id, character.volumeDb)
        }
        get().setMasterVolume(mix.masterVolumeDb)
        refreshAllSlots()
        return { missingCount }
      },

      getShareUrl() {
        return `${shareBaseUrl}#${encodeShareLink(engine.getMix())}`
      },

      async refreshSavedMixes() {
        try {
          set({ savedMixes: await repository.list() })
        } catch {
          set({ savedMixes: [] })
        }
      },

      async saveCurrentMix(name) {
        try {
          await repository.save({ name, mix: engine.getMix() })
          notify('info', 'mixSaved', { name: name.trim() })
          await get().refreshSavedMixes()
        } catch {
          notify('error', 'storageError')
        }
      },

      async loadSavedMix(id) {
        const manifest = get().manifest
        let saved
        try {
          saved = await repository.get(id)
        } catch {
          notify('error', 'storageError')
          return
        }
        if (!saved || !manifest) {
          notify('error', 'mixNotFound')
          return
        }
        if (saved.mix.packId !== manifest.id) {
          notify('error', 'mixOtherPack', { pack: saved.mix.packId })
          return
        }
        const { missingCount } = get().applyMix(saved.mix)
        notify('info', 'mixLoaded', { name: saved.name })
        if (missingCount > 0) notify('error', 'missingSounds', { count: missingCount })
      },

      async deleteSavedMix(id) {
        try {
          await repository.delete(id)
          notify('info', 'mixDeleted')
          await get().refreshSavedMixes()
        } catch {
          notify('error', 'storageError')
        }
      },

      async exportAudio() {
        const { manifest, exportStatus, slots } = get()
        if (!manifest || exportStatus.state !== 'idle') return null
        if (!engine.canRecord) {
          notify('error', 'exportUnsupported')
          return null
        }
        if (!Object.values(slots).some((slot) => slot.target)) {
          notify('error', 'exportEmpty')
          return null
        }

        const barsTotal = manifest.loopBars * EXPORT_LOOP_COUNT
        let recording = false
        set({ exportStatus: { state: 'waiting' } })
        try {
          if (!engine.isPlaying) await engine.start()
          // Start on a loop boundary so the file begins at bar 1 of every loop.
          await untilBar((bar) => bar % manifest.loopBars === 0)
          await engine.startRecording()
          recording = true
          set({ exportStatus: { state: 'recording', barsDone: 0, barsTotal } })
          let barsDone = 0
          await untilBar(() => {
            barsDone++
            set({ exportStatus: { state: 'recording', barsDone, barsTotal } })
            return barsDone >= barsTotal
          })
          const blob = await engine.stopRecording()
          recording = false
          notify('info', 'exportDone')
          return blob
        } catch {
          if (recording) await engine.stopRecording().catch(() => undefined)
          notify('error', engine.isPlaying ? 'exportFailed' : 'exportCancelled')
          return null
        } finally {
          set({ exportStatus: { state: 'idle' } })
        }
      },

      dismissNotice(id) {
        set((state) => ({ notices: state.notices.filter((n) => n.id !== id) }))
      },
    }
  })
  return store
}
