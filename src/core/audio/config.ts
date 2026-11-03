/** Central audio tuning. Change values here, never inline in the engine. */
export const AUDIO_CONFIG = {
  /** Delay between pressing play and bar 1, so the first beat is never late. */
  startDelaySeconds: 0.1,
  /** Fade applied when a loop starts/stops; avoids clicks without softening transients. */
  playerFadeSeconds: 0.004,
  defaultChannelVolumeDb: -6,
  defaultMasterVolumeDb: 0,
  minVolumeDb: -60,
  maxVolumeDb: 6,
  /** Ramp time for volume changes, avoids zipper noise. */
  volumeRampSeconds: 0.05,
  /** Master brick-wall limiter threshold. */
  limiterThresholdDb: -1,
  /** Meter smoothing (0–1). Higher = slower, calmer animation. */
  meterSmoothing: 0.8,
  /** A sample whose length differs from the expected loop length by more than this is reported. */
  loopLengthToleranceSeconds: 0.01,
} as const

export function clampVolumeDb(db: number): number {
  return Math.min(AUDIO_CONFIG.maxVolumeDb, Math.max(AUDIO_CONFIG.minVolumeDb, db))
}
