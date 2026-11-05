import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { pwaMock } from '@/test/pwaMock'
import { UpdatePrompt } from './UpdatePrompt'

describe('UpdatePrompt', () => {
  it('renders nothing while there is nothing to report', () => {
    const { container } = render(<UpdatePrompt />)
    expect(container).toBeEmptyDOMElement()
  })

  it('asks before updating and reloads only on "Actualizar"', async () => {
    pwaMock.needRefresh = true
    render(<UpdatePrompt />)
    expect(screen.getByText('Hay una versión nueva de EzyBeatbox.')).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(pwaMock.updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('"Después" hides the prompt without updating', async () => {
    pwaMock.needRefresh = true
    render(<UpdatePrompt />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Después' }))
    expect(screen.queryByText('Hay una versión nueva de EzyBeatbox.')).not.toBeInTheDocument()
    expect(pwaMock.updateServiceWorker).not.toHaveBeenCalled()
  })

  it('announces offline readiness and hides it after a few seconds', () => {
    vi.useFakeTimers()
    pwaMock.offlineReady = true
    render(<UpdatePrompt />)
    expect(screen.getByText('EzyBeatbox ya funciona sin conexión.')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByText('EzyBeatbox ya funciona sin conexión.')).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
