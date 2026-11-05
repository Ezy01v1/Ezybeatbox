import '@testing-library/jest-dom/vitest'
import '@/i18n'

// jsdom has no canvas; components must cope with a null 2D context (they skip drawing).
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext
