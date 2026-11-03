import { planBarTransitions, slotStatus } from './transitions'

describe('planBarTransitions', () => {
  it('returns nothing when every slot is settled', () => {
    expect(
      planBarTransitions([
        { characterId: 'kick', playing: 'kick-1', target: 'kick-1' },
        { characterId: 'snare', playing: null, target: null },
      ]),
    ).toEqual([])
  })

  it('starts, replaces and stops sounds', () => {
    expect(
      planBarTransitions([
        { characterId: 'kick', playing: null, target: 'kick-1' },
        { characterId: 'snare', playing: 'snare-1', target: 'snare-2' },
        { characterId: 'hihat', playing: 'hihat-1', target: null },
      ]),
    ).toEqual([
      { characterId: 'kick', from: null, to: 'kick-1' },
      { characterId: 'snare', from: 'snare-1', to: 'snare-2' },
      { characterId: 'hihat', from: 'hihat-1', to: null },
    ])
  })
})

describe('slotStatus', () => {
  it.each([
    [null, null, 'empty'],
    [null, 'kick-1', 'queued'],
    ['kick-1', 'kick-2', 'queued'],
    ['kick-1', 'kick-1', 'playing'],
    ['kick-1', null, 'stopping'],
  ] as const)('playing=%s target=%s → %s', (playing, target, expected) => {
    expect(slotStatus({ playing, target })).toBe(expected)
  })
})
