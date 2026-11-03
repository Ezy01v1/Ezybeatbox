import { TypedEmitter } from './events'

describe('TypedEmitter', () => {
  it('delivers payloads to subscribers until they unsubscribe', () => {
    const emitter = new TypedEmitter<{ tick: { n: number } }>()
    const listener = vi.fn()
    const off = emitter.on('tick', listener)

    emitter.emit('tick', { n: 1 })
    off()
    emitter.emit('tick', { n: 2 })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ n: 1 })
  })

  it('clear removes every listener', () => {
    const emitter = new TypedEmitter<{ a: null; b: null }>()
    const listener = vi.fn()
    emitter.on('a', listener)
    emitter.on('b', listener)

    emitter.clear()
    emitter.emit('a', null)
    emitter.emit('b', null)

    expect(listener).not.toHaveBeenCalled()
  })
})
