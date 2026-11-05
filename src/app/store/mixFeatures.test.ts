import { createTestApp } from './testing'

const keys = (app: ReturnType<typeof createTestApp>) =>
  app.store.getState().notices.map((n) => n.key)

async function ready(app: ReturnType<typeof createTestApp>) {
  await app.store.getState().begin()
  expect(app.store.getState().phase).toBe('ready')
  return app.store.getState()
}

describe('share links', () => {
  it('builds a share URL from the current mix', async () => {
    const app = createTestApp()
    const state = await ready(app)
    state.setSound('kick', 'kick-2')
    state.toggleMute('snare')
    expect(state.getShareUrl()).toBe('https://ezy.test/#v=1&p=test-pack&pv=1&s=kick.kick-2&m=snare')
  })

  it('opening a link loads its pack and rebuilds the mix', async () => {
    const app = createTestApp({
      initialHash: '#v=1&p=test-pack&pv=1&s=kick.kick-2~bass.bass-1&o=bass',
    })
    expect(app.store.getState().openingSharedMix).toBe(true)
    const state = await ready(app)

    expect(app.engine.loadedPackUrls).toEqual(['/packs/test-pack/'])
    expect(state.slots.kick).toMatchObject({ target: 'kick-2', status: 'queued' })
    expect(state.slots.bass).toMatchObject({ target: 'bass-1', solo: true })
    expect(keys(app)).toEqual(['linkLoaded'])
    expect(app.onLinkConsumed).toHaveBeenCalledOnce()
    expect(state.openingSharedMix).toBe(false)
  })

  it('round-trips: a URL from one session rebuilds the same mix in another', async () => {
    const first = createTestApp()
    const a = await ready(first)
    a.setSound('voice', 'voice-2')
    a.setSound('fx', 'fx-1')
    a.toggleSolo('voice')
    a.setMasterVolume(-4)
    const url = a.getShareUrl()

    const second = createTestApp({ initialHash: new URL(url).hash })
    await ready(second)
    expect(second.engine.getMix()).toEqual(first.engine.getMix())
  })

  it('an invalid link shows an error and keeps the empty stage', async () => {
    const app = createTestApp({ initialHash: '#v=1&p=../../x' })
    const state = await ready(app)
    expect(keys(app)).toEqual(['linkInvalid'])
    expect(Object.values(state.slots).every((s) => s.target === null)).toBe(true)
  })

  it('a link from a newer app version is reported as such', async () => {
    const app = createTestApp({ initialHash: '#v=9&p=test-pack&pv=1' })
    await ready(app)
    expect(keys(app)).toEqual(['linkNewerVersion'])
  })

  it('a link made with another pack version warns and skips missing sounds', async () => {
    const app = createTestApp({ initialHash: '#v=1&p=test-pack&pv=3&s=kick.kick-7~snare.snare-1' })
    const state = await ready(app)
    expect(keys(app)).toEqual(['linkLoaded', 'linkPackVersionChanged', 'missingSounds'])
    expect(state.notices[2]?.params).toEqual({ count: 1 })
    expect(state.slots.snare?.target).toBe('snare-1')
  })

  it('a link opened while the app is running (hash change) is applied right away', async () => {
    const app = createTestApp()
    await ready(app)
    app.store.getState().openLink('#v=1&p=test-pack&pv=1&s=fx.fx-2')
    expect(app.store.getState().slots.fx?.target).toBe('fx-2')
    expect(keys(app)).toEqual(['linkLoaded'])
    expect(app.onLinkConsumed).toHaveBeenCalledOnce()

    app.store.getState().openLink('#v=1&p=other-pack&pv=1&s=fx.fx-1')
    expect(app.store.getState().slots.fx?.target).toBe('fx-2')
    expect(keys(app)).toEqual(['linkLoaded', 'mixOtherPack'])

    app.store.getState().openLink('')
    expect(keys(app)).toHaveLength(2)
  })

  it('a link to a pack that does not exist shows the pack error screen', async () => {
    const app = createTestApp({ initialHash: '#v=1&p=no-such-pack&pv=1' })
    await app.store.getState().begin()
    expect(app.store.getState()).toMatchObject({ phase: 'error', error: { kind: 'pack' } })
  })
})

describe('saved mixes', () => {
  it('saves, lists, loads and deletes mixes', async () => {
    const app = createTestApp()
    const state = await ready(app)
    state.setSound('hihat', 'hihat-2')
    await state.saveCurrentMix('Mi beat')

    const [saved] = app.store.getState().savedMixes
    expect(saved).toMatchObject({ name: 'Mi beat', packId: 'test-pack' })

    state.clearSound('hihat')
    await state.loadSavedMix(saved!.id)
    expect(app.store.getState().slots.hihat?.target).toBe('hihat-2')

    await state.deleteSavedMix(saved!.id)
    expect(app.store.getState().savedMixes).toEqual([])
    expect(keys(app)).toEqual(['mixSaved', 'mixLoaded', 'mixDeleted'])
  })

  it('refuses a saved mix from another pack', async () => {
    const app = createTestApp()
    const state = await ready(app)
    const saved = await app.repository.save({
      name: 'Otro',
      mix: { ...app.engine.getMix(), packId: 'other-pack' },
    })
    await state.loadSavedMix(saved.id)
    expect(keys(app)).toEqual(['mixOtherPack'])
  })
})

describe('audio export', () => {
  it('records exactly 2 loops starting on a loop boundary, then returns the audio', async () => {
    const app = createTestApp()
    const state = await ready(app)
    state.setSound('kick', 'kick-1')

    const exporting = state.exportAudio()
    await vi.waitFor(() => expect(app.engine.isPlaying).toBe(true))
    expect(app.store.getState().exportStatus.state).toBe('waiting')

    app.engine.advanceBar() // bar 0: loop start → recording begins
    await vi.waitFor(() => expect(app.engine.recording).toBe(true))
    for (let i = 0; i < 3; i++) app.engine.advanceBar()
    await vi.waitFor(() =>
      expect(app.store.getState().exportStatus).toEqual({
        state: 'recording',
        barsDone: 3,
        barsTotal: 4,
      }),
    )
    expect(app.engine.recording).toBe(true)
    app.engine.advanceBar()

    const blob = await exporting
    expect(blob?.type).toBe('audio/webm')
    expect(app.engine.recording).toBe(false)
    expect(app.store.getState().exportStatus).toEqual({ state: 'idle' })
    expect(keys(app)).toEqual(['exportDone'])
  })

  it('refuses to export an empty stage or on unsupported browsers', async () => {
    const app = createTestApp()
    const state = await ready(app)
    expect(await state.exportAudio()).toBeNull()
    app.engine.canRecord = false
    state.setSound('kick', 'kick-1')
    expect(await state.exportAudio()).toBeNull()
    expect(keys(app)).toEqual(['exportEmpty', 'exportUnsupported'])
  })

  it('cancels cleanly if playback is stopped mid-export', async () => {
    const app = createTestApp()
    const state = await ready(app)
    state.setSound('kick', 'kick-1')
    const exporting = state.exportAudio()
    await vi.waitFor(() => expect(app.engine.isPlaying).toBe(true))
    app.engine.advanceBar()
    await vi.waitFor(() => expect(app.engine.recording).toBe(true))

    state.togglePlay()
    expect(await exporting).toBeNull()
    expect(app.engine.recording).toBe(false)
    expect(keys(app)).toEqual(['exportCancelled'])
  })
})
