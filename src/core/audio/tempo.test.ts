import { clampTempo, playbackRateFor, tempoRange } from './tempo'

describe('tempo', () => {
  it('allows ±15 % around the pack tempo, in whole BPM', () => {
    expect(tempoRange(90)).toEqual({ min: 77, max: 103 })
    expect(tempoRange(174)).toEqual({ min: 148, max: 200 })
  })

  it('clamps and rounds', () => {
    expect(clampTempo(95.4, 90)).toBe(95)
    expect(clampTempo(200, 90)).toBe(103)
    expect(clampTempo(10, 90)).toBe(77)
    expect(clampTempo(Number.NaN, 90)).toBe(90)
  })

  it('plays the loops faster or slower', () => {
    expect(playbackRateFor(99, 90)).toBeCloseTo(1.1)
    expect(playbackRateFor(90, 90)).toBe(1)
  })
})
