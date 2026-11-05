import { acceptsDrop, resolveDrop } from './resolveDrop'

const kickSound = { kind: 'sound', soundId: 'kick-2', characterId: 'kick' } as const
const removeKick = { kind: 'remove', characterId: 'kick' } as const

describe('resolveDrop', () => {
  it('sets a palette sound when dropped on its own character', () => {
    expect(resolveDrop(kickSound, 'kick')).toEqual({
      type: 'set',
      characterId: 'kick',
      soundId: 'kick-2',
    })
  })

  it('ignores a palette sound dropped on another character or on nothing', () => {
    expect(resolveDrop(kickSound, 'snare')).toBeNull()
    expect(resolveDrop(kickSound, null)).toBeNull()
  })

  it("removes a character's sound when dragged off it", () => {
    expect(resolveDrop(removeKick, null)).toEqual({ type: 'clear', characterId: 'kick' })
    expect(resolveDrop(removeKick, 'bass')).toEqual({ type: 'clear', characterId: 'kick' })
  })

  it('keeps the sound when dropped back on the same character', () => {
    expect(resolveDrop(removeKick, 'kick')).toBeNull()
  })
})

describe('acceptsDrop', () => {
  it('only the owner character accepts a palette sound', () => {
    expect(acceptsDrop(kickSound, 'kick')).toBe(true)
    expect(acceptsDrop(kickSound, 'snare')).toBe(false)
    expect(acceptsDrop(removeKick, 'kick')).toBe(false)
  })
})
