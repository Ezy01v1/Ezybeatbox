import * as Tone from 'tone'
import { TypedEmitter } from '../events'
import { MIX_SCHEMA_VERSION, type Mix } from '../mix/types'
import { browserCanPlayType } from '../packs/browserFormats'
import { type CanPlayType, PackLoadError, pickSoundFile } from '../packs/loader'
import type { CharacterDef, PackManifest } from '../packs/schema'
import { AUDIO_CONFIG, clampVolumeDb } from './config'
import { type MeterConfig, loopOffsetAtBar, loopSeconds, quarterNotesPerBar } from './timing'
import { type SlotStatus, planBarTransitions, slotStatus } from './transitions'

export type ContextState = 'suspended' | 'running' | 'closed' | 'interrupted'

export interface SlotSnapshot {
  characterId: string
  playing: string | null
  target: string | null
  status: SlotStatus
  muted: boolean
  solo: boolean
  volumeDb: number
}

/**
 * Engine events. `soundStarted`/`soundStopped`/`barStart`/`beat` are emitted when the change
 * becomes audible (via `Tone.Draw`), not when it is scheduled.
 */
export interface AudioEngineEvents extends Record<string, unknown> {
  soundQueued: { characterId: string; soundId: string | null; status: SlotStatus }
  soundStarted: { characterId: string; soundId: string }
  soundStopped: { characterId: string; soundId: string }
  barStart: { bar: number }
  beat: { bar: number; beat: number }
  transportChanged: { playing: boolean }
  contextStateChanged: { state: ContextState }
}

/** Live 0–1 level reader. Read it from `requestAnimationFrame`, never from React state. */
export interface LevelReader {
  getLevel(): number
}

/** Live musical position for animation. Read it from `requestAnimationFrame`. */
export interface BeatClock {
  /**
   * Fractional beats since bar 1 at the moment the listener hears it (output latency already
   * subtracted), or `null` while stopped. `Math.floor` gives the beat, the fraction its phase.
   */
  getBeatPosition(): number | null
  readonly beatsPerBar: number
}

export interface LoadPackOptions {
  /** Called with 0–1 as samples finish decoding. */
  onProgress?: (progress: number) => void
  canPlayType?: CanPlayType
}

export interface LoadPackResult {
  /** Non-fatal problems, e.g. a sample whose length does not match the loop length. */
  warnings: string[]
}

export class AudioEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AudioEngineError'
  }
}

interface Slot {
  readonly def: CharacterDef
  readonly channel: Tone.Channel
  readonly meter: Tone.Meter
  readonly players: ReadonlyMap<string, Tone.Player>
  playing: string | null
  target: string | null
}

interface LoadedPack {
  readonly manifest: PackManifest
  readonly meter: MeterConfig
  readonly ticksPerBeat: number
  readonly slots: ReadonlyMap<string, Slot>
  readonly repeatId: number
}

function levelOf(meter: Tone.Meter): number {
  const value = meter.getValue()
  return typeof value === 'number' ? value : Math.max(0, ...value)
}

/**
 * Framework-free audio engine. Owns the Tone.js graph:
 *
 *   Player(s) → Channel (per character, + Meter) → master Channel → Limiter → Meter → out
 *
 * Every sound change is applied on the next bar line from a transport callback, so timing
 * never depends on the main thread (no setTimeout/setInterval).
 */
export class AudioEngine {
  private readonly emitter = new TypedEmitter<AudioEngineEvents>()
  private readonly masterChannel: Tone.Channel
  private readonly limiter: Tone.Limiter
  private readonly masterMeter: Tone.Meter
  private readonly onContextStateChange = () =>
    this.emitter.emit('contextStateChanged', { state: this.contextState })
  private pack: LoadedPack | null = null
  private loadToken = 0
  private playing = false

