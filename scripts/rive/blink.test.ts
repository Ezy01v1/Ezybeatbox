import { describe, expect, it } from 'vitest'
import { CHARACTER_ROLES } from '../../src/core/packs/schema'
import { blinkAnimation } from './build-streetwear'

describe('blinkAnimation', () => {
  it('loops forever on the eyes and squashes them around their center', () => {
    const kick = blinkAnimation('kick')
    expect(kick).toContain('loopValue="loop"')
    expect(kick).toContain('objectId="0:60"')
    // At the squash (scale 0.1) y must move by 41 * 0.9 so the eye center stays put.
    expect(kick).toContain('value="0.1" frame="43"')
    expect(kick).toContain('value="36.9" frame="43"')
  })

  it('gives every role its own rhythm so the band never blinks in unison', () => {
    const timings = CHARACTER_ROLES.map(
      (role) => /duration="(\d+)"/.exec(blinkAnimation(role))?.[1],
    )
    expect(new Set(timings).size).toBe(CHARACTER_ROLES.length)
  })
})
