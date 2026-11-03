import {
  barIndexAt,
  barSeconds,
  beatSeconds,
  loopOffsetAtBar,
  loopSampleCount,
  loopSeconds,
  nextBarStart,
  quarterNotesPerBar,
  type MeterConfig,
} from './timing'

const boomBap: MeterConfig = { bpm: 90, timeSignature: [4, 4] }

describe('durations', () => {
  it('computes beat, bar and loop length at 90 bpm in 4/4', () => {
    expect(beatSeconds(boomBap)).toBeCloseTo(2 / 3, 10)
    expect(barSeconds(boomBap)).toBeCloseTo(8 / 3, 10)
    expect(loopSeconds(boomBap, 2)).toBeCloseTo(16 / 3, 10)
  })

  it('handles other tempos', () => {
    expect(barSeconds({ bpm: 120, timeSignature: [4, 4] })).toBeCloseTo(2, 10)
    expect(loopSeconds({ bpm: 60, timeSignature: [4, 4] }, 1)).toBeCloseTo(4, 10)
  })

  it('treats bpm as quarter notes in compound meters', () => {
    const sixEight: MeterConfig = { bpm: 90, timeSignature: [6, 8] }
    expect(quarterNotesPerBar([6, 8])).toBe(3)
    expect(beatSeconds(sixEight)).toBeCloseTo(1 / 3, 10)
    expect(barSeconds(sixEight)).toBeCloseTo(2, 10)
  })

  it('gives the exact sample count for a 2-bar loop at 90 bpm / 44.1 kHz', () => {
    expect(loopSampleCount(boomBap, 2, 44_100)).toBe(235_200)
  })
})

describe('barIndexAt', () => {
  it('maps transport time to the containing bar', () => {
    expect(barIndexAt(0, boomBap)).toBe(0)
    expect(barIndexAt(2.6, boomBap)).toBe(0)
    expect(barIndexAt(8 / 3, boomBap)).toBe(1)
    expect(barIndexAt(10, boomBap)).toBe(3)
  })

  it('is robust to floating-point error right at a bar line', () => {
    const almostBar3 = 3 * (8 / 3) - 1e-9
    expect(barIndexAt(almostBar3, boomBap)).toBe(3)
  })
})

describe('nextBarStart', () => {
  it('returns the start of the following bar', () => {
    expect(nextBarStart(0.1, boomBap)).toBeCloseTo(8 / 3, 10)
    expect(nextBarStart(3, boomBap)).toBeCloseTo(16 / 3, 10)
  })

  it('treats a time exactly on a bar line as already started', () => {
    expect(nextBarStart(0, boomBap)).toBeCloseTo(8 / 3, 10)
    expect(nextBarStart(8 / 3, boomBap)).toBeCloseTo(16 / 3, 10)
  })
})

describe('loopOffsetAtBar', () => {
  it('keeps 2-bar loops phase-aligned to the global grid', () => {
    expect(loopOffsetAtBar(0, 2, boomBap)).toBe(0)
    expect(loopOffsetAtBar(1, 2, boomBap)).toBeCloseTo(8 / 3, 10)
    expect(loopOffsetAtBar(2, 2, boomBap)).toBe(0)
    expect(loopOffsetAtBar(7, 2, boomBap)).toBeCloseTo(8 / 3, 10)
  })

  it('is always zero for 1-bar loops', () => {
    expect(loopOffsetAtBar(5, 1, boomBap)).toBe(0)
  })

  it('works for longer loops', () => {
    expect(loopOffsetAtBar(6, 4, boomBap)).toBeCloseTo(2 * (8 / 3), 10)
  })
})
