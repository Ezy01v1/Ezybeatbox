import type { LevelReader } from '@/core/audio/AudioEngine'
import { VISUAL_CONFIG } from './config'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Maps a raw 0–1 meter value to a visually useful 0–1 range. */
export function normalizeLevel(raw: number): number {
  return clamp01(Math.sqrt(Math.max(0, raw)) * VISUAL_CONFIG.levelGain)
}

/** One step of an attack/release envelope follower. */
export function followLevel(
  previous: number,
  target: number,
  deltaSeconds: number,
  attackSeconds: number = VISUAL_CONFIG.levelAttackSeconds,
  releaseSeconds: number = VISUAL_CONFIG.levelReleaseSeconds,
): number {
  if (deltaSeconds <= 0) return previous
  const tau = target > previous ? attackSeconds : releaseSeconds
  return previous + (target - previous) * (1 - Math.exp(-deltaSeconds / tau))
}

/** Remembers recent values so they can be read back "as of" an earlier time. */
export class DelayLine {
  private readonly times: number[] = []
  private readonly values: number[] = []
  private readonly maxAgeSeconds: number

  constructor(maxAgeSeconds = 1) {
    this.maxAgeSeconds = maxAgeSeconds
  }

  push(timeSeconds: number, value: number): void {
    this.times.push(timeSeconds)
    this.values.push(value)
    while (this.times.length > 1 && timeSeconds - (this.times[0] ?? 0) > this.maxAgeSeconds) {
      this.times.shift()
      this.values.shift()
    }
  }

  /** Latest value recorded at or before `timeSeconds` (oldest value if none is that old). */
  valueAt(timeSeconds: number): number {
    for (let i = this.times.length - 1; i >= 0; i--) {
      if ((this.times[i] ?? Infinity) <= timeSeconds) return this.values[i] ?? 0
    }
    return this.values[0] ?? 0
  }
}

/**
 * Wraps a meter so visuals match what the listener hears: meters read the audio graph, which
 * runs `outputLatency` ahead of the speakers (a lot on Bluetooth). Meant to be read once per
 * frame from the animation loop.
 */
export function compensateLatency(
  reader: LevelReader,
  getLatencySeconds: () => number,
  nowSeconds: () => number = () => performance.now() / 1000,
): LevelReader {
  const history = new DelayLine()
  return {
    getLevel: () => {
      const latency = getLatencySeconds()
      const raw = reader.getLevel()
      if (latency < VISUAL_CONFIG.minLatencyCompensationSeconds) return raw
      const now = nowSeconds()
      history.push(now, raw)
      return history.valueAt(now - latency)
    },
  }
}
