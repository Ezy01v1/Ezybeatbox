import * as Tone from 'tone'
import { TypedEmitter } from '../events'
import { MIX_SCHEMA_VERSION, type Mix } from '../mix/types'
import { browserCanPlayType } from '../packs/browserFormats'
import { type CanPlayType, PackLoadError, pickSoundFile } from '../packs/loader'
import type { CharacterDef, PackManifest } from '../packs/schema'
import { AUDIO_CONFIG, clampVolumeDb } from './config'
import { DROP_BARS, type DropState, dropKeeps } from './drop'
import { clampTempo, playbackRateFor } from './tempo'
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
  /** `queued` right away; `dropping` and `idle` when heard. */
  dropChanged: { state: DropState }
  /** `bpm` is what is heard; `target` differs from it until the next bar line. */
  tempoChanged: { bpm: number; target: number }
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
  /**
   * Drop automation, between the players and the channel, so it never touches the user's
   * mute, solo or volume.
   */
  readonly dropGain: Tone.Gain
  /** Created on demand: any character can play any sound of the pack. */
  readonly players: Map<string, Tone.Player>
  playing: string | null
  target: string | null
  /** The chosen volume. Not read back from Tone: a muted channel reports -Infinity. */
  volumeDb: number
}

interface LoadedPack {
  readonly manifest: PackManifest
  readonly meter: MeterConfig
  readonly ticksPerBeat: number
  readonly slots: ReadonlyMap<string, Slot>
  readonly repeatId: number
  /** Decoded audio for every sound of the pack, shared by the players of all characters. */
  readonly buffers: ReadonlyMap<string, Tone.ToneAudioBuffer>
  readonly loopDuration: number
}

function levelOf(meter: Tone.Meter): number {
  const value = meter.getValue()
  return typeof value === 'number' ? value : Math.max(0, ...value)
}

/**
 * Framework-free audio engine. Owns the Tone.js graph:
 *
 *   Player(s) → Channel (per character, + Meter) → master Volume → Limiter → Meter → out
 *
 * Every sound change is applied on the next bar line from a transport callback, so timing
 * never depends on the main thread (no setTimeout/setInterval).
 */
export class AudioEngine {
  private readonly emitter = new TypedEmitter<AudioEngineEvents>()
  // A Volume, not a Channel: Tone's solo is global, so a master Channel would be muted
  // whenever any character is soloed (silencing everything).
  private readonly master: Tone.Volume
  private readonly limiter: Tone.Limiter
  private readonly masterMeter: Tone.Meter
  private readonly onContextStateChange = () =>
    this.emitter.emit('contextStateChanged', { state: this.contextState })
  private recorder: Tone.Recorder | null = null
  private masterVolumeDb: number = AUDIO_CONFIG.defaultMasterVolumeDb
  private pack: LoadedPack | null = null
  private loadToken = 0
  private playing = false
  private dropState: DropState = 'idle'
  /** Tempo being heard, and the one asked for (applied on the next bar line while playing). */
  private bpm = 0
  private targetBpm = 0

  constructor() {
    this.master = new Tone.Volume(AUDIO_CONFIG.defaultMasterVolumeDb)
    this.limiter = new Tone.Limiter(AUDIO_CONFIG.limiterThresholdDb)
    this.masterMeter = new Tone.Meter({ normalRange: true, smoothing: AUDIO_CONFIG.meterSmoothing })
    this.master.chain(this.limiter, Tone.getDestination())
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
    // iOS 17+ (Audio Session API): "playback" keeps Web Audio audible with the silent switch
    // on, like a music app. Other browsers do not expose it and ignore this.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'playback'
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
    for (const { sound } of sounds) {
      const buffer = buffers.get(sound.id)
      if (
        buffer &&
        Math.abs(buffer.duration - loopDuration) > AUDIO_CONFIG.loopLengthToleranceSeconds
      ) {
        warnings.push(
          `${sound.id}: ${buffer.duration.toFixed(3)}s, expected ${loopDuration.toFixed(3)}s`,
        )
      }
    }

    const slots = new Map<string, Slot>()
    for (const def of manifest.characters) {
      const channel = new Tone.Channel({ volume: AUDIO_CONFIG.defaultChannelVolumeDb })
      const channelMeter = new Tone.Meter({
        normalRange: true,
        smoothing: AUDIO_CONFIG.meterSmoothing,
      })
      const dropGain = new Tone.Gain(1).connect(channel)
      channel.connect(this.master)
      channel.connect(channelMeter)

      slots.set(def.id, {
        def,
        channel,
        meter: channelMeter,
        dropGain,
        players: new Map(),
        playing: null,
        target: null,
        volumeDb: AUDIO_CONFIG.defaultChannelVolumeDb,
      })
    }

    const transport = Tone.getTransport()
    transport.stop()
    transport.position = 0
    transport.bpm.value = manifest.bpm
    this.bpm = manifest.bpm
    this.targetBpm = manifest.bpm
    transport.timeSignature = quarterNotesPerBar(manifest.timeSignature)
    const ticksPerBeat = (transport.PPQ * 4) / manifest.timeSignature[1]
    const repeatId = transport.scheduleRepeat((time) => this.onBeat(time), `${ticksPerBeat}i`, 0)

    this.pack = { manifest, meter, ticksPerBeat, slots, repeatId, buffers, loopDuration }
    this.emitTempo()
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
    this.resetDrop(now)
    this.pack?.slots.forEach((slot) => {
      if (slot.playing !== null) {
        slot.players.get(slot.playing)?.stop(now)
        this.emitter.emit('soundStopped', { characterId: slot.def.id, soundId: slot.playing })
        slot.playing = null
      }
    })
    this.playing = false
    // Nothing is sounding, so a tempo still waiting for its bar line applies right away.
    if (this.pack && this.targetBpm !== this.bpm) this.applyTempoNow(this.pack)
    this.emitter.emit('transportChanged', { playing: false })
  }

