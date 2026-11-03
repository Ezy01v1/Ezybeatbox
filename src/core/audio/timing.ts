/**
 * Pure musical-time math. No Tone.js here so it can be unit-tested and shared with
 * Node scripts (placeholder generation).
 *
 * Convention (same as Tone.js): `bpm` counts quarter notes per minute, and the bar length
 * is derived from the time signature, so 6/8 at 90 bpm is 3 quarter notes per bar.
 */

export type TimeSignature = readonly [beatsPerBar: number, beatUnit: number]

export interface MeterConfig {
  bpm: number
  timeSignature: TimeSignature
}

/** Floating-point slack when deciding whether a time sits exactly on a grid line. */
export const GRID_EPSILON_SECONDS = 1e-6

export function quarterNoteSeconds(bpm: number): number {
  return 60 / bpm
}

/** Duration of one beat of the time signature (a quarter in 4/4, an eighth in 6/8). */
export function beatSeconds({ bpm, timeSignature }: MeterConfig): number {
  return quarterNoteSeconds(bpm) * (4 / timeSignature[1])
}

/** Bar length expressed in quarter notes (Tone's `Transport.timeSignature` value). */
export function quarterNotesPerBar(timeSignature: TimeSignature): number {
  return timeSignature[0] * (4 / timeSignature[1])
}

export function barSeconds(meter: MeterConfig): number {
  return beatSeconds(meter) * meter.timeSignature[0]
}

export function loopSeconds(meter: MeterConfig, loopBars: number): number {
  return barSeconds(meter) * loopBars
}

/** Exact sample count a loop file must have. */
export function loopSampleCount(meter: MeterConfig, loopBars: number, sampleRate: number): number {
  return Math.round(loopSeconds(meter, loopBars) * sampleRate)
}

/** Zero-based index of the bar containing `seconds` (transport time). */
export function barIndexAt(seconds: number, meter: MeterConfig): number {
  return Math.floor((seconds + GRID_EPSILON_SECONDS) / barSeconds(meter))
}

/**
 * Start time of the first bar strictly after `seconds`. A time sitting exactly on a bar line
 * counts as already started, so it returns the following bar — there is no time left to
 * schedule audio "now".
 */
export function nextBarStart(seconds: number, meter: MeterConfig): number {
  return (barIndexAt(seconds, meter) + 1) * barSeconds(meter)
}

/**
 * Offset into a loop when it starts at `barIndex`. Loops stay phase-aligned with the global
 * loop grid: a 2-bar loop dropped on an odd bar starts from its second bar, so every
 * character's bar 1 always lines up.
 */
export function loopOffsetAtBar(barIndex: number, loopBars: number, meter: MeterConfig): number {
  const barInLoop = ((barIndex % loopBars) + loopBars) % loopBars
  return barInLoop * barSeconds(meter)
}
