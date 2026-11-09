import { placeSound } from '@/core/packs/sounds'
import { surpriseMix } from '@/core/packs/surprise'
import { createStore } from 'zustand/vanilla'
// Type-only import of the engine keeps Tone.js out of this module (and out of jsdom tests).
import type { AudioEngine, ContextState, SlotSnapshot } from '@/core/audio/AudioEngine'
import { AUDIO_CONFIG } from '@/core/audio/config'
import type { DropState } from '@/core/audio/drop'
import type { MixRepository, SavedMixSummary } from '@/core/mix/repository'
import {
  type SharedMix,
  type ShareLinkError,
  decodeShareLink,
  encodeShareLink,
  resolveSharedMix,
} from '@/core/mix/shareLink'
import { type Mix, fitMixToPack } from '@/core/mix/types'
import { type PackSummary, fetchCatalog } from '@/core/packs/catalog'
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
  | 'queueDrop'
  | 'setTempo'
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
  | 'packUnavailable'
  | 'mixPackUnavailable'
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

export interface CatalogState {
  state: 'idle' | 'loading' | 'ready' | 'error'
  packs: PackSummary[]
}

export interface AppState {
  phase: AppPhase
  /** 0–1 while `phase === 'loading'`. */
  progress: number
  error: AppError | null
  manifest: PackManifest | null
  /** Packs offered by the picker (manifests only, no audio). */
  catalog: CatalogState
  slots: Record<string, SlotSnapshot>
  playing: boolean
  /** Drop (core/audio/drop): queued for the next bar, sounding, or idle. */
  dropState: DropState
  /** Live tempo: `bpm` is heard, `target` was asked for and lands on the next bar line. */
  tempo: { bpm: number; target: number }
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
  /**
   * Unlocks audio and opens a pack (by default the shared link's, the last requested one, or the
   * default). Opening the pack that is already loaded just returns to the stage. Call from a user
   * gesture.
   */
  begin(packId?: string): Promise<void>
  /** Loads the pack list for the picker. Safe to call repeatedly. */
  loadCatalog(): Promise<void>
  /**
   * Shows the pack picker ("Inicio" / "Cambiar estilo"). The current pack stays loaded and keeps
   * playing, so "Continuar mi beat" returns to it as it was. Opening another pack stops it.
   */
  openPackPicker(): void
  /** Resumes a suspended/interrupted AudioContext. Call from a user gesture. */
  resumeAudio(): Promise<void>
  togglePlay(): Promise<void>
  /** Queues a sound on a character; if another character has it, it moves (one per sound). */
  setSound(characterId: string, soundId: string): void
  /** Tap on a palette sound: picks the character with `placeSound` (core/packs/sounds). */
  placeSound(soundId: string): void
  clearSound(characterId: string): void
  toggleMute(characterId: string): void
  toggleSolo(characterId: string): void
  setMasterVolume(volumeDb: number): void
  /**
   * Swaps every character to a pack base (or clears them all with null). Mute, solo and volumes
   * are kept; sound changes land on the next bar as usual.
   */
  applyBase(baseId: string | null): void
  /**
   * "Sorpréndeme": a random beat that sounds good (core/packs/surprise), different from the
   * current one. Like a base, it keeps mute, solo and volumes and lands on the next bar.
   */
  surprise(): void
  /** Drop: one bar of only kick and bass from the next bar line, then everyone is back. */
  drop(): void
  /** Live tempo within the pack's range (core/audio/tempo); lands on the next bar line. */
  setTempo(bpm: number): void
  /** Adds `delta` BPM to the tempo asked for (so quick taps add up before the bar line). */
  nudgeTempo(delta: number): void
  /** Applies a whole mix; sound changes land on the next bar as usual. */
  applyMix(mix: Mix): { missingCount: number }
  getShareUrl(): string
  refreshSavedMixes(): Promise<boolean>
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
  let followSharedAfterLoad = false
  /** A saved mix from another pack, applied once that pack has loaded. */
  let pendingSaved: { name: string; mix: Mix } | null = null
  /** Last pack asked for, so "Reintentar" retries that one and not the default. */
  let requestedPackId = defaultPackId

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

