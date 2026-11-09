/**
 * One shared requestAnimationFrame loop for every animated thing on screen. Callbacks write to
 * the DOM/canvas directly; nothing here touches React state. The loop runs while the page is
 * visible and has subscribers.
 */
export type FrameCallback = (nowMs: number, deltaSeconds: number) => void

const callbacks = new Set<FrameCallback>()
let frameId: number | null = null
let lastTime: number | null = null

/** Longest step fed to animations after a slow frame. */
const MAX_DELTA_SECONDS = 0.1

function scheduleFrame() {
  if (frameId === null && callbacks.size > 0 && !document.hidden) {
    frameId = requestAnimationFrame(tick)
  }
}

function stopFrames() {
  if (frameId !== null) cancelAnimationFrame(frameId)
  frameId = null
  lastTime = null
}

function onVisibilityChange() {
  if (document.hidden) stopFrames()
  else scheduleFrame()
}

function tick(now: number) {
  frameId = null
  if (document.hidden || callbacks.size === 0) {
    lastTime = null
    return
  }
  const delta = lastTime === null ? 0 : Math.min(MAX_DELTA_SECONDS, (now - lastTime) / 1000)
  lastTime = now
  for (const callback of callbacks) callback(now, delta)
  scheduleFrame()
}

export function subscribeFrame(callback: FrameCallback): () => void {
  if (callbacks.size === 0) document.addEventListener('visibilitychange', onVisibilityChange)
  callbacks.add(callback)
  scheduleFrame()
  return () => {
    callbacks.delete(callback)
    if (callbacks.size === 0) {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stopFrames()
    }
  }
}
