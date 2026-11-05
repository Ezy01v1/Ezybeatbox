import { createStore, useStore } from 'zustand'
import type { DragPayload } from './resolveDrop'

interface DragState {
  /** Changes only at drag start/end, so subscribers re-render twice per drag. */
  payload: DragPayload | null
  /** Character under the pointer; changes only when crossing a character's edge. */
  overCharacterId: string | null
}

export const dragStore = createStore<DragState>()(() => ({ payload: null, overCharacterId: null }))

export function useDragState<T>(selector: (state: DragState) => T): T {
  return useStore(dragStore, selector)
}

/**
 * The drag "ghost" follows the pointer by writing its transform directly, never through React
 * state, so moving the finger causes zero re-renders.
 */
let ghostElement: HTMLElement | null = null
let lastPointer = { x: 0, y: 0 }

export function registerGhost(element: HTMLElement | null): void {
  ghostElement = element
  if (element) positionGhost(lastPointer.x, lastPointer.y)
}

export function positionGhost(x: number, y: number): void {
  lastPointer = { x, y }
  if (ghostElement) ghostElement.style.transform = `translate3d(${x}px, ${y}px, 0)`
}
