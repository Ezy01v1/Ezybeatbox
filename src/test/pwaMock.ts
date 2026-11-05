import { useState } from 'react'

/**
 * Test double for `virtual:pwa-register/react` (wired in setup.ts). Tests set the initial
 * flags; they reset before each test.
 */
export const pwaMock = {
  needRefresh: false,
  offlineReady: false,
  updateServiceWorker: vi.fn(async () => {}),
}

beforeEach(() => {
  pwaMock.needRefresh = false
  pwaMock.offlineReady = false
  pwaMock.updateServiceWorker.mockClear()
})

export function useRegisterSWMock() {
  return {
    needRefresh: useState(pwaMock.needRefresh),
    offlineReady: useState(pwaMock.offlineReady),
    updateServiceWorker: pwaMock.updateServiceWorker,
  }
}
