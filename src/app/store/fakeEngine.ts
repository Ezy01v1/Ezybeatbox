import type { AudioEngineEvents, ContextState, SlotSnapshot } from '@/core/audio/AudioEngine'
import { planBarTransitions, slotStatus } from '@/core/audio/transitions'
import { TypedEmitter } from '@/core/events'
import type { PackManifest } from '@/core/packs/schema'
import type { EngineLike } from './appStore'

interface FakeSlot {
  playing: string | null
  target: string | null
  muted: boolean
  solo: boolean
}

/**
 * In-memory engine for UI tests: same events and quantization rules as `AudioEngine`, but
 * bars only advance when a test calls `advanceBar()`.
 */
export class FakeEngine implements EngineLike {
  private readonly emitter = new TypedEmitter<AudioEngineEvents>()
  private readonly slots = new Map<string, FakeSlot>()
  private bar = -1
  contextState: ContextState = 'suspended'
  isPlaying = false
  failLoad: Error | null = null
  failUnlock = false

  readonly on = this.emitter.on.bind(this.emitter)

  async unlock() {
    if (this.failUnlock) throw new Error('blocked')
    this.contextState = 'running'
  }

  async loadPack(
    manifest: PackManifest,
    _packUrl: string,
    options?: { onProgress?: (p: number) => void },
  ) {
    if (this.failLoad) throw this.failLoad
    options?.onProgress?.(0.5)
    for (const c of manifest.characters) {
      this.slots.set(c.id, { playing: null, target: null, muted: false, solo: false })
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

  setMasterVolume() {}

  getSlot(characterId: string): SlotSnapshot {
    const slot = this.slot(characterId)
    return { characterId, ...slot, status: slotStatus(slot), volumeDb: -6 }
  }

  getMeter() {
    return { getLevel: () => this.level }
  }

  getMasterMeter() {
    return { getLevel: () => this.level }
  }

  /** Level returned by every meter; tests set it to simulate sound. */
  level = 0

  getBeatClock() {
    return { beatsPerBar: 4, getBeatPosition: () => (this.isPlaying ? this.beatPosition : null) }
  }

  beatPosition = 0

  getOutputLatency() {
    return 0
  }

  /** Simulates the next bar line: applies queued changes and emits the engine events. */
  advanceBar() {
    this.bar++
    const states = [...this.slots].map(([characterId, s]) => ({ characterId, ...s }))
    for (const { characterId, from, to } of planBarTransitions(states)) {
      this.slot(characterId).playing = to
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
