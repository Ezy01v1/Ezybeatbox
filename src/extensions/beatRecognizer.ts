/**
 * EXTENSION POINT — beatbox recognition. Not implemented yet (Phase 5 defines the contract only).
 *
 * Pipeline: mic stream → `BeatRecognizer` (onset detection + classification) → timed `BeatHit`s
 * → `PatternQuantizer` (snap to the bar grid) → `BeatPattern` → `PatternRenderer` (one-shots)
 * → a loop that becomes a `UserSound`. See docs/EXTENSIONS.md.
 */
import type { TimeSignature } from '@/core/audio/timing'
import type { CharacterRole } from '@/core/packs/schema'

/** Sound classes the recognizer can output. Grows as the model learns more techniques. */
export type BeatboxSoundClass =
  'kick' | 'snare' | 'hihat-closed' | 'hihat-open' | 'bass' | 'click' | 'vocal' | 'unknown'

/** Which character each class feeds when a pattern is turned into loops. */
export const BEATBOX_CLASS_TO_ROLE = {
  kick: 'kick',
  snare: 'snare',
  'hihat-closed': 'hihat',
  'hihat-open': 'hihat',
  bass: 'bass',
  vocal: 'voice',
  click: 'fx',
} as const satisfies Partial<Record<BeatboxSoundClass, CharacterRole>>

export interface BeatHit {
  class: BeatboxSoundClass
  /** AudioContext time of the onset, input latency already subtracted. */
  time: number
  /** 0–1 classifier confidence. */
  confidence: number
  /** 0–1 loudness of the hit. */
  velocity: number
}

export type BeatRecognizerState = 'idle' | 'loading-model' | 'listening' | 'error'

export interface BeatRecognizerEvents {
  hit: BeatHit
  stateChanged: { state: BeatRecognizerState }
}

export interface BeatRecognizer {
  readonly state: BeatRecognizerState
  /** Starts analysing a mic stream (use `LOOP_RECORDER_MIC_CONSTRAINTS`). */
  start(stream: MediaStream): Promise<void>
  stop(): void
  on<K extends keyof BeatRecognizerEvents>(
    event: K,
    listener: (payload: BeatRecognizerEvents[K]) => void,
  ): () => void
  dispose(): void
}

export interface PatternStep {
  /** Index on the grid, 0 … bars × stepsPerBar − 1. */
  step: number
  class: BeatboxSoundClass
  velocity: number
}

export interface BeatPattern {
  bars: number
  /** 16 for a 16th-note grid in 4/4. */
  stepsPerBar: number
  steps: PatternStep[]
}

export interface QuantizeWindow {
  /** AudioContext time where bar 1 of the take starts. */
  startTime: number
  bpm: number
  timeSignature: TimeSignature
  bars: number
  stepsPerBar: number
  /** Hits below this confidence are ignored. */
  minConfidence: number
}

export interface PatternQuantizer {
  quantize(hits: readonly BeatHit[], window: QuantizeWindow): BeatPattern
}

/** Renders a pattern into an exact-length loop using one-shot samples (offline). */
export interface PatternRenderer {
  render(
    pattern: BeatPattern,
    oneShots: Partial<Record<BeatboxSoundClass, AudioBuffer>>,
    meter: { bpm: number; timeSignature: TimeSignature },
  ): Promise<AudioBuffer>
}
