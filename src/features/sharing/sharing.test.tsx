import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '@/app/App'
import { AppStoreProvider } from '@/app/store/AppStoreProvider'
import type { AppStoreOptions } from '@/app/store/appStore'
import { createTestApp } from '@/app/store/testing'
import { exportFileName } from './download'

async function renderStage(overrides: Partial<AppStoreOptions> = {}) {
  const app = createTestApp(overrides)
  render(
    <AppStoreProvider store={app.store} engine={app.engine}>
      <App />
    </AppStoreProvider>,
  )
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Toca para empezar' }))
  await screen.findByRole('main', { name: 'Escenario' })
  return { ...app, user }
}

describe('Mis mixes', () => {
  it('saves the current mix, lists it and loads it back', async () => {
    const { user } = await renderStage()
    await user.click(screen.getByRole('button', { name: 'kick 2 para kick' }))

    await user.click(screen.getByRole('button', { name: 'Mis mixes' }))
    const dialog = screen.getByRole('dialog', { name: 'Mis mixes' })
    expect(within(dialog).getByText('Todavía no guardaste ningún mix.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Nombre del mix')).toHaveFocus()

    await user.type(within(dialog).getByLabelText('Nombre del mix'), 'Noche')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar mix actual' }))
    expect(await within(dialog).findByText('Noche')).toBeInTheDocument()
    expect(screen.getByText('Mix «Noche» guardado.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Quitar sonido de kick' }))
    await user.click(within(dialog).getByRole('button', { name: 'Cargar «Noche»' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: /^kick: kick 2/ })).toBeInTheDocument()
  })

  it('asks for confirmation before deleting, and closes with Escape', async () => {
    const { user, store } = await renderStage()
    await act(() => store.getState().saveCurrentMix('Borrar'))
    await user.click(screen.getByRole('button', { name: 'Mis mixes' }))
    const dialog = screen.getByRole('dialog', { name: 'Mis mixes' })

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar «Borrar»' }))
    expect(within(dialog).getByText('Borrar')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: '¿Seguro?' }))
    expect(await within(dialog).findByText('Todavía no guardaste ningún mix.')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mis mixes' })).toHaveFocus()
  })
})

describe('Compartir', () => {
  it('shows the share link for the current mix and copies it', async () => {
    const { user } = await renderStage()
    await user.click(screen.getByRole('button', { name: 'bass 1 para bass' }))
    await user.click(screen.getByRole('button', { name: 'Compartir' }))

    const dialog = screen.getByRole('dialog', { name: 'Compartir mix' })
    const input = within(dialog).getByRole('textbox', { name: 'Link del mix' })
    expect(input).toHaveValue('https://ezy.test/#v=1&p=test-pack&pv=1&s=bass.bass-1')

    await user.click(within(dialog).getByRole('button', { name: 'Copiar link' }))
    expect(await navigator.clipboard.readText()).toBe(
      'https://ezy.test/#v=1&p=test-pack&pv=1&s=bass.bass-1',
    )
    expect(within(dialog).getByText('¡Copiado!')).toBeInTheDocument()
  })
})

describe('opening a shared link', () => {
  it('announces it on the start screen and rebuilds the mix', async () => {
    const app = createTestApp({ initialHash: '#v=1&p=test-pack&pv=1&s=voice.voice-2' })
    render(
      <AppStoreProvider store={app.store} engine={app.engine}>
        <App />
      </AppStoreProvider>,
    )
    expect(screen.getByText('Vas a escuchar un mix que te compartieron.')).toBeInTheDocument()

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Toca para empezar' }))
    expect(
      await screen.findByText('Mix compartido cargado. Dale play para escucharlo.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /^voice: voice 2, En espera/ })).toBeInTheDocument()
  })

  it('shows a dismissable error for an invalid link', async () => {
    const { user } = await renderStage({ initialHash: '#v=1&p=%%%' })
    const message = screen.getByText(/El link del mix no es válido/)
    await user.click(within(message.closest('li')!).getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByText(/El link del mix no es válido/)).not.toBeInTheDocument()
  })
})

describe('Exportar audio', () => {
  it('waits for the loop, shows progress and downloads the recording', async () => {
    const createObjectURL = vi.fn(() => 'blob:fake')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const { user, engine } = await renderStage()
    await user.click(screen.getByRole('button', { name: 'kick 1 para kick' }))
    await user.click(screen.getByRole('button', { name: 'Exportar audio' }))
    expect(await screen.findByText('Esperando el inicio del loop…')).toBeInTheDocument()

    act(() => engine.advanceBar())
    await waitFor(() => expect(engine.recording).toBe(true))
    expect(await screen.findByText('Grabando… 0/4')).toBeInTheDocument()
    for (let i = 0; i < 4; i++) act(() => engine.advanceBar())

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(await screen.findByText('Audio exportado. Revisa tus descargas.')).toBeInTheDocument()
    click.mockRestore()
    vi.unstubAllGlobals()
  })
})

describe('exportFileName', () => {
  it('names the file by pack, date and codec', () => {
    const date = new Date(2026, 10, 4, 9, 5)
    expect(exportFileName('boom-bap-01', 'audio/webm;codecs=opus', date)).toBe(
      'ezybeatbox-boom-bap-01-2026-11-04-0905.webm',
    )
    expect(exportFileName('x', 'audio/mp4', date)).toMatch(/\.m4a$/)
  })
})
