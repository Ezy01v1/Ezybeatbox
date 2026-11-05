/**
 * One shared requestAnimationFrame loop for every animated thing on screen. Callbacks write to
 * the DOM/canvas directly; nothing here touches React state. The loop runs only while there
 * are subscribers, and browsers pause rAF in background tabs for free.
 */
export type FrameCallback = (nowMs: number, deltaSeconds: number) => void

const callbacks = new Set<FrameCallback>()
let frameId: number | null = null
let lastTime: number | null = null

/** Longest step fed to animations, so a long pause (tab switch) does not cause a jump. */
const MAX_DELTA_SECONDS = 0.1

function tick(now: number) {
  const delta = lastTime === null ? 0 : Math.min(MAX_DELTA_SECONDS, (now - lastTime) / 1000)
  lastTime = now
  for (const callback of callbacks) callback(now, delta)
  frameId = callbacks.size > 0 ? requestAnimationFrame(tick) : null
  if (frameId === null) lastTime = null
}

export function subscribeFrame(callback: FrameCallback): () => void {
  callbacks.add(callback)
  if (frameId === null) frameId = requestAnimationFrame(tick)
  return () => {
    callbacks.delete(callback)
    if (callbacks.size === 0 && frameId !== null) {
      cancelAnimationFrame(frameId)
      frameId = null
      lastTime = null
    }
  }
}
