import { acceptsDrop, resolveDrop } from './resolveDrop'

const kickSound = { kind: 'sound', soundId: 'kick-2', characterId: 'kick' } as const
const dragKick = { kind: 'remove', characterId: 'kick', soundId: 'kick-1' } as const

describe('resolveDrop', () => {
  it('sets a palette sound on whichever character it is dropped on', () => {
    expect(resolveDrop(kickSound, 'kick')).toEqual({
      type: 'set',
      characterId: 'kick',
      soundId: 'kick-2',
    })
    expect(resolveDrop(kickSound, 'snare')).toEqual({
      type: 'set',
      characterId: 'snare',
      soundId: 'kick-2',
    })
  })

  it('ignores a palette sound dropped on nothing', () => {
    expect(resolveDrop(kickSound, null)).toBeNull()
  })

  it("moves a character's sound onto another character", () => {
    expect(resolveDrop(dragKick, 'bass')).toEqual({
      type: 'set',
      characterId: 'bass',
      soundId: 'kick-1',
    })
  })

  it("removes a character's sound when dropped off every character", () => {
    expect(resolveDrop(dragKick, null)).toEqual({ type: 'clear', characterId: 'kick' })
  })

  it('keeps the sound when dropped back on the same character', () => {
    expect(resolveDrop(dragKick, 'kick')).toBeNull()
  })
})

describe('acceptsDrop', () => {
  it('every character accepts a palette sound; a dragged sound goes to the others', () => {
    expect(acceptsDrop(kickSound, 'kick')).toBe(true)
    expect(acceptsDrop(kickSound, 'snare')).toBe(true)
    expect(acceptsDrop(dragKick, 'kick')).toBe(false)
    expect(acceptsDrop(dragKick, 'snare')).toBe(true)
  })
})
