import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createEmptyMix } from '@/core/mix/types'
import { PackLoadError } from '@/core/packs/loader'
import i18n from '@/i18n'
import { App } from './App'
import { AppStoreProvider } from './store/AppStoreProvider'
import type { FakeEngine } from './store/fakeEngine'
import { createTestApp, makeOtherPack } from './store/testing'

function renderApp(
  configure?: (engine: FakeEngine) => void,
  options?: Parameters<typeof createTestApp>[0],
) {
  const { engine, store, repository } = createTestApp(options)
  configure?.(engine)
  render(
    <AppStoreProvider store={store} engine={engine}>
      <App />
    </AppStoreProvider>,
  )
  return { engine, store, repository, user: userEvent.setup() }
}

async function enterStage(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Toca para empezar' }))
  return screen.findByRole('main', { name: 'Escenario' })
}

const characterRegion = (name: RegExp) => screen.getByRole('region', { name })

describe('App', () => {
  it('without a pack catalog, falls back to the classic start screen', async () => {
    renderApp()
    expect(await screen.findByRole('button', { name: 'Toca para empezar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'EzyBeatbox' })).toBeInTheDocument()
    expect(screen.getByText('Arma tu beat, capa por capa.')).toBeInTheDocument()
    expect(screen.getByText(/No se pudieron cargar los estilos/)).toBeInTheDocument()
  })

  describe('pack picker', () => {
    const withCatalog = { extraPacks: [makeOtherPack()], catalog: ['test-pack', 'other-pack'] }

    it('restores a saved mix from home before a pack has been opened', async () => {
      const { user, store, repository, engine } = renderApp(undefined, withCatalog)
      await screen.findByRole('button', { name: 'Explorar Other Pack' })
      const mix = createEmptyMix(makeOtherPack())
      mix.characters.kick!.soundId = 'other-kick-2'
      await repository.save({ name: 'Mi beat de prueba', mix })

      await user.click(screen.getByRole('button', { name: 'Mis mixes' }))
      const library = await screen.findByRole('dialog', { name: 'Mis mixes' })
      expect(within(library).queryByRole('button', { name: 'Guardar mix actual' })).toBeNull()
      expect(within(library).queryByRole('button', { name: /Eliminar/ })).toBeNull()
      expect(engine.loadedPackUrls).toEqual([])

      await user.click(within(library).getByRole('button', { name: 'Cargar «Mi beat de prueba»' }))
      await screen.findByRole('main', { name: 'Escenario' })
      expect(engine.loadedPackUrls).toEqual(['/packs/other-pack/'])
      expect(store.getState().slots.kick?.target).toBe('other-kick-2')
      expect(store.getState().playing).toBe(false)
    })

    it('uses the language chosen on the home screen in the picker and on stage', async () => {
      const { user } = renderApp(undefined, withCatalog)
      try {
        await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en')
        expect(document.documentElement.lang).toBe('en')
        expect(localStorage.getItem('ezybeatbox:language')).toBe('en')
        await user.click(await screen.findByRole('button', { name: 'Explore Test Pack' }))
        await screen.findByRole('main', { name: 'Stage' })
        expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
      } finally {
        await act(() => i18n.changeLanguage('es'))
      }
    })

    it('lists the packs and opens the one you choose', async () => {
      const { user, store } = renderApp(undefined, withCatalog)
      expect(
        screen.getByRole('heading', { level: 1, name: '¿Qué vas a crear hoy?' }),
      ).toBeInTheDocument()
      const heading = await screen.findByRole('heading', { level: 2, name: 'Other Pack' })
      const card = heading.closest('article')
      expect(card).not.toBeNull()
      expect(within(card as HTMLElement).getByText('140 BPM · 6 voces')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Explorar Other Pack' }))
      await screen.findByRole('main', { name: 'Escenario' })
      expect(store.getState().manifest?.id).toBe('other-pack')
    })

    it('returns to the picker when a shared pack fails to load', async () => {
      const { user, engine, store } = renderApp(
        (engine) => {
          engine.failLoad = new PackLoadError('audio', 'boom', ['/packs/other-pack/kick.ogg'])
        },
        { ...withCatalog, initialHash: '#v=1&p=other-pack&pv=1&s=kick.other-kick-2' },
      )
      await user.click(await screen.findByRole('button', { name: 'Toca para empezar' }))
      const alert = await screen.findByRole('alert')
      await user.click(within(alert).getByRole('button', { name: 'Cambiar estilo' }))
      expect(store.getState().openingSharedMix).toBe(false)
      expect(screen.queryByRole('alert')).toBeNull()

      engine.failLoad = null
      await user.click(await screen.findByRole('button', { name: 'Explorar Other Pack' }))
      await screen.findByRole('main', { name: 'Escenario' })
      expect(store.getState().slots.kick?.target).toBeNull()
    })

    it('"Cambiar estilo" opens the picker and you can go back to the same stage', async () => {
      const { user } = renderApp(undefined, withCatalog)
      await user.click(await screen.findByRole('button', { name: 'Explorar Test Pack' }))
      await screen.findByRole('main', { name: 'Escenario' })
      await user.click(screen.getByRole('button', { name: 'kick 1 (kick)' }))

      await user.click(screen.getByRole('button', { name: /^Cambiar estilo: Test Pack · 90 BPM/ }))
      expect(await screen.findByText('Estilo actual')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Volver al escenario' }))
      await screen.findByRole('main', { name: 'Escenario' })
      expect(
        screen.getByRole('button', { name: 'kick 1 (kick), lo toca kick' }),
      ).toBeInTheDocument()
    })

    it('the logo goes home with the beat still loaded, and "Continuar mi beat" comes back', async () => {
      const { user } = renderApp(undefined, withCatalog)
      await user.click(await screen.findByRole('button', { name: 'Explorar Test Pack' }))
      await screen.findByRole('main', { name: 'Escenario' })
      await user.click(screen.getByRole('button', { name: 'kick 1 (kick)' }))

      await user.click(screen.getByRole('button', { name: 'Ir al inicio' }))
      const banner = await screen.findByRole('region', { name: 'Continuar mi beat' })
      expect(banner).toHaveTextContent('Tu beat de Test Pack sigue aquí')

      await user.click(screen.getByRole('button', { name: 'Continuar mi beat' }))
      await screen.findByRole('main', { name: 'Escenario' })
      expect(
        screen.getByRole('button', { name: 'kick 1 (kick), lo toca kick' }),
      ).toBeInTheDocument()
    })
  })

  it('enters the stage with 6 silent characters and a palette', async () => {
    const { user } = renderApp()
    await enterStage(user)

    expect(screen.getAllByRole('region', { name: /En silencio/ })).toHaveLength(6)
    const palette = screen.getByRole('navigation', { name: 'Sonidos' })
    expect(within(palette).getAllByRole('button')).toHaveLength(12)
  })

  it('tap on a palette sound queues it, and it plays on the next bar', async () => {
    const { user, engine } = renderApp()
    await enterStage(user)
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))

    await user.click(screen.getByRole('button', { name: 'kick 1 (kick)' }))
    expect(characterRegion(/^kick: kick 1, En espera/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'kick 1 (kick), lo toca kick' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    act(() => engine.advanceBar())
    expect(characterRegion(/^kick: kick 1, Cantando/)).toBeInTheDocument()
  })

  it('keyboard: Enter on a palette sound assigns it (drag & drop alternative)', async () => {
    const { user } = renderApp()
    await enterStage(user)

    screen.getByRole('button', { name: 'bass 2 (bass)' }).focus()
    await user.keyboard('{Enter}')
    expect(characterRegion(/^bass: bass 2, En espera/)).toBeInTheDocument()
  })

  it('keyboard: a number puts the sound on that character, e.g. two kicks at once', async () => {
    const { user } = renderApp()
    await enterStage(user)

    screen.getByRole('button', { name: 'kick 1 (kick)' }).focus()
    await user.keyboard('1')
    screen.getByRole('button', { name: 'kick 2 (kick)' }).focus()
    await user.keyboard('5')
    expect(characterRegion(/^kick: kick 1, En espera/)).toBeInTheDocument()
    expect(characterRegion(/^voice: kick 2, En espera/)).toBeInTheDocument()
    expect(
      screen.getByText(/Con un número eliges quién lo toca: 1 kick · 2 snare/),
    ).toBeInTheDocument()
  })

  it('the remove button clears a character on the next bar', async () => {
    const { user, engine } = renderApp()
    await enterStage(user)
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    await user.click(screen.getByRole('button', { name: 'fx 2 (fx)' }))
    act(() => engine.advanceBar())

    await user.click(screen.getByRole('button', { name: 'Quitar sonido de fx' }))
    expect(characterRegion(/^fx: fx 2, Se calla/)).toBeInTheDocument()
    act(() => engine.advanceBar())
    expect(characterRegion(/^fx: En silencio/)).toBeInTheDocument()
  })

  it('drag & drop: any character takes any sound, and a sound moves instead of repeating', async () => {
    const { user } = renderApp()
    await enterStage(user)

    const icon = screen.getByRole('button', { name: 'snare 2 (snare)' })
    const snareTarget = document.querySelector('[data-drop-character="snare"]')!
    const kickTarget = document.querySelector('[data-drop-character="kick"]')!
    const elementFromPoint = vi.fn(() => snareTarget)
    document.elementFromPoint = elementFromPoint

    // A snare dropped on the kick character plays there...
    elementFromPoint.mockReturnValue(kickTarget)
    fireEvent.pointerDown(icon, { pointerId: 1, clientX: 10, clientY: 300, button: 0 })
    fireEvent.pointerMove(icon, { pointerId: 1, clientX: 40, clientY: 100 })
    fireEvent.pointerUp(icon, { pointerId: 1, clientX: 40, clientY: 100 })
    expect(characterRegion(/^kick: snare 2, En espera/)).toBeInTheDocument()

    // ...and dropped on the snare character it moves: one character per sound.
    elementFromPoint.mockReturnValue(snareTarget)
    fireEvent.pointerDown(icon, { pointerId: 2, clientX: 10, clientY: 300, button: 0 })
    fireEvent.pointerMove(icon, { pointerId: 2, clientX: 40, clientY: 100 })
    fireEvent.pointerUp(icon, { pointerId: 2, clientX: 40, clientY: 100 })
    expect(characterRegion(/^snare: snare 2, En espera/)).toBeInTheDocument()
    expect(characterRegion(/^kick: En silencio/)).toBeInTheDocument()
  })

  it('mute and solo are toggle buttons', async () => {
    const { user } = renderApp()
    await enterStage(user)
    const mute = screen.getByRole('button', { name: 'Silenciar hihat' })
    await user.click(mute)
    expect(mute).toHaveAttribute('aria-pressed', 'true')
    const solo = screen.getByRole('button', { name: 'Solo de voice' })
    await user.click(solo)
    expect(solo).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows a visible error with retry when the pack fails to load', async () => {
    const { user, engine } = renderApp((engine) => {
      engine.failLoad = new PackLoadError('audio', 'boom', ['/packs/x/kick.ogg'])
    })
    await user.click(await screen.findByRole('button', { name: 'Toca para empezar' }))

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/No se pudo cargar el pack/)).toBeInTheDocument()
    await user.click(within(alert).getByText('Detalles técnicos'))
    expect(within(alert).getByText('/packs/x/kick.ogg')).toBeVisible()
    engine.failLoad = null
    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }))
    await screen.findByRole('main', { name: 'Escenario' })
  })

  describe('bases', () => {
    it('loads a base on the next bar and "Desde cero" clears every character', async () => {
      const { user, engine, store } = renderApp()
      await enterStage(user)
      const bases = screen.getByRole('group', { name: 'Bases' })
      await act(() => store.getState().togglePlay())

      await user.click(within(bases).getByRole('button', { name: 'Base 1' }))
      expect(within(bases).getByRole('button', { name: 'Base 1' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(store.getState().slots.kick?.status).toBe('queued')
      act(() => engine.advanceBar())
      expect(store.getState().slots.hihat).toMatchObject({ status: 'playing', playing: 'hihat-1' })
      expect(store.getState().slots.bass?.status).toBe('empty')

      await user.click(within(bases).getByRole('button', { name: 'Base 2' }))
      act(() => engine.advanceBar())
      expect(store.getState().slots.hihat?.status).toBe('empty')
      expect(store.getState().slots.bass?.playing).toBe('bass-2')

      await user.click(within(bases).getByRole('button', { name: 'Desde cero' }))
      act(() => engine.advanceBar())
      expect(Object.values(store.getState().slots).every((s) => s.status === 'empty')).toBe(true)
    })
  })
})