  /**
   * Asks for a new tempo (clamped to the pack's range, see core/audio/tempo). While playing it
   * lands on the next bar line, like every other change; while stopped, right away.
   */
  setTempo(bpm: number): void {
    const pack = this.requirePack()
    const target = clampTempo(bpm, pack.manifest.bpm)
    if (target === this.targetBpm) return
    this.targetBpm = target
    if (this.playing) this.emitTempo()
    else this.applyTempoNow(pack)
  }

  /** The tempo asked for (what `getMix` saves), which may still be waiting for a bar line. */
  get tempo(): number {
    return this.targetBpm
  }

  /** Queues `soundId` on a character; it starts on the next bar line. */
  setSound(characterId: string, soundId: string): void {
    const slot = this.requireSlot(characterId)
    this.playerFor(slot, soundId)
    this.setTarget(slot, soundId)
  }

  /** Queues silence on a character; the current loop stops on the next bar line. */
  clearSound(characterId: string): void {
    this.setTarget(this.requireSlot(characterId), null)
  }

  /**
   * Queues a drop: from the next bar line, only characters playing a kick or bass sound keep
   * sounding for `DROP_BARS` bar(s), then everyone comes back. Ignored while stopped or while
   * another drop is queued or running. Returns whether it was queued.
   */
  queueDrop(): boolean {
    this.requirePack()
    if (!this.playing || this.dropState !== 'idle') return false
    this.setDropState('queued')
    return true
  }

  setMute(characterId: string, muted: boolean): void {
    const slot = this.requireSlot(characterId)
    slot.channel.mute = muted
    // Tone restores the pre-mute volume; apply any change made while muted.
    if (!muted) slot.channel.volume.rampTo(slot.volumeDb, AUDIO_CONFIG.volumeRampSeconds)
  }

  setSolo(characterId: string, solo: boolean): void {
    this.requireSlot(characterId).channel.solo = solo
  }

  setVolume(characterId: string, volumeDb: number): void {
    const slot = this.requireSlot(characterId)
    slot.volumeDb = clampVolumeDb(volumeDb)
    // While muted, Tone keeps the volume at -Infinity; the new value applies on unmute.
    if (slot.channel.mute) return
    slot.channel.volume.rampTo(slot.volumeDb, AUDIO_CONFIG.volumeRampSeconds)
  }

  setMasterVolume(volumeDb: number): void {
    this.masterVolumeDb = clampVolumeDb(volumeDb)
    this.master.volume.rampTo(this.masterVolumeDb, AUDIO_CONFIG.volumeRampSeconds)
  }

  getMeter(characterId: string): LevelReader {
    const { meter } = this.requireSlot(characterId)
    return { getLevel: () => levelOf(meter) }
  }

  getMasterMeter(): LevelReader {
    return { getLevel: () => levelOf(this.masterMeter) }
  }

  /** Whether this browser can record the master output (MediaRecorder). */
  get canRecord(): boolean {
    return Tone.Recorder.supported
  }

  /**
   * Starts recording the master output (after the limiter, so it matches what is heard).
   * MediaRecorder is not sample-accurate: callers start it on a bar event.
   */
  async startRecording(): Promise<void> {
    if (!this.recorder) {
      this.recorder = new Tone.Recorder()
      this.limiter.connect(this.recorder)
    }
    await this.recorder.start()
  }