    /** Sets every character to its sound in `targets` (missing = silent): bases and surprise. */
    const applyTargets = (
      manifest: PackManifest,
      targets: Readonly<Record<string, string | null | undefined>>,
    ) => {
      for (const { id } of manifest.characters) {
        const soundId = targets[id]
        if (soundId) engine.setSound(id, soundId)
        else engine.clearSound(id)
      }
      refreshAllSlots()
    }

    /**
     * Self-heal: Tone.Draw drops callbacks that run over 0.25 s late (e.g. the main thread is busy
     * mounting the stage's Rive canvases right at a bar start), so a `soundStarted` can be lost and
     * a slot stays "En espera". Each beat re-reads the engine and fixes only the slots that drifted.
     */
    const syncDriftedSlots = () => {
      const { slots } = get()
      for (const id of Object.keys(slots)) {
        const known = slots[id]
        const actual = engine.getSlot(id)
        if (known?.playing !== actual.playing || known.target !== actual.target) refreshSlot(id)
      }
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
    engine.on('beat', (position) => {
      set({ position })
      syncDriftedSlots()
    })
    engine.on('transportChanged', ({ playing }) => {
      set({ playing, ...(playing ? {} : { position: { bar: 0, beat: 0 } }) })
      refreshAllSlots()
    })
    engine.on('contextStateChanged', ({ state }) => set({ contextState: state }))
    engine.on('dropChanged', ({ state }) => set({ dropState: state }))
    engine.on('tempoChanged', (tempo) => set({ tempo }))

    const applySharedLink = (manifest: PackManifest) => {
      if (pendingLinkError) {
        notify('error', pendingLinkError === 'newer-version' ? 'linkNewerVersion' : 'linkInvalid')
      } else if (pendingShared && pendingShared.packId !== manifest.id) {
        // Defensive: openPack always loads the link's pack before calling this.
        notify('error', 'packUnavailable', { pack: pendingShared.packId })
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

    const applyPendingSaved = (manifest: PackManifest) => {
      const saved = pendingSaved
      pendingSaved = null
      if (!saved || saved.mix.packId !== manifest.id) return
      const { missingCount } = get().applyMix(saved.mix)
      notify('info', 'mixLoaded', { name: saved.name })
      if (missingCount > 0) notify('error', 'missingSounds', { count: missingCount })
    }

    /** Drops whatever was waiting for a pack that turned out to be unavailable. */
    const dropPendingFor = (packId: string) => {
      if (pendingShared?.packId === packId) {
        pendingShared = null
        set({ openingSharedMix: false })
        onLinkConsumed?.()
      }
      if (pendingSaved?.mix.packId === packId) pendingSaved = null
    }

    const tryUnlockAudio = async () => {
      try {
        await engine.unlock()
        return true
      } catch {
        return false
      }
    }
    const startLoading = () => set({ phase: 'loading', progress: 0, error: null })

    /** A link pasted during a load takes precedence once the current step is safe to leave. */
    const takeQueuedPack = (packId: string): string | undefined => {
      if (!followSharedAfterLoad) return
      followSharedAfterLoad = false
      pendingSaved = null
      const next = pendingShared?.packId
      return next === packId ? undefined : next
    }

    const reportAudioBlocked = (packId: string) => {
      requestedPackId = takeQueuedPack(packId) ?? packId
      set({ phase: 'error', error: { kind: 'audio-blocked' } })
    }

    /**
     * Loads `packId` and shows its stage. The manifest is fetched before the engine is touched,
     * so if another pack is already playing and the new one is missing, the user keeps the
     * current stage and gets a notice instead of an error screen.
     */
    const openPack = async (packId: string, unlockAudio = false): Promise<void> => {
      requestedPackId = packId
      const previous = get().manifest
      // Claim the loading phase before the gesture's async unlock so a second click cannot enter.
      startLoading()
      if (unlockAudio && !(await tryUnlockAudio())) {
        reportAudioBlocked(packId)
        return
      }
      const afterUnlock = takeQueuedPack(packId)
      if (afterUnlock) return openPack(afterUnlock)
      set({ contextState: engine.contextState })
      // Ids come from the catalog, a link or a saved mix; all are validated kebab-case (no paths).
      const packUrl = `${packsBaseUrl}${packId}/`

      let manifest: PackManifest
      try {
        manifest = await fetchManifest(packUrl, fetchFn)
      } catch (error) {
        const next = takeQueuedPack(packId)
        if (next) return openPack(next)
        const status = error instanceof PackLoadError ? error.httpStatus : undefined
        if (
          (previous || pendingSaved?.mix.packId === packId) &&
          (status === 404 || status === 410)
        ) {
          dropPendingFor(packId)
          requestedPackId = previous?.id ?? defaultPackId
          set({ phase: previous ? 'ready' : 'start' })
          notify('error', previous ? 'packUnavailable' : 'mixPackUnavailable', { pack: packId })
          return
        }
        set({
          phase: 'error',
          error:
            error instanceof PackLoadError
              ? { kind: 'pack', details: error.details }
              : { kind: 'unknown' },
        })
        return
      }
      const afterManifest = takeQueuedPack(packId)
      if (afterManifest) return openPack(afterManifest)

      try {
        await engine.loadPack(manifest, packUrl, {
          onProgress: (progress) => set({ progress }),
        })
      } catch (error) {
        // The engine dropped the previous pack before loading this one: nothing to go back to.
        set({ manifest: null, slots: {} })
        const next = takeQueuedPack(packId)
        if (next) return openPack(next)
        set({
          phase: 'error',
          error:
            error instanceof PackLoadError
              ? { kind: 'pack', details: error.details }
              : { kind: 'unknown' },
        })
        return
      }

      set({ manifest })
      refreshAllSlots()
      const afterAudio = takeQueuedPack(packId)
      if (afterAudio) return openPack(afterAudio)
      set({ phase: 'ready' })
      applySharedLink(manifest)
      applyPendingSaved(manifest)
      void get().refreshSavedMixes()
    }

    const openOrResumePack = async (packId: string, unlockAudio: boolean) => {
      const current = get().manifest
      if (current?.id !== packId) {
        await openPack(packId, unlockAudio)
        return
      }
      if (unlockAudio && get().error?.kind === 'audio-blocked') {
        startLoading()
        if (!(await tryUnlockAudio())) {
          reportAudioBlocked(packId)
          return
        }
      }
      const next = takeQueuedPack(packId)
      if (next) return openPack(next)
      // Returning to the loaded stage keeps its beat and applies any mix the user just chose.
      requestedPackId = packId
      set({ phase: 'ready', error: null, contextState: engine.contextState })
      applySharedLink(current)
      applyPendingSaved(current)
    }

    return {
      phase: 'start',
      progress: 0,
      error: null,
      manifest: null,
      catalog: { state: 'idle', packs: [] },
      slots: {},
      playing: false,
      position: { bar: 0, beat: 0 },
      contextState: engine.contextState,
      masterVolumeDb: AUDIO_CONFIG.defaultMasterVolumeDb,
      openingSharedMix: pendingShared !== null,
      notices: [],
      savedMixes: [],
      exportStatus: { state: 'idle' },
      dropState: 'idle',
      tempo: { bpm: 0, target: 0 },

      openLink(hash) {
        if (!receiveHash(hash)) return
        const { phase, manifest } = get()
        followSharedAfterLoad = phase === 'loading' && pendingShared !== null
        if (phase === 'error' && pendingShared) {
          requestedPackId = pendingShared.packId
          pendingSaved = null
        }
        if (phase !== 'ready' || !manifest) {
          set({ openingSharedMix: pendingShared !== null })
        } else if (pendingShared && pendingShared.packId !== manifest.id) {
          // Audio is already unlocked, so switching packs needs no new gesture.
          void openPack(pendingShared.packId)
        } else {
          applySharedLink(manifest)
        }
      },

      async begin(packId) {
        const { phase } = get()
        if (phase === 'loading') return
        const id =
          packId ?? (phase === 'error' ? requestedPackId : pendingShared?.packId) ?? requestedPackId
        await openOrResumePack(id, true)
      },

      async loadCatalog() {
        const { state } = get().catalog
        if (state === 'loading' || state === 'ready') return
        set({ catalog: { state: 'loading', packs: [] } })
        try {
          const { packs } = await fetchCatalog(packsBaseUrl, fetchFn)
          set({ catalog: { state: 'ready', packs } })
        } catch {
          set({ catalog: { state: 'error', packs: [] } })
        }
      },

      openPackPicker() {
        if (get().phase !== 'ready') return
        set({ phase: 'start' })
        void get().loadCatalog()
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
        // One character per sound: placing it elsewhere moves it.
        for (const [id, slot] of Object.entries(get().slots)) {
          if (id !== characterId && slot.target === soundId) engine.clearSound(id)
        }
        engine.setSound(characterId, soundId)
      },

      placeSound(soundId) {
        const manifest = get().manifest
        if (!manifest) return
        const targets = Object.fromEntries(
          Object.entries(get().slots).map(([id, slot]) => [id, slot.target]),
        )
        const characterId = placeSound(manifest, soundId, targets)
        if (characterId) get().setSound(characterId, soundId)
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

      applyBase(baseId) {
        const manifest = get().manifest
        if (!manifest) return
        const base = baseId ? manifest.bases?.find((b) => b.id === baseId) : undefined
        if (baseId && !base) return
        applyTargets(manifest, base?.sounds ?? {})
      },

      setTempo(bpm) {
        if (get().manifest) engine.setTempo(bpm)
      },

      nudgeTempo(delta) {
        get().setTempo(get().tempo.target + delta)
      },

      drop() {
        if (get().manifest) engine.queueDrop()
      },

      surprise() {
        const manifest = get().manifest
        if (!manifest) return
        const current = Object.fromEntries(
          Object.entries(get().slots).map(([id, slot]) => [id, slot.target]),
        )
        applyTargets(manifest, surpriseMix(manifest, current))
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
        engine.setTempo(mix.bpm ?? manifest.bpm)
        refreshAllSlots()
        return { missingCount }
      },

      getShareUrl() {
        return `${shareBaseUrl}#${encodeShareLink(engine.getMix())}`
      },

      async refreshSavedMixes() {
        try {
          set({ savedMixes: await repository.list() })
          return true
        } catch {
          set({ savedMixes: [] })
          if (get().phase === 'start') notify('error', 'storageError')
          return false
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
        const phase = get().phase
        if (phase === 'loading') return
        const fromHome = phase === 'start'
        if (fromHome) startLoading()
        // On a fresh visit, Web Audio must resume in the click, before the async lookup.
        const audioReady = fromHome ? tryUnlockAudio() : null
        let saved
        try {
          saved = await repository.get(id)
        } catch {
          if (fromHome) set({ phase: 'start' })
          notify('error', 'storageError')
          return
        }
        if (!fromHome && get().phase === 'loading') return
        if (!saved) {
          if (fromHome) set({ phase: 'start' })
          notify('error', 'mixNotFound')
          return
        }
        pendingSaved = saved
        if (audioReady && !(await audioReady)) {
          reportAudioBlocked(saved.mix.packId)
          return
        }
        await openOrResumePack(saved.mix.packId, !fromHome)
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
