import type { AudioEngineEvents, ContextState, SlotSnapshot } from '@/core/audio/AudioEngine'
import { AUDIO_CONFIG } from '@/core/audio/config'
import { planBarTransitions, slotStatus } from '@/core/audio/transitions'
import { TypedEmitter } from '@/core/events'
import { MIX_SCHEMA_VERSION, type Mix } from '@/core/mix/types'
import type { PackManifest } from '@/core/packs/schema'
import type { EngineLike } from './appStore'

interface FakeSlot {
  playing: string | null
  target: string | null
  muted: boolean
  solo: boolean
  volumeDb: number
}

/**
 * In-memory engine for UI tests: same events and quantization rules as `AudioEngine`, but
 * bars only advance when a test calls `advanceBar()`.
 */
export class FakeEngine implements EngineLike {
  private readonly emitter = new TypedEmitter<AudioEngineEvents>()
  private readonly slots = new Map<string, FakeSlot>()
  private manifest: PackManifest | null = null
  private bar = -1
  private masterVolumeDb: number = AUDIO_CONFIG.defaultMasterVolumeDb
  contextState: ContextState = 'suspended'
  isPlaying = false
  failLoad: Error | null = null
  failUnlock = false
  /** Packs requested via loadPack, for assertions. */
  loadedPackUrls: string[] = []

  canRecord = true
  recording = false

  /** Level returned by every meter; tests set it to simulate sound. */
  level = 0
  beatPosition = 0

  readonly on = this.emitter.on.bind(this.emitter)

  async unlock() {
    if (this.failUnlock) throw new Error('blocked')
    this.contextState = 'running'
  }

  async loadPack(
    manifest: PackManifest,
    packUrl: string,
    options?: { onProgress?: (p: number) => void },
  ) {
    this.loadedPackUrls.push(packUrl)
    // Like the real engine: loading a pack stops whatever was playing.
    if (this.isPlaying) this.stop()
    if (this.failLoad) throw this.failLoad
    options?.onProgress?.(0.5)
    this.manifest = manifest
    for (const c of manifest.characters) {
      this.slots.set(c.id, {
        playing: null,
        target: null,
        muted: false,
        solo: false,
        volumeDb: AUDIO_CONFIG.defaultChannelVolumeDb,
      })
    }
    options?.onProgress?.(1)
    return { warnings: [] }
  }

  async start() {
    this.isPlaying = true
    this.bar = -1
    this.emitter.emit('transportChanged', { playing: true })
  }

  stop() {
    this.isPlaying = false
    this.slots.forEach((slot) => (slot.playing = null))
    this.emitter.emit('transportChanged', { playing: false })
  }

  setSound(characterId: string, soundId: string) {
    this.setTarget(characterId, soundId)
  }

  clearSound(characterId: string) {
    this.setTarget(characterId, null)
  }

  setMute(characterId: string, muted: boolean) {
    this.slot(characterId).muted = muted
  }

  setSolo(characterId: string, solo: boolean) {
    this.slot(characterId).solo = solo
  }

  setVolume(characterId: string, volumeDb: number) {
    this.slot(characterId).volumeDb = volumeDb
  }

  setMasterVolume(volumeDb: number) {
    this.masterVolumeDb = volumeDb
  }

  getSlot(characterId: string): SlotSnapshot {
    const slot = this.slot(characterId)
    return { characterId, ...slot, status: slotStatus(slot) }
  }

  getMix(): Mix {
    if (!this.manifest) throw new Error('No pack loaded')
    return {
      schemaVersion: MIX_SCHEMA_VERSION,
      packId: this.manifest.id,
      packVersion: this.manifest.version,
      masterVolumeDb: this.masterVolumeDb,
      characters: Object.fromEntries(
        [...this.slots].map(([id, s]) => [
          id,
          { soundId: s.target, muted: s.muted, solo: s.solo, volumeDb: s.volumeDb },
        ]),
      ),
    }
  }

  getMeter() {
    return { getLevel: () => this.level }
  }

  getMasterMeter() {
    return { getLevel: () => this.level }
  }

  getBeatClock() {
    return { beatsPerBar: 4, getBeatPosition: () => (this.isPlaying ? this.beatPosition : null) }
  }

  getOutputLatency() {
    return 0
  }

  async startRecording() {
    this.recording = true
  }

  async stopRecording() {
    this.recording = false
    return new Blob(['fake audio'], { type: 'audio/webm' })
  }

  /**
   * Simulates the next bar line: applies queued changes and emits the engine events. With
   * `dropSlotEvents`, the start/stop events are lost (as Tone.Draw does when it runs too late).
   */
  advanceBar({ dropSlotEvents = false } = {}) {
    this.bar++
    const states = [...this.slots].map(([characterId, s]) => ({ characterId, ...s }))
    for (const { characterId, from, to } of planBarTransitions(states)) {
      this.slot(characterId).playing = to
      if (dropSlotEvents) continue
      if (from) this.emitter.emit('soundStopped', { characterId, soundId: from })
      if (to) this.emitter.emit('soundStarted', { characterId, soundId: to })
    }
    this.emitter.emit('barStart', { bar: this.bar })
    this.emitter.emit('beat', { bar: this.bar, beat: 0 })
  }

  private setTarget(characterId: string, target: string | null) {
    const slot = this.slot(characterId)
    if (slot.target === target) return
    slot.target = target
    this.emitter.emit('soundQueued', { characterId, soundId: target, status: slotStatus(slot) })
  }

  private slot(characterId: string): FakeSlot {
    const slot = this.slots.get(characterId)
    if (!slot) throw new Error(`Unknown character ${characterId}`)
    return slot
  }
}