  /** Stops recording; the Blob's type is the browser's codec (WebM/Opus, or MP4 in Safari). */
  async stopRecording(): Promise<Blob> {
    if (!this.recorder || this.recorder.state !== 'started') {
      throw new AudioEngineError('Not recording')
    }
    return this.recorder.stop()
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
      volumeDb: slot.volumeDb,
    }
  }

  /** Serializable snapshot of the current selection (targets, not what is audible yet). */
  getMix(): Mix {
    const { manifest, slots } = this.requirePack()
    return {
      schemaVersion: MIX_SCHEMA_VERSION,
      packId: manifest.id,
      packVersion: manifest.version,
      masterVolumeDb: this.masterVolumeDb,
      ...(this.targetBpm !== manifest.bpm ? { bpm: this.targetBpm } : {}),
      characters: Object.fromEntries(
        [...slots.values()].map((slot) => [
          slot.def.id,
          {
            soundId: slot.target,
            muted: slot.channel.mute,
            solo: slot.channel.solo,
            volumeDb: slot.volumeDb,
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
    this.recorder?.dispose()
    this.masterMeter.dispose()
    this.limiter.dispose()
    this.master.dispose()
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
    // Offsets are in file time, so they use the pack's own tempo whatever is heard.
    const offset = loopOffsetAtBar(bar, pack.manifest.loopBars, pack.meter)
    if (this.targetBpm !== this.bpm) this.applyTempoAtBar(pack, time, offset)
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

    if (this.dropState === 'queued') this.startDrop(pack, time)
  }

  /** Silences every character outside `dropKeeps` for `DROP_BARS`, from `time` (a bar line). */
  private startDrop(pack: LoadedPack, time: number): void {
    const playing = Object.fromEntries([...pack.slots].map(([id, slot]) => [id, slot.playing]))
    const keep = dropKeeps(pack.manifest, playing)
    const end = time + loopSeconds({ ...pack.meter, bpm: this.bpm }, DROP_BARS)
    const fade = AUDIO_CONFIG.dropFadeSeconds
    for (const [id, { dropGain }] of pack.slots) {
      if (keep.has(id)) continue
      const gain = dropGain.gain
      gain.cancelScheduledValues(time)
      gain.setValueAtTime(1, time)
      gain.linearRampToValueAtTime(0, time + fade)
      gain.setValueAtTime(0, end - fade)
      gain.linearRampToValueAtTime(1, end)
    }
    this.dropState = 'dropping'
    Tone.getDraw().schedule(() => this.emitter.emit('dropChanged', { state: 'dropping' }), time)
    Tone.getDraw().schedule(() => this.setDropState('idle'), end)
  }

  /**
   * New tempo from the bar line at `time`: the transport speeds up or slows down, and every loop
   * that keeps playing restarts there at its phase with the new playback rate, so nothing drifts.
   * (Tone applies a Player's rate as soon as it is set, so the old loop hears it a look-ahead
   * early; restarting at the bar line is what keeps the phase exact.) Loops that change on this
   * bar are started by the transitions right after, already at the new rate.
   */
  private applyTempoAtBar(pack: LoadedPack, time: number, offset: number): void {
    Tone.getTransport().bpm.setValueAtTime(this.targetBpm, time)
    this.bpm = this.targetBpm
    const rate = playbackRateFor(this.bpm, pack.manifest.bpm)
    for (const slot of pack.slots.values()) {
      slot.players.forEach((player) => (player.playbackRate = rate))
      if (slot.playing !== null && slot.playing === slot.target) {
        slot.players.get(slot.playing)?.start(time, offset)
      }
    }
    Tone.getDraw().schedule(() => this.emitTempo(), time)
  }

  /** New tempo while stopped: nothing is sounding, so it applies at once. */
  private applyTempoNow(pack: LoadedPack): void {
    Tone.getTransport().bpm.value = this.targetBpm
    this.bpm = this.targetBpm
    const rate = playbackRateFor(this.bpm, pack.manifest.bpm)
    pack.slots.forEach((slot) => slot.players.forEach((player) => (player.playbackRate = rate)))
    this.emitTempo()
  }

  private emitTempo(): void {
    this.emitter.emit('tempoChanged', { bpm: this.bpm, target: this.targetBpm })
  }

  /** Cancels a queued or running drop and brings every character back at `time`. */
  private resetDrop(time: number): void {
    this.pack?.slots.forEach(({ dropGain }) => {
      dropGain.gain.cancelScheduledValues(time)
      dropGain.gain.setValueAtTime(1, time)
    })
    this.setDropState('idle')
  }

  private setDropState(state: DropState): void {
    if (this.dropState === state) return
    this.dropState = state
    this.emitter.emit('dropChanged', { state })
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

  /** The character's player for `soundId`, created the first time that sound lands on it. */
  private playerFor(slot: Slot, soundId: string): Tone.Player {
    const existing = slot.players.get(soundId)
    if (existing) return existing
    const pack = this.requirePack()
    const buffer = pack.buffers.get(soundId)
    if (!buffer) throw new AudioEngineError(`Unknown sound "${soundId}"`)
    const player = new Tone.Player({
      url: buffer,
      loop: true,
      // Loop length always comes from the tempo, never from the file, so encoder padding
      // or a slightly long recording cannot drift out of sync.
      loopStart: 0,
      loopEnd: pack.loopDuration,
      playbackRate: playbackRateFor(this.bpm, pack.manifest.bpm),
      fadeIn: AUDIO_CONFIG.playerFadeSeconds,
      fadeOut: AUDIO_CONFIG.playerFadeSeconds,
    }).connect(slot.dropGain)
    slot.players.set(soundId, player)
    return player
  }

  private disposePack(): void {
    const pack = this.pack
    if (!pack) return
    Tone.getTransport().clear(pack.repeatId)
    pack.slots.forEach((slot) => {
      slot.players.forEach((player) => player.dispose())
      slot.meter.dispose()
      slot.dropGain.dispose()
      slot.channel.dispose()
    })
    pack.buffers.forEach((buffer) => buffer.dispose())
    this.pack = null
    this.setDropState('idle')
  }
}
