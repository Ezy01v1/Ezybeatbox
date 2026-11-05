import { VISUAL_CONFIG } from './config'

export interface Ring {
  /** Beats since the ring was born (0 = just now). */
  age: number
  /** Born on beat 1 of a bar: drawn stronger. */
  downbeat: boolean
}

/**
 * Rings emitted on each beat that are still alive at `beatPosition`. Stateless: derived from the
 * clock alone, so it can never drift from the music.
 */
export function ringsAt(beatPosition: number | null, beatsPerBar: number): Ring[] {
  if (beatPosition === null || beatPosition < 0) return []
  const rings: Ring[] = []
  const current = Math.floor(beatPosition)
  for (let born = current; born >= 0 && rings.length < VISUAL_CONFIG.maxRings; born--) {
    const age = beatPosition - born
    if (age >= VISUAL_CONFIG.ringLifetimeBeats) break
    rings.push({ age, downbeat: born % beatsPerBar === 0 })
  }
  return rings
}

export interface BackdropFrame {
  width: number
  height: number
  pixelRatio: number
  /** Smoothed 0–1 master level. */
  level: number
  rings: readonly Ring[]
  color: string
}

/** Paints one frame of the stage backdrop: a level-driven glow plus beat rings. */
export function paintBackdrop(ctx: CanvasRenderingContext2D, frame: BackdropFrame): void {
  const { width, height, pixelRatio, level, rings, color } = frame
  ctx.clearRect(0, 0, width, height)

  const cx = width / 2
  const cy = height * 0.8
  const radius = Math.max(width, height) * 0.75

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  ctx.globalAlpha = 0.05 + 0.3 * level
  glow.addColorStop(0, color)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = color
  for (const ring of rings) {
    const progress = ring.age / VISUAL_CONFIG.ringLifetimeBeats
    ctx.globalAlpha = (1 - progress) * (ring.downbeat ? 0.45 : 0.2) * (0.3 + 0.7 * level)
    ctx.lineWidth = (ring.downbeat ? 3 : 1.5) * pixelRatio
    ctx.beginPath()
    ctx.arc(cx, cy, radius * (0.15 + 0.85 * progress), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
