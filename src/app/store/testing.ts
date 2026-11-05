import { LocalStorageMixRepository } from '@/core/mix/localStorageRepository'
import { makeTestManifest } from '@/core/packs/testing'
import { type AppStoreOptions, createAppStore } from './appStore'
import { FakeEngine } from './fakeEngine'

/** Store + fake engine + test manifest served at /packs/test-pack/, for tests. */
export function createTestApp(overrides: Partial<AppStoreOptions> = {}) {
  localStorage.clear()
  const engine = new FakeEngine()
  const manifest = makeTestManifest()
  const fetchFn = vi.fn(async (url: string | URL | Request) =>
    String(url).startsWith('/packs/test-pack/')
      ? new Response(JSON.stringify(manifest))
      : new Response('not found', { status: 404 }),
  )
  const repository = new LocalStorageMixRepository()
  const onLinkConsumed = vi.fn()
  const store = createAppStore({
    engine,
    packsBaseUrl: '/packs/',
    defaultPackId: 'test-pack',
    repository,
    shareBaseUrl: 'https://ezy.test/',
    onLinkConsumed,
    fetchFn: fetchFn as typeof fetch,
    ...overrides,
  })
  return { engine, store, manifest, repository, fetchFn, onLinkConsumed }
}
