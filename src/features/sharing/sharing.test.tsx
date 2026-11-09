import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '@/app/App'
import { AppStoreProvider } from '@/app/store/AppStoreProvider'
import type { AppStoreOptions } from '@/app/store/appStore'
import { createTestApp } from '@/app/store/testing'
import { MIX_STORAGE_KEY } from '@/core/mix/localStorageRepository'
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
  it('can load a saved mix even if its stored date is damaged', async () => {
    const { user, store, engine } = await renderStage()
    await user.click(screen.getByRole('button', { name: 'kick 2 (kick)' }))
    const saved = engine.getMix()
    const timestamp = '2026-11-08T10:00:00.000Z'
    localStorage.setItem(
      MIX_STORAGE_KEY,
      JSON.stringify([
        { id: 'damaged', name: 'Noche', createdAt: timestamp, updatedAt: 'bad date', mix: saved },
      ]),
    )
    await act(() => store.getState().refreshSavedMixes())
    await user.click(screen.getByRole('button', { name: 'Quitar sonido de kick' }))
    await user.click(screen.getByRole('button', { name: 'Mis mixes' }))

    const dialog = screen.getByRole('dialog', { name: 'Mis mixes' })
    expect(within(dialog).queryByText(/Guardado el/)).toBeNull()
    await user.click(within(dialog).getByRole('button', { name: 'Cargar «Noche»' }))
    expect(store.getState().slots.kick?.target).toBe('kick-2')
  })

  it('keeps the entered name and beat when saving fails, then lets the user retry', async () => {
    const { user, store, engine } = await renderStage()
    await user.click(screen.getByRole('button', { name: 'kick 2 (kick)' }))
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    act(() => engine.advanceBar())
    await user.click(screen.getByRole('button', { name: 'Mis mixes' }))
    const dialog = screen.getByRole('dialog', { name: 'Mis mixes' })
    const name = within(dialog).getByLabelText('Nombre del mix')
    const save = within(dialog).getByRole('button', { name: 'Guardar mix actual' })
    await user.type(name, 'Noche')
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    try {
      await user.click(save)
      expect(within(dialog).getByRole('alert')).toHaveTextContent(
        'No se pudo usar el almacenamiento',
      )
      expect(name).toHaveValue('Noche')
      expect(store.getState().slots.kick?.playing).toBe('kick-2')

      await user.click(save)
      expect(await within(dialog).findByText('Noche')).toBeInTheDocument()
      expect(within(dialog).queryByRole('alert')).toBeNull()
      expect(name).toHaveValue('')
    } finally {
      storage.mockRestore()
    }
  })

  it('saves the current mix, lists it and loads it back', async () => {
    const { user } = await renderStage()
    await user.click(screen.getByRole('button', { name: 'kick 2 (kick)' }))

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
    expect(within(dialog).getByLabelText('Nombre del mix')).toHaveFocus()
    await user.tab()
    expect(within(dialog).getByRole('button', { name: 'Guardar mix actual' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mis mixes' })).toHaveFocus()
  })
})

describe('Compartir', () => {
  it('keeps keyboard focus inside the dialog and restores it on Escape', async () => {
    const { user } = await renderStage()
    const opener = screen.getByRole('button', { name: 'Compartir' })
    opener.focus()
    await user.keyboard('{Enter}')

    const dialog = screen.getByRole('dialog', { name: 'Compartir mix' })
    const close = within(dialog).getByRole('button', { name: 'Cerrar' })
    const copy = within(dialog).getByRole('button', { name: 'Copiar link' })
    expect(within(dialog).getByRole('textbox', { name: 'Link del mix' })).toHaveFocus()

    await user.tab({ shift: true })
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(copy).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(opener).toHaveFocus()
  })

  it('shows the share link for the current mix and copies it', async () => {
    const { user } = await renderStage()
    await user.click(screen.getByRole('button', { name: 'bass 1 (bass)' }))
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

  it('shows a dismissible invalid-link notice before opening a pack', async () => {
    const { engine, store } = createTestApp({ initialHash: '#v=1&p=%%%' })
    render(
      <AppStoreProvider store={store} engine={engine}>
        <App />
      </AppStoreProvider>,
    )
    const user = userEvent.setup()
    const message = screen.getByText(/El enlace del mix no es válido/)
    await user.click(within(message.closest('li')!).getByRole('button', { name: 'Cerrar aviso' }))
    expect(message).not.toBeInTheDocument()
    expect(engine.loadedPackUrls).toEqual([])
  })
})

describe('Exportar audio', () => {
  it('waits for the loop, shows progress and downloads the recording', async () => {
    const createObjectURL = vi.fn(() => 'blob:fake')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const { user, engine } = await renderStage()
    await user.click(screen.getByRole('button', { name: 'kick 1 (kick)' }))
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
