import { LocalStorageMixRepository } from '@/core/mix/localStorageRepository'
import type { PackManifest } from '@/core/packs/schema'
import { makeTestManifest } from '@/core/packs/testing'
import { type AppStoreOptions, createAppStore } from './appStore'
import { FakeEngine } from './fakeEngine'

interface TestAppOptions extends Partial<AppStoreOptions> {
  /** Extra packs served at /packs/<id>/ next to the default `test-pack`. */
  extraPacks?: PackManifest[]
  /** Serve /packs/index.json with these ids. Without it the catalog 404s (picker fallback). */
  catalog?: string[]
}

/** Store + fake engine + test manifest(s) served under /packs/, for tests. */
export function createTestApp({ extraPacks = [], catalog, ...overrides }: TestAppOptions = {}) {
  localStorage.clear()
  const engine = new FakeEngine()
  const manifest = makeTestManifest()
  const files = new Map<string, unknown>(
    [manifest, ...extraPacks].map((pack) => [`/packs/${pack.id}/manifest.json`, pack]),
  )
  if (catalog) files.set('/packs/index.json', { version: 1, packs: catalog })

  const fetchFn = vi.fn(async (url: string | URL | Request) => {
    const body = files.get(String(url))
    return body === undefined
      ? new Response('not found', { status: 404 })
      : new Response(JSON.stringify(body))
  })
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

/** A second valid pack (`other-pack`) with its own sound ids, for pack-switching tests. */
export function makeOtherPack(): PackManifest {
  const base = makeTestManifest({ id: 'other-pack', name: 'Other Pack', bpm: 140 })
  return {
    ...base,
    characters: base.characters.map((c) => ({
      ...c,
      sounds: c.sounds.map((s) => ({ ...s, id: `other-${s.id}`, label: `other ${s.label}` })),
    })),
  }
}
