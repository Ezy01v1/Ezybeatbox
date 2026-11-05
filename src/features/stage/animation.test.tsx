import { Profiler } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '@/app/App'
import { AppStoreProvider } from '@/app/store/AppStoreProvider'
import { createAppStore } from '@/app/store/appStore'
import { FakeEngine } from '@/app/store/fakeEngine'
import { makeTestManifest } from '@/core/packs/testing'

/**
 * Phase 3 acceptance: reactive animation must not re-render React per frame. Frames are driven
 * by a manual rAF so the test controls time.
 */
describe('reactive visuals', () => {
  let frames: FrameRequestCallback[] = []
  let now = 0

  beforeEach(() => {
    frames = []
    now = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })
  afterEach(() => vi.unstubAllGlobals())

  function runFrames(count: number) {
    for (let i = 0; i < count; i++) {
      now += 16
      const pending = frames
      frames = []
      act(() => pending.forEach((cb) => cb(now)))
    }
  }

  it('animates characters from the meter without any React commit per frame', async () => {
    const engine = new FakeEngine()
    const manifest = makeTestManifest()
    const store = createAppStore({
      engine,
      packUrl: '/packs/test-pack/',
      fetchFn: async () => new Response(JSON.stringify(manifest)),
    })
    let commits = 0
    render(
      <Profiler id="app" onRender={() => commits++}>
        <AppStoreProvider store={store} engine={engine}>
          <App />
        </AppStoreProvider>
      </Profiler>,
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Toca para empezar' }))
    await screen.findByRole('main', { name: 'Escenario' })
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    await user.click(screen.getByRole('button', { name: 'kick 1 para kick' }))
    act(() => engine.advanceBar())

    const mouth = document.querySelector('[data-drop-character="kick"] ellipse')
    expect(mouth).not.toBeNull()

    runFrames(2)
    const commitsBefore = commits
    const quietMouth = Number(mouth?.getAttribute('ry'))

    engine.level = 0.5
    engine.beatPosition = 8
    runFrames(30)

    expect(commits).toBe(commitsBefore)
    expect(Number(mouth?.getAttribute('ry'))).toBeGreaterThan(quietMouth + 3)
  })
})
