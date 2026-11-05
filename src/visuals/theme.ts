import type { CharacterRole } from '@/core/packs/schema'

/** Per-role color, shared by characters and their palette icons. */
export const ROLE_COLORS: Record<CharacterRole, string> = {
  kick: '#fb923c',
  snare: '#f472b6',
  hihat: '#facc15',
  bass: '#a78bfa',
  voice: '#4ade80',
  fx: '#22d3ee',
}

/** Color for a character in its "no sound" state. */
export const IDLE_COLOR = '#52525b'
