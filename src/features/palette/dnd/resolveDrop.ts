/** What is being dragged: a palette sound, or the sound already on a character. */
export type DragPayload =
  | { kind: 'sound'; soundId: string; characterId: string }
  | { kind: 'remove'; characterId: string; soundId: string }

export type DropAction =
  { type: 'set'; characterId: string; soundId: string } | { type: 'clear'; characterId: string }

/**
 * Decides what a drop does. Any character takes any sound of the pack (one character per
 * sound, see appStore.setSound), so a palette sound lands on whichever character it is dropped
 * on. A character's sound dragged onto another character moves there; dropped off any
 * character it is removed. `characterId` on a palette sound is its section, for its color.
 */
export function resolveDrop(
  payload: DragPayload,
  overCharacterId: string | null,
): DropAction | null {
  if (payload.kind === 'sound') {
    return overCharacterId
      ? { type: 'set', characterId: overCharacterId, soundId: payload.soundId }
      : null
  }
  if (overCharacterId === payload.characterId) return null
  return overCharacterId
    ? { type: 'set', characterId: overCharacterId, soundId: payload.soundId }
    : { type: 'clear', characterId: payload.characterId }
}

/** Whether `characterId` would accept the current drag (for highlighting drop targets). */
export function acceptsDrop(payload: DragPayload, characterId: string): boolean {
  return payload.kind === 'sound' || payload.characterId !== characterId
}
