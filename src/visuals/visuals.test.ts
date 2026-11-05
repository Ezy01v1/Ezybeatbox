import { subscribeFrame } from './animationLoop'
import { ringsAt } from './backdrop'
import { DelayLine, compensateLatency, followLevel, normalizeLevel } from './levels'
import { beatImpulse, computePose } from './pose'

describe('normalizeLevel', () => {
  it('maps silence to 0 and clamps loud values to 1', () => {
    expect(normalizeLevel(0)).toBe(0)
    expect(normalizeLevel(-1)).toBe(0)
    expect(normalizeLevel(1)).toBe(1)
  })

  it('boosts quiet levels so typical loops are visible', () => {
    expect(normalizeLevel(0.05)).toBeGreaterThan(0.3)
  })
})

describe('followLevel', () => {
  it('rises faster than it falls', () => {
    const up = followLevel(0, 1, 0.016)
    const down = 1 - followLevel(1, 0, 0.016)
    expect(up).toBeGreaterThan(down)
  })

  it('converges to the target and ignores zero time steps', () => {
    let value = 0
    for (let i = 0; i < 200; i++) value = followLevel(value, 0.7, 0.016)
    expect(value).toBeCloseTo(0.7, 3)
    expect(followLevel(0.3, 1, 0)).toBe(0.3)
  })
})

describe('DelayLine', () => {
  it('returns the value recorded at or before the requested time', () => {
    const line = new DelayLine()
    line.push(1.0, 0.1)
    line.push(1.1, 0.5)
    line.push(1.2, 0.9)
    expect(line.valueAt(1.15)).toBe(0.5)
    expect(line.valueAt(1.2)).toBe(0.9)
    expect(line.valueAt(0.5)).toBe(0.1)
  })

  it('forgets values older than its max age', () => {
    const line = new DelayLine(0.5)
    line.push(0, 1)
    line.push(1, 2)
    expect(line.valueAt(0)).toBe(2)
  })
})

describe('compensateLatency', () => {
  it('passes values straight through when latency is negligible', () => {
    let raw = 0.2
    const reader = compensateLatency({ getLevel: () => raw }, () => 0)
    expect(reader.getLevel()).toBe(0.2)
    raw = 0.8
    expect(reader.getLevel()).toBe(0.8)
  })

  it('delays levels by the output latency', () => {
    let now = 10
    let raw = 0
    const reader = compensateLatency(
      { getLevel: () => raw },
      () => 0.2,
      () => now,
    )
    reader.getLevel() // t=10.0 → 0
    now = 10.1
    raw = 1
    expect(reader.getLevel()).toBe(0) // heard at 9.9: still silence
    now = 10.3
    expect(reader.getLevel()).toBe(1) // heard at 10.1: the hit
  })
})

describe('pose', () => {
  it('beatImpulse peaks on the beat and decays within it', () => {
    expect(beatImpulse(null)).toBe(0)
    expect(beatImpulse(4)).toBe(1)
    expect(beatImpulse(4.5)).toBeCloseTo(0.125)
    expect(beatImpulse(4.99)).toBeLessThan(0.001)
  })

  it('silent characters keep the mouth closed and only breathe', () => {
    const pose = computePose({
      status: 'empty',
      level: 1,
      beatPosition: 2,
      reducedMotion: false,
      timeSeconds: 1,
    })
    expect(pose).toMatchObject({ mouthOpen: 0, glow: 0, bodyScale: 1 })
    expect(Math.abs(pose.headOffset)).toBeGreaterThan(0)
  })

  it('singing characters open the mouth with the level and bob on the beat', () => {
    const pose = computePose({
      status: 'playing',
      level: 0.8,
      beatPosition: 3,
      reducedMotion: false,
      timeSeconds: 0,
    })
    expect(pose.mouthOpen).toBe(0.8)
    expect(pose.headOffset).toBeLessThan(0)
    expect(pose.bodyScale).toBeGreaterThan(1)
  })

  it('reduced motion removes movement but keeps level feedback', () => {
    for (const status of ['empty', 'playing'] as const) {
      const pose = computePose({
        status,
        level: 0.8,
        beatPosition: 3,
        reducedMotion: true,
        timeSeconds: 1,
      })
      expect(pose.headOffset).toBe(0)
      expect(pose.bodyScale).toBe(1)
    }
    expect(
      computePose({
        status: 'playing',
        level: 0.8,
        beatPosition: 3,
        reducedMotion: true,
        timeSeconds: 1,
      }).mouthOpen,
    ).toBe(0.8)
  })
})

describe('ringsAt', () => {
  it('has no rings while stopped', () => {
    expect(ringsAt(null, 4)).toEqual([])
  })

  it('keeps the rings born in the last beats, newest first, marking downbeats', () => {
    const rings = ringsAt(4.25, 4)
    expect(rings.map((r) => r.age)).toEqual([0.25, 1.25])
    expect(rings.map((r) => r.downbeat)).toEqual([true, false])
  })

  it('does not emit rings for beats before the start', () => {
    expect(ringsAt(0.5, 4)).toEqual([{ age: 0.5, downbeat: true }])
  })
})

describe('subscribeFrame', () => {
  it('runs a single rAF loop shared by all subscribers, and stops when none are left', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const a = vi.fn()
    const b = vi.fn()
    const offA = subscribeFrame(a)
    const offB = subscribeFrame(b)
    expect(frames).toHaveLength(1)

    frames.shift()?.(1000)
    frames.shift()?.(1016)
    expect(a).toHaveBeenCalledTimes(2)
    expect(b).toHaveBeenLastCalledWith(1016, 0.016)

    offA()
    offB()
    expect(cancelAnimationFrame).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
