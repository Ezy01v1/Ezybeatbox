import type { CharacterRole } from '@/core/packs/schema'
import { followLevel, normalizeLevel } from '../levels'

// Seconds to approach the meter level and to settle after it drops.
const RESPONSE: Record<CharacterRole, readonly [attack: number, release: number]> = {
  kick: [0.015, 0.12],
  snare: [0.012, 0.075],
  hihat: [0.01, 0.045],
  bass: [0.025, 0.18],
  voice: [0.03, 0.14],
  fx: [0.02, 0.16],
}

export function followRiveLevel(
  role: CharacterRole,
  previous: number,
  rawLevel: number,
  deltaSeconds: number,
): number {
  const [attack, release] = RESPONSE[role]
  return followLevel(previous, normalizeLevel(rawLevel), deltaSeconds, attack, release)
}
