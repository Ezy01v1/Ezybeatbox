import { PackLoadError } from '@/core/packs/loader'
import { createTestApp, makeOtherPack } from './testing'

const setup = createTestApp

describe('appStore', () => {
  it('starts on the start screen', () => {
    expect(setup().store.getState().phase).toBe('start')
  })

  it('begin() unlocks audio, loads the pack and exposes empty slots', async () => {
    const { store } = setup()
    await store.getState().begin()

    const state = store.getState()
    expect(state.phase).toBe('ready')
    expect(state.contextState).toBe('running')
    expect(state.manifest?.id).toBe('test-pack')
    expect(Object.keys(state.slots)).toHaveLength(6)
    expect(state.slots.kick?.status).toBe('empty')
  })

  it('reports blocked audio', async () => {
    const { engine, store } = setup()
    engine.failUnlock = true
    await store.getState().begin()
    expect(store.getState()).toMatchObject({ phase: 'error', error: { kind: 'audio-blocked' } })
  })

  it('loads only the first requested pack while audio is unlocking', async () => {
    const { engine, store, fetchFn } = setup({ extraPacks: [makeOtherPack()] })
    const { begin } = store.getState()
    await Promise.all([begin('other-pack'), begin('test-pack')])

    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual(['/packs/other-pack/manifest.json'])
    expect(engine.loadedPackUrls).toEqual(['/packs/other-pack/'])
    expect(store.getState().manifest?.id).toBe('other-pack')
  })

  it('retries the selected pack if audio was blocked before loading it', async () => {
    const { engine, store } = setup({ extraPacks: [makeOtherPack()] })
    engine.failUnlock = true
    await store.getState().begin('other-pack')
    engine.failUnlock = false
    await store.getState().begin()

    expect(store.getState().manifest?.id).toBe('other-pack')
  })

  it('keeps the current beat through a temporary manifest error and retries the requested pack', async () => {
    const { engine, store, fetchFn } = setup({ extraPacks: [makeOtherPack()] })
    await store.getState().begin()
    await store.getState().togglePlay()
    fetchFn.mockResolvedValueOnce(new Response(null, { status: 503 }))

    await store.getState().begin('other-pack')
    expect(store.getState()).toMatchObject({ phase: 'error', manifest: { id: 'test-pack' } })
    expect(engine.isPlaying).toBe(true)

    await store.getState().begin()
    expect(store.getState()).toMatchObject({ phase: 'ready', manifest: { id: 'other-pack' } })
    expect(engine.loadedPackUrls).toEqual(['/packs/test-pack/', '/packs/other-pack/'])
  })

  it('reports pack errors with details', async () => {
    const { engine, store } = setup()
    engine.failLoad = new PackLoadError('audio', 'boom', ['/packs/x/kick.ogg'])
    await store.getState().begin()
    expect(store.getState().error).toEqual({ kind: 'pack', details: ['/packs/x/kick.ogg'] })
  })

  it('tracks queued → playing → stopping → empty across bar lines', async () => {
    const { engine, store } = setup()
    await store.getState().begin()
    await store.getState().togglePlay()

    store.getState().setSound('kick', 'kick-1')
    expect(store.getState().slots.kick?.status).toBe('queued')

    engine.advanceBar()
    expect(store.getState().slots.kick).toMatchObject({ status: 'playing', playing: 'kick-1' })

    store.getState().clearSound('kick')
    expect(store.getState().slots.kick?.status).toBe('stopping')

    engine.advanceBar()
    expect(store.getState().slots.kick?.status).toBe('empty')
  })

  it('recovers a slot whose start event was lost (Tone.Draw ran too late)', async () => {
    const { engine, store } = setup()
    await store.getState().begin()
    await store.getState().togglePlay()
    store.getState().setSound('kick', 'kick-1')

    engine.advanceBar({ dropSlotEvents: true })
    expect(store.getState().slots.kick).toMatchObject({ status: 'playing', playing: 'kick-1' })
  })

  it('keeps selections queued after stopping, and resets the position', async () => {
    const { engine, store } = setup()
    await store.getState().begin()
    await store.getState().togglePlay()
    store.getState().setSound('bass', 'bass-2')
    engine.advanceBar()
    engine.advanceBar()

    await store.getState().togglePlay()
    expect(store.getState()).toMatchObject({ playing: false, position: { bar: 0, beat: 0 } })
    expect(store.getState().slots.bass).toMatchObject({ status: 'queued', target: 'bass-2' })
  })

  it('toggles mute and solo', async () => {
    const { store } = setup()
    await store.getState().begin()
    store.getState().toggleMute('snare')
    store.getState().toggleSolo('voice')
    expect(store.getState().slots.snare?.muted).toBe(true)
    expect(store.getState().slots.voice?.solo).toBe(true)
    store.getState().toggleMute('snare')
    expect(store.getState().slots.snare?.muted).toBe(false)
  })

  it('one character per sound: setting it elsewhere moves it', async () => {
    const { engine, store } = setup()
    await store.getState().begin()
    await store.getState().togglePlay()
    store.getState().setSound('kick', 'kick-1')
    store.getState().setSound('voice', 'kick-2')
    engine.advanceBar()

    store.getState().setSound('bass', 'kick-1')
    engine.advanceBar()
    expect(store.getState().slots.kick?.status).toBe('empty')
    expect(store.getState().slots.bass?.playing).toBe('kick-1')
    expect(store.getState().slots.voice?.playing).toBe('kick-2')
  })

  it('drop() runs for one bar from the next bar line, only while playing', async () => {
    const { engine, store } = setup()
    await store.getState().begin()
    store.getState().drop()
    expect(store.getState().dropState).toBe('idle')

    await store.getState().togglePlay()
    store.getState().drop()
    expect(store.getState().dropState).toBe('queued')
    store.getState().drop() // already queued: ignored
    engine.advanceBar()
    expect(store.getState().dropState).toBe('dropping')
    engine.advanceBar()
    expect(store.getState().dropState).toBe('idle')

    store.getState().drop()
    await store.getState().togglePlay() // stopping cancels it
    expect(store.getState().dropState).toBe('idle')
  })

  it('setTempo() lands on the next bar while playing, is saved in the mix and comes back', async () => {
    const { engine, store } = setup()
    await store.getState().begin()
    expect(store.getState().tempo).toEqual({ bpm: 90, target: 90 })

    store.getState().setTempo(80) // stopped: right away
    expect(store.getState().tempo).toEqual({ bpm: 80, target: 80 })

    await store.getState().togglePlay()
    store.getState().nudgeTempo(2)
    store.getState().nudgeTempo(2) // quick taps add up before the bar line
    expect(store.getState().tempo).toEqual({ bpm: 80, target: 84 })
    store.getState().setTempo(200) // clamped to +15 %
    expect(store.getState().tempo).toEqual({ bpm: 80, target: 103 })
    engine.advanceBar()
    expect(store.getState().tempo).toEqual({ bpm: 103, target: 103 })
    expect(engine.getMix().bpm).toBe(103)

    const mix = engine.getMix()
    store.getState().setTempo(90)
    engine.advanceBar()
    store.getState().applyMix(mix)
    expect(store.getState().tempo.target).toBe(103)
  })

  it('surprise() queues a new beat with the rhythm section, each from its own section', async () => {
    const { store } = setup()
    await store.getState().begin()
    const before = Object.values(store.getState().slots).map((s) => s.target)

    store.getState().surprise()
    const { slots } = store.getState()
    for (const id of ['kick', 'snare', 'hihat', 'bass']) {
      expect(slots[id]?.target).toMatch(new RegExp(`^${id}-\\d+$`))
    }
    expect(Object.values(slots).map((s) => s.target)).not.toEqual(before)
  })
})
