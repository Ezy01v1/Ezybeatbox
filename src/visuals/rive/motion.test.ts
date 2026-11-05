import { describe, expect, it } from 'vitest'
import { followRiveLevel } from './motion'

describe('Rive character response', () => {
  it('lets the hi-hat recover between hits while the bass holds its pose', () => {
    expect(followRiveLevel('hihat', 1, 0, 0.08)).toBeLessThan(followRiveLevel('bass', 1, 0, 0.08))
  })

  it('gives the snare a sharper attack than the voice', () => {
    expect(followRiveLevel('snare', 0, 1, 0.016)).toBeGreaterThan(
      followRiveLevel('voice', 0, 1, 0.016),
    )
  })
})
