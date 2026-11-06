import { statusMotionFor } from './statusMotion'

describe('statusMotionFor', () => {
  it('hops when a character starts singing and sags when it goes quiet', () => {
    expect(statusMotionFor('queued', 'playing')).toBe('enter')
    expect(statusMotionFor('empty', 'playing')).toBe('enter')
    expect(statusMotionFor('stopping', 'empty')).toBe('exit')
    expect(statusMotionFor('playing', 'empty')).toBe('exit')
  })

  it('stays still for changes that are not a start or an end', () => {
    expect(statusMotionFor('empty', 'queued')).toBeNull()
    expect(statusMotionFor('playing', 'stopping')).toBeNull()
    expect(statusMotionFor('queued', 'empty')).toBeNull()
  })
})
