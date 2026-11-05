/** What is being dragged: a palette sound, or the sound already on a character. */
export type DragPayload =
  { kind: 'sound'; soundId: string; characterId: string } | { kind: 'remove'; characterId: string }

export type DropAction =
  { type: 'set'; characterId: string; soundId: string } | { type: 'clear'; characterId: string }

/**
 * Decides what a drop does. Each sound belongs to one character (fixed roles), so a palette
 * sound only lands on its owner; dragging a character's sound anywhere off it removes it.
 */
export function resolveDrop(
  payload: DragPayload,
  overCharacterId: string | null,
): DropAction | null {
  if (payload.kind === 'sound') {
    return overCharacterId === payload.characterId
      ? { type: 'set', characterId: payload.characterId, soundId: payload.soundId }
      : null
  }
  return overCharacterId === payload.characterId
    ? null
    : { type: 'clear', characterId: payload.characterId }
}

/** Whether `characterId` would accept the current drag (for highlighting drop targets). */
export function acceptsDrop(payload: DragPayload, characterId: string): boolean {
  return payload.kind === 'sound' && payload.characterId === characterId
}
