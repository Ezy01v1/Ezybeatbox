/**
 * EXTENSION POINT — Loop Station. Not implemented yet (Phase 5 defines the contract only).
 *
 * Records the user's voice in sync with the transport and returns a loop that becomes a
 * `UserSound`. Behind an interface so a native implementation (Capacitor plugin with Oboe /
 * AVAudioEngine, for low latency) can replace the Web Audio one. See docs/EXTENSIONS.md.
 */
import type { LevelReader } from '@/core/audio/AudioEngine'
import type { TimeSignature } from '@/core/audio/timing'

/**
 * Microphone constraints for beatbox: the raw signal. Browser "call" processing (echo
 * cancellation, noise suppression, auto gain) destroys transients and pumps the level.
 */
export const LOOP_RECORDER_MIC_CONSTRAINTS = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  },
  video: false,
} as const satisfies MediaStreamConstraints

export interface LoopRecordingOptions {
  /** Length of the take in bars; normally the pack's `loopBars`. */
  bars: number
  /** Metronome bars before recording; 0 starts on the next loop boundary. */
  countInBars: number
  /**
   * Seconds to shift the take earlier: input + output latency (round trip). Comes from
   * `LatencyCalibrator` or a manual setting saved per device.
   */
  latencyCompensationSeconds: number
}

export type LoopRecorderState =
  | 'idle'
  | 'requesting-mic'
  | 'armed'
  | 'waiting-for-loop'
  | 'counting-in'
  | 'recording'
  | 'processing'

export interface RecordedLoop {
  /** Exactly `bars` long at `bpm`: trimmed to the bar grid, latency-compensated. */
  audio: AudioBuffer
  bars: number
  bpm: number
  timeSignature: TimeSignature
  /** 0–1. Near 1 means clipping; near 0 means the mic picked up nothing. */
  peak: number
}

export interface LoopRecorderEvents {
  stateChanged: { state: LoopRecorderState }
  /** Fires on each recorded bar, for a "2/4" style progress indicator. */
  barRecorded: { barsDone: number; barsTotal: number }
}

export type LoopRecorderErrorKind =
  'mic-denied' | 'mic-unavailable' | 'transport-stopped' | 'cancelled'

export interface LoopRecorder {
  readonly state: LoopRecorderState
  /** Requests the mic with `LOOP_RECORDER_MIC_CONSTRAINTS`. Call from a user gesture. */
  arm(): Promise<void>
  /** Live mic level for a VU meter (read it in the animation loop). */
  getInputLevel(): LevelReader
  /**
   * Records one take aligned to the running transport. Rejects with a
   * `LoopRecorderErrorKind` reason if the mic fails, playback stops or `cancel()` is called.
   */
  record(options: LoopRecordingOptions): Promise<RecordedLoop>
  cancel(): void
  on<K extends keyof LoopRecorderEvents>(
    event: K,
    listener: (payload: LoopRecorderEvents[K]) => void,
  ): () => void
  /** Stops the mic tracks and frees audio nodes. */
  dispose(): void
}

/** Measures round-trip latency: plays clicks, records them through the mic, detects onsets. */
export interface LatencyCalibrator {
  measureRoundTrip(): Promise<{ seconds: number; confidence: number }>
}
