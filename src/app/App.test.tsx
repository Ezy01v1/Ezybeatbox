import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PackLoadError } from '@/core/packs/loader'
import { App } from './App'
import { AppStoreProvider } from './store/AppStoreProvider'
import type { FakeEngine } from './store/fakeEngine'
import { createTestApp } from './store/testing'

function renderApp(configure?: (engine: FakeEngine) => void) {
  const { engine, store } = createTestApp()
  configure?.(engine)
  render(
    <AppStoreProvider store={store} engine={engine}>
      <App />
    </AppStoreProvider>,
  )
  return { engine, store, user: userEvent.setup() }
}

async function enterStage(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Toca para empezar' }))
  return screen.findByRole('main', { name: 'Escenario' })
}

const characterRegion = (name: RegExp) => screen.getByRole('region', { name })

describe('App', () => {
  it('shows the start screen with translated texts', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1, name: 'EzyBeatbox' })).toBeInTheDocument()
    expect(screen.getByText('Arma tu beat, capa por capa.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toca para empezar' })).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: 'kick 1 para kick' }))
    expect(characterRegion(/^kick: kick 1, En espera/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'kick 1 para kick (elegido)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    act(() => engine.advanceBar())
    expect(characterRegion(/^kick: kick 1, Cantando/)).toBeInTheDocument()
  })

  it('keyboard: Enter on a palette sound assigns it (drag & drop alternative)', async () => {
    const { user } = renderApp()
    await enterStage(user)

    screen.getByRole('button', { name: 'bass 2 para bass' }).focus()
    await user.keyboard('{Enter}')
    expect(characterRegion(/^bass: bass 2, En espera/)).toBeInTheDocument()
  })

  it('the remove button clears a character on the next bar', async () => {
    const { user, engine } = renderApp()
    await enterStage(user)
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    await user.click(screen.getByRole('button', { name: 'fx 2 para fx' }))
    act(() => engine.advanceBar())

    await user.click(screen.getByRole('button', { name: 'Quitar sonido de fx' }))
    expect(characterRegion(/^fx: fx 2, Se calla/)).toBeInTheDocument()
    act(() => engine.advanceBar())
    expect(characterRegion(/^fx: En silencio/)).toBeInTheDocument()
  })

  it('drag & drop: dropping a sound on its character assigns it', async () => {
    const { user } = renderApp()
    await enterStage(user)

    const icon = screen.getByRole('button', { name: 'snare 2 para snare' })
    const snareTarget = document.querySelector('[data-drop-character="snare"]')!
    const kickTarget = document.querySelector('[data-drop-character="kick"]')!
    const elementFromPoint = vi.fn(() => snareTarget)
    document.elementFromPoint = elementFromPoint

    // Dropping on the wrong character does nothing...
    elementFromPoint.mockReturnValue(kickTarget)
    fireEvent.pointerDown(icon, { pointerId: 1, clientX: 10, clientY: 300, button: 0 })
    fireEvent.pointerMove(icon, { pointerId: 1, clientX: 40, clientY: 100 })
    fireEvent.pointerUp(icon, { pointerId: 1, clientX: 40, clientY: 100 })
    expect(characterRegion(/^snare: En silencio/)).toBeInTheDocument()

    // ...dropping on its owner assigns it.
    elementFromPoint.mockReturnValue(snareTarget)
    fireEvent.pointerDown(icon, { pointerId: 2, clientX: 10, clientY: 300, button: 0 })
    fireEvent.pointerMove(icon, { pointerId: 2, clientX: 40, clientY: 100 })
    fireEvent.pointerUp(icon, { pointerId: 2, clientX: 40, clientY: 100 })
    expect(characterRegion(/^snare: snare 2, En espera/)).toBeInTheDocument()
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
    const { user } = renderApp((engine) => {
      engine.failLoad = new PackLoadError('audio', 'boom', ['/packs/x/kick.ogg'])
    })
    await user.click(screen.getByRole('button', { name: 'Toca para empezar' }))

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/No se pudo cargar el pack/)).toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
