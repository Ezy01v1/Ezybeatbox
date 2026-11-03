/**
 * Per-character slot state. `target` is what the user asked for; `playing` is what is
 * actually sounding. They differ between a user action and the next bar line.
 */
export interface SlotState {
  readonly characterId: string
  readonly playing: string | null
  readonly target: string | null
}

export interface SlotTransition {
  readonly characterId: string
  readonly from: string | null
  readonly to: string | null
}

/** Changes to apply at a bar line: every slot whose target differs from what is playing. */
export function planBarTransitions(slots: Iterable<SlotState>): SlotTransition[] {
  const transitions: SlotTransition[] = []
  for (const { characterId, playing, target } of slots) {
    if (playing !== target) {
      transitions.push({ characterId, from: playing, to: target })
    }
  }
  return transitions
}

export type SlotStatus = 'empty' | 'queued' | 'playing' | 'stopping'

/** What the UI should show for a slot (e.g. "en espera" while queued). */
export function slotStatus({ playing, target }: Pick<SlotState, 'playing' | 'target'>): SlotStatus {
  if (target === null) return playing === null ? 'empty' : 'stopping'
  return playing === target ? 'playing' : 'queued'
}
