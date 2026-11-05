import '@testing-library/jest-dom/vitest'
import '@/i18n'
import './pwaMock'

// No service workers in jsdom: the PWA registration hook is replaced by a controllable mock.
vi.mock('virtual:pwa-register/react', async () => ({
  useRegisterSW: (await import('./pwaMock')).useRegisterSWMock,
}))

// jsdom has no canvas; components must cope with a null 2D context (they skip drawing).
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext
