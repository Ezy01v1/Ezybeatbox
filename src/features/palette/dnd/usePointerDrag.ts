import { useRef } from 'react'
import { dragStore, positionGhost } from './dragStore'
import { type DragPayload, type DropAction, resolveDrop } from './resolveDrop'

/** Movement (px) before a press becomes a drag; below it, the press is a tap (click). */
const DRAG_THRESHOLD_PX = 8

/** Attribute that marks a drop target; its value is the character id. */
export const DROP_TARGET_ATTR = 'data-drop-character'

function characterAt(x: number, y: number): string | null {
  const element = document.elementFromPoint(x, y)
  return element?.closest(`[${DROP_TARGET_ATTR}]`)?.getAttribute(DROP_TARGET_ATTR) ?? null
}

/**
 * Pointer-events drag & drop (mouse, touch and pen alike). Returns props for the draggable
 * element. A press that does not move becomes a normal click, which is also what keyboard
 * activation fires, so `onClick` is the tap/keyboard fallback.
 */
export function usePointerDrag(
  payload: DragPayload | null,
  onDrop: (action: DropAction) => void,
  onClick?: () => void,
) {
  const suppressClick = useRef(false)

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!payload || (event.pointerType === 'mouse' && event.button !== 0)) return
    const element = event.currentTarget
    const start = { x: event.clientX, y: event.clientY }
    const pointerId = event.pointerId
    let dragging = false
    // Capture at once so a fast mouse leaving the icon before the threshold still drags.
    element.setPointerCapture?.(pointerId)

    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      if (!dragging) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_THRESHOLD_PX) return
        dragging = true
        positionGhost(e.clientX, e.clientY)
        dragStore.setState({ payload, overCharacterId: null })
      }
      positionGhost(e.clientX, e.clientY)
      const over = characterAt(e.clientX, e.clientY)
      if (over !== dragStore.getState().overCharacterId) {
        dragStore.setState({ overCharacterId: over })
      }
    }

    const finish = (e: PointerEvent, cancelled: boolean) => {
      if (e.pointerId !== pointerId) return
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', cancel)
      if (!dragging) return
      // The click that follows a drag must not also count as a tap.
      suppressClick.current = true
      dragStore.setState({ payload: null, overCharacterId: null })
      if (!cancelled) {
        const action = resolveDrop(payload, characterAt(e.clientX, e.clientY))
        if (action) onDrop(action)
      }
    }
    const up = (e: PointerEvent) => finish(e, false)
    const cancel = (e: PointerEvent) => finish(e, true)

    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', cancel)
  }

  const handleClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    onClick?.()
  }

  return { onPointerDown, onClick: handleClick }
}
