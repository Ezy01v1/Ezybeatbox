import { AudioEngine } from './AudioEngine'

const { createVolume, resume, setContext } = vi.hoisted(() => ({
  createVolume: vi.fn(),
  resume: vi.fn(async () => {}),
  setContext: vi.fn(),
}))

vi.mock('tone', () => ({
  Volume: class {
    constructor() {
      createVolume()
    }
    chain() {}
  },
  Limiter: class {
    connect() {}
  },
  Meter: class {
    getValue() {
      return 0.5
    }
  },
  getDestination: () => ({}),
  getContext: () => ({ state: 'running', on: () => {} }),
  setContext,
}))

describe('AudioEngine initialization', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('resumes the native context in the gesture before creating the Tone graph', async () => {
    class NativeContext {
      state = 'running'
      resume = resume
    }
    vi.stubGlobal('AudioContext', NativeContext)
    const engine = new AudioEngine()
    const meter = engine.getMasterMeter()
    expect(engine.contextState).toBe('suspended')
    expect(meter.getLevel()).toBe(0)
    expect(createVolume).not.toHaveBeenCalled()

    const opening = engine.unlock()
    expect(resume).toHaveBeenCalledOnce()
    expect(createVolume).not.toHaveBeenCalled()

    await opening
    expect(setContext).toHaveBeenCalledWith(expect.any(NativeContext), true)
    expect(createVolume).toHaveBeenCalledOnce()
    expect(engine.contextState).toBe('running')
    expect(meter.getLevel()).toBe(0.5)

    await engine.unlock()
    expect(resume).toHaveBeenCalledTimes(2)
    expect(createVolume).toHaveBeenCalledOnce()
  })
})
