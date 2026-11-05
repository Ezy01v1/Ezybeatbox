/** Central tuning for reactive visuals. Purely cosmetic: nothing here affects audio. */
export const VISUAL_CONFIG = {
  /** Raw meter values are small (RMS 0–1); `sqrt` + gain maps typical loops to ~0.3–1. */
  levelGain: 2.2,
  /** Envelope follower time constants (seconds): fast attack for punch, slower release. */
  levelAttackSeconds: 0.015,
  levelReleaseSeconds: 0.12,
  /** Below this, latency compensation is skipped (not perceptible). */
  minLatencyCompensationSeconds: 0.01,

  /** Character head bob on each beat (SVG units, character is 100×130). */
  beatBobUnits: 4,
  /** Extra body scale at full level. */
  bodyPulse: 0.08,
  /** Idle "breathing" (SVG units, cycles per second). */
  idleBreathUnits: 1.2,
  idleBreathHz: 0.25,

  /** Backdrop: how many beats a ring lives, and the maximum rings drawn at once. */
  ringLifetimeBeats: 2,
  maxRings: 8,
  /** Cap canvas resolution to keep fill cost low on high-DPI phones. */
  maxDevicePixelRatio: 2,
} as const