  constructor() {
    this.masterChannel = new Tone.Channel({ volume: AUDIO_CONFIG.defaultMasterVolumeDb })
    this.limiter = new Tone.Limiter(AUDIO_CONFIG.limiterThresholdDb)
    this.masterMeter = new Tone.Meter({ normalRange: true, smoothing: AUDIO_CONFIG.meterSmoothing })
    this.masterChannel.chain(this.limiter, Tone.getDestination())
    this.limiter.connect(this.masterMeter)
    Tone.getContext().on('statechange', this.onContextStateChange)
  }

  readonly on = this.emitter.on.bind(this.emitter)

  get contextState(): ContextState {
    return Tone.getContext().state as ContextState
  }

  get isPlaying(): boolean {
    return this.playing
  }

  get manifest(): PackManifest | null {
    return this.pack?.manifest ?? null
  }

  /** Resumes the AudioContext. Must be called from a user gesture (tap/click/key). */
  async unlock(): Promise<void> {
    await Tone.start()
  }

  async loadPack(
    manifest: PackManifest,
    packUrl: string,
    options: LoadPackOptions = {},
  ): Promise<LoadPackResult> {
    const token = ++this.loadToken
    const canPlayType = options.canPlayType ?? browserCanPlayType()
    this.stop()
    this.disposePack()

    const sounds = manifest.characters.flatMap((character) =>
      character.sounds.map((sound) => ({
        sound,
        url: `${packUrl}${pickSoundFile(sound, canPlayType)}`,
      })),
    )

    let loaded = 0
    options.onProgress?.(0)
    const results = await Promise.allSettled(
      sounds.map(async ({ sound, url }) => {
        const buffer = await Tone.ToneAudioBuffer.fromUrl(url)
        options.onProgress?.(++loaded / sounds.length)
        return [sound.id, buffer] as const
      }),
    )

    const buffers = new Map<string, Tone.ToneAudioBuffer>()
    const failed: string[] = []
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') buffers.set(result.value[0], result.value[1])
      else failed.push(sounds[i]?.url ?? '?')
    })

    if (token !== this.loadToken) {
      // A newer loadPack call superseded this one.
      buffers.forEach((buffer) => buffer.dispose())
      throw new AudioEngineError('Pack load was superseded by a newer request')
    }
    if (failed.length > 0) {
      buffers.forEach((buffer) => buffer.dispose())
      throw new PackLoadError('audio', 'Some samples could not be loaded', failed)
    }

    const meter: MeterConfig = { bpm: manifest.bpm, timeSignature: manifest.timeSignature }
    const loopDuration = loopSeconds(meter, manifest.loopBars)
    const warnings: string[] = []

    const slots = new Map<string, Slot>()
    for (const def of manifest.characters) {
      const channel = new Tone.Channel({ volume: AUDIO_CONFIG.defaultChannelVolumeDb })
      const channelMeter = new Tone.Meter({
        normalRange: true,
        smoothing: AUDIO_CONFIG.meterSmoothing,
      })
      channel.connect(this.masterChannel)
      channel.connect(channelMeter)

      const players = new Map<string, Tone.Player>()
      for (const sound of def.sounds) {
        const buffer = buffers.get(sound.id)
        if (!buffer) continue
        if (Math.abs(buffer.duration - loopDuration) > AUDIO_CONFIG.loopLengthToleranceSeconds) {
          warnings.push(
            `${sound.id}: ${buffer.duration.toFixed(3)}s, expected ${loopDuration.toFixed(3)}s`,
          )
        }
        const player = new Tone.Player({
          url: buffer,
          loop: true,
          // Loop length always comes from the tempo, never from the file, so encoder padding
          // or a slightly long recording cannot drift out of sync.
          loopStart: 0,
          loopEnd: loopDuration,
          fadeIn: AUDIO_CONFIG.playerFadeSeconds,
          fadeOut: AUDIO_CONFIG.playerFadeSeconds,
        }).connect(channel)
        players.set(sound.id, player)
      }

      slots.set(def.id, { def, channel, meter: channelMeter, players, playing: null, target: null })
    }

    const transport = Tone.getTransport()
    transport.stop()
    transport.position = 0
    transport.bpm.value = manifest.bpm
    transport.timeSignature = quarterNotesPerBar(manifest.timeSignature)
    const ticksPerBeat = (transport.PPQ * 4) / manifest.timeSignature[1]
    const repeatId = transport.scheduleRepeat((time) => this.onBeat(time), `${ticksPerBeat}i`, 0)

    this.pack = { manifest, meter, ticksPerBeat, slots, repeatId }
    return { warnings }
  }

  /** Starts the transport from bar 1. Queued sounds enter on the first bar. */
  async start(): Promise<void> {
    this.requirePack()
    if (this.playing) return
    await this.unlock()
    Tone.getTransport().start(Tone.now() + AUDIO_CONFIG.startDelaySeconds, 0)
    this.playing = true
    this.emitter.emit('transportChanged', { playing: true })
  }

  /** Stops everything immediately. Selected sounds stay selected and restart on `start()`. */
  stop(): void {
    if (!this.playing) return
    const now = Tone.now()
    Tone.getTransport().stop(now)
    Tone.getDraw().cancel(0)
    this.pack?.slots.forEach((slot) => {
      if (slot.playing !== null) {
        slot.players.get(slot.playing)?.stop(now)
        this.emitter.emit('soundStopped', { characterId: slot.def.id, soundId: slot.playing })
        slot.playing = null
      }
    })
    this.playing = false
    this.emitter.emit('transportChanged', { playing: false })
  }

  /** Queues `soundId` on a character; it starts on the next bar line. */
  setSound(characterId: string, soundId: string): void {
    const slot = this.requireSlot(characterId)
    if (!slot.players.has(soundId)) {
      throw new AudioEngineError(`Unknown sound "${soundId}" for character "${characterId}"`)
    }
    this.setTarget(slot, soundId)
  }

  /** Queues silence on a character; the current loop stops on the next bar line. */
  clearSound(characterId: string): void {
    this.setTarget(this.requireSlot(characterId), null)
  }

  setMute(characterId: string, muted: boolean): void {
    this.requireSlot(characterId).channel.mute = muted
  }

  setSolo(characterId: string, solo: boolean): void {
    this.requireSlot(characterId).channel.solo = solo
  }

  setVolume(characterId: string, volumeDb: number): void {
    this.requireSlot(characterId).channel.volume.rampTo(
      clampVolumeDb(volumeDb),
      AUDIO_CONFIG.volumeRampSeconds,
    )
  }

  setMasterVolume(volumeDb: number): void {
    this.masterChannel.volume.rampTo(clampVolumeDb(volumeDb), AUDIO_CONFIG.volumeRampSeconds)
  }

  getMeter(characterId: string): LevelReader {
    const { meter } = this.requireSlot(characterId)
    return { getLevel: () => levelOf(meter) }
  }

  getMasterMeter(): LevelReader {
    return { getLevel: () => levelOf(this.masterMeter) }
  }

  /**
   * Seconds between the audio graph and the listener's ears (bigger on Bluetooth). Meters read
   * the graph, so visuals delay levels by this much to line up with what is heard.
   */
  getOutputLatency(): number {
    // Not every browser exposes these (Safari lacks outputLatency); fall back to 0.
    const raw = Tone.getContext().rawContext as { outputLatency?: number; baseLatency?: number }
    return (raw.outputLatency ?? 0) + (raw.baseLatency ?? 0)
  }

  getBeatClock(): BeatClock {
    const pack = this.requirePack()
    return {
      beatsPerBar: pack.manifest.timeSignature[0],
      getBeatPosition: () => {
        if (!this.playing || this.pack !== pack) return null
        const heardAt = Tone.immediate() - this.getOutputLatency()
        const ticks = Tone.getTransport().getTicksAtTime(heardAt)
        return ticks > 0 ? ticks / pack.ticksPerBeat : null
      },
    }
  }

  getSlot(characterId: string): SlotSnapshot {
    const slot = this.requireSlot(characterId)
    return {
      characterId,
      playing: slot.playing,
      target: slot.target,
      status: slotStatus(slot),
      muted: slot.channel.mute,
      solo: slot.channel.solo,
      volumeDb: slot.channel.volume.value,
    }
  }

  /** Serializable snapshot of the current selection (targets, not what is audible yet). */
  getMix(): Mix {
    const { manifest, slots } = this.requirePack()
    return {
      schemaVersion: MIX_SCHEMA_VERSION,
      packId: manifest.id,
      packVersion: manifest.version,
      masterVolumeDb: this.masterChannel.volume.value,
      characters: Object.fromEntries(
        [...slots.values()].map((slot) => [
          slot.def.id,
          {
            soundId: slot.target,
            muted: slot.channel.mute,
            solo: slot.channel.solo,
            volumeDb: slot.channel.volume.value,
          },
        ]),
      ),
    }
  }

  dispose(): void {
    this.loadToken++
    this.stop()
    this.disposePack()
    Tone.getContext().off('statechange', this.onContextStateChange)
    this.masterMeter.dispose()
    this.limiter.dispose()
    this.masterChannel.dispose()
    this.emitter.clear()
  }

  private setTarget(slot: Slot, target: string | null): void {
    if (slot.target === target) return
    slot.target = target
    this.emitter.emit('soundQueued', {
      characterId: slot.def.id,
      soundId: target,
      status: slotStatus(slot),
    })
  }

  /** Transport callback, runs slightly ahead of `time` (Tone's look-ahead). */
  private onBeat(time: number): void {
    const pack = this.pack
    if (!pack) return
    const beatsPerBar = pack.manifest.timeSignature[0]
    const beatIndex = Math.round(Tone.getTransport().getTicksAtTime(time) / pack.ticksPerBeat)
    const bar = Math.floor(beatIndex / beatsPerBar)
    const beat = beatIndex % beatsPerBar

    if (beat === 0) this.applyBarTransitions(pack, bar, time)

    Tone.getDraw().schedule(() => {
      if (beat === 0) this.emitter.emit('barStart', { bar })
      this.emitter.emit('beat', { bar, beat })
    }, time)
  }

  private applyBarTransitions(pack: LoadedPack, bar: number, time: number): void {
    const offset = loopOffsetAtBar(bar, pack.manifest.loopBars, pack.meter)
    const slotStates = [...pack.slots.values()].map((slot) => ({
      characterId: slot.def.id,
      playing: slot.playing,
      target: slot.target,
    }))

    for (const { characterId, from, to } of planBarTransitions(slotStates)) {
      const slot = pack.slots.get(characterId)
      if (!slot) continue
      if (from !== null) slot.players.get(from)?.stop(time)
      if (to !== null) slot.players.get(to)?.start(time, offset)
      slot.playing = to

      Tone.getDraw().schedule(() => {
        if (from !== null) this.emitter.emit('soundStopped', { characterId, soundId: from })
        if (to !== null) this.emitter.emit('soundStarted', { characterId, soundId: to })
      }, time)
    }
  }

  private requirePack(): LoadedPack {
    if (!this.pack) throw new AudioEngineError('No pack loaded')
    return this.pack
  }

  private requireSlot(characterId: string): Slot {
    const slot = this.requirePack().slots.get(characterId)
    if (!slot) throw new AudioEngineError(`Unknown character "${characterId}"`)
    return slot
  }

  private disposePack(): void {
    const pack = this.pack
    if (!pack) return
    Tone.getTransport().clear(pack.repeatId)
    pack.slots.forEach((slot) => {
      slot.players.forEach((player) => {
        player.buffer.dispose()
        player.dispose()
      })
      slot.meter.dispose()
      slot.channel.dispose()
    })
    this.pack = null
  }
}
