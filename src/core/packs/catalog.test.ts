import { fetchCatalog } from './catalog'
import { PackLoadError } from './loader'
import { makeTestManifest } from './testing'

function serve(files: Record<string, unknown>) {
  return vi.fn(async (url: string | URL | Request) => {
    const body = files[String(url)]
    return body === undefined
      ? new Response('not found', { status: 404 })
      : new Response(typeof body === 'string' ? body : JSON.stringify(body))
  }) as unknown as typeof fetch
}

describe('fetchCatalog', () => {
  it('loads every listed manifest in catalog order, with cover urls', async () => {
    const fetchFn = serve({
      '/packs/index.json': { version: 1, packs: ['b', 'a'] },
      '/packs/a/manifest.json': makeTestManifest({ id: 'a' }),
      '/packs/b/manifest.json': makeTestManifest({ id: 'b', cover: 'cover.jpg' }),
    })
    const { packs, failed } = await fetchCatalog('/packs/', fetchFn)
    expect(packs.map((p) => p.id)).toEqual(['b', 'a'])
    expect(packs[0]?.coverUrl).toBe('/packs/b/cover.jpg')
    expect(packs[1]?.coverUrl).toBeNull()
    expect(failed).toEqual([])
  })

  it('leaves out broken packs and packs whose id does not match their folder', async () => {
    const fetchFn = serve({
      '/packs/index.json': { version: 1, packs: ['ok', 'missing', 'wrong-id'] },
      '/packs/ok/manifest.json': makeTestManifest({ id: 'ok' }),
      '/packs/wrong-id/manifest.json': makeTestManifest({ id: 'other' }),
    })
    const { packs, failed } = await fetchCatalog('/packs/', fetchFn)
    expect(packs.map((p) => p.id)).toEqual(['ok'])
    expect(failed).toEqual(['missing', 'wrong-id'])
  })

  it('rejects catalogs with non kebab-case ids (no paths)', async () => {
    const fetchFn = serve({ '/packs/index.json': { version: 1, packs: ['../secret'] } })
    await expect(fetchCatalog('/packs/', fetchFn)).rejects.toBeInstanceOf(PackLoadError)
  })

  it('fails when no pack can be loaded', async () => {
    const fetchFn = serve({ '/packs/index.json': { version: 1, packs: ['gone'] } })
    await expect(fetchCatalog('/packs/', fetchFn)).rejects.toThrow(/No pack/)
  })

  it('rejects cover paths that leave the pack folder', async () => {
    const fetchFn = serve({
      '/packs/index.json': { version: 1, packs: ['a', 'b'] },
      '/packs/a/manifest.json': makeTestManifest({ id: 'a' }),
      '/packs/b/manifest.json': { ...makeTestManifest({ id: 'b' }), cover: '../a/cover.jpg' },
    })
    const { failed } = await fetchCatalog('/packs/', fetchFn)
    expect(failed).toEqual(['b'])
  })
})
