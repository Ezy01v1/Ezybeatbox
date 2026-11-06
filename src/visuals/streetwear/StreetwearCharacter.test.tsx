import { act, render } from '@testing-library/react'
import type { SlotStatus } from '@/core/audio/transitions'
import { svgStyle } from '../rive/characterArt'
import { BLINK, blinkScale } from './art'
import { StreetwearCharacter } from './StreetwearCharacter'

describe('StreetwearCharacter', () => {
  let frames: FrameRequestCallback[] = []
  let now = 0

  beforeEach(() => {
    frames = []
    now = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })
  afterEach(() => vi.unstubAllGlobals())

  function runFrames(count: number) {
    for (let i = 0; i < count; i++) {
      now += 16
      const pending = frames
      frames = []
      act(() => pending.forEach((cb) => cb(now)))
    }
  }

  function draw(status: SlotStatus, level = 0, muted = false) {
    return render(
      <StreetwearCharacter
        role="kick"
        color="#c2410c"
        outline="#1c1917"
        status={status}
        muted={muted}
        level={{ getLevel: () => level }}
        beat={{ getBeatPosition: () => 0, beatsPerBar: 4 }}
        reducedMotion={false}
      />,
    ).container
  }

  it('uses the pack role color for the outfit', () => {
    expect(draw('empty').innerHTML).toContain('#c2410c')
  })

  it('shows the dashed ring only while queued', () => {
    expect(draw('queued').querySelector('ellipse[stroke-dasharray]')).not.toBeNull()
    expect(draw('empty').querySelector('ellipse[stroke-dasharray]')).toBeNull()
  })

  it('opens the singing mouth with the audio level', () => {
    const mouth = draw('playing', 1).querySelector('[data-mouth]')
    expect(mouth).not.toBeNull()
    runFrames(30)
    expect(Number(mouth?.getAttribute('ry'))).toBeGreaterThan(2)
  })

  it('keeps the mouth closed while muted', () => {
    const mouth = draw('playing', 1, true).querySelector('[data-mouth]')
    runFrames(30)
    expect(Number(mouth?.getAttribute('ry'))).toBeLessThan(1)
  })
})

describe('StreetwearCharacter motion', () => {
  let frames: FrameRequestCallback[] = []
  beforeEach(() => {
    frames = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })
  afterEach(() => vi.unstubAllGlobals())

  it('squashes the body and bounces the head while singing on the beat', () => {
    const { container } = render(
      <StreetwearCharacter
        role="kick"
        color="#c2410c"
        outline="#1c1917"
        status="playing"
        muted={false}
        level={{ getLevel: () => 1 }}
        beat={{ getBeatPosition: () => 0, beatsPerBar: 4 }}
        reducedMotion={false}
      />,
    )
    for (let i = 1; i <= 20; i++) {
      const pending = frames
      frames = []
      act(() => pending.forEach((cb) => cb(i * 16)))
    }
    // Full level: squash 1.03 × 0.97 at the hips; on the beat: head 4 units up.
    expect(container.innerHTML).toContain('scale(1.0300 0.9700)')
    expect(container.innerHTML).toContain('translate(0 -4.00)')
  })
})

describe('blinkScale', () => {
  it('closes the eyes at the role blink moment and reopens them', () => {
    const { at } = BLINK.kick
    expect(blinkScale('kick', at / 60)).toBe(1)
    expect(blinkScale('kick', (at + 3) / 60)).toBeCloseTo(0.1)
    expect(blinkScale('kick', (at + 7) / 60)).toBe(1)
    expect(blinkScale('snare', (at + 3) / 60)).toBe(1)
  })
})

describe('svgStyle', () => {
  it('matches the streetwear Rive art on Boom Bap and keeps the classic SVG elsewhere', () => {
    expect(svgStyle('boom-bap-01')).toBe('streetwear')
    expect(svgStyle('trap-01')).toBe('classic')
    expect(svgStyle(undefined)).toBe('classic')
  })
})
