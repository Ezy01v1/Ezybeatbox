import { makeTestManifest } from '../packs/testing'
import { LocalStorageMixRepository, MIX_STORAGE_KEY } from './localStorageRepository'
import { MixStorageError } from './repository'
import { createEmptyMix } from './types'

const manifest = makeTestManifest()

function makeRepo() {
  localStorage.clear()
  let tick = 0
  const repo = new LocalStorageMixRepository({
    now: () => new Date(Date.UTC(2026, 10, 4, 12, 0, tick++)),
  })
  return repo
}

describe('LocalStorageMixRepository', () => {
  it('saves, lists newest first, gets and deletes', async () => {
    const repo = makeRepo()
    const mix = createEmptyMix(manifest)
    mix.characters.kick!.soundId = 'kick-1'

    const first = await repo.save({ name: 'Primero', mix })
    const second = await repo.save({ name: '  Segundo  ', mix })

    expect((await repo.list()).map((m) => m.name)).toEqual(['Segundo', 'Primero'])
    expect((await repo.list())[0]?.packId).toBe('test-pack')
    expect((await repo.get(first.id))?.mix.characters.kick?.soundId).toBe('kick-1')

    await repo.delete(second.id)
    expect((await repo.list()).map((m) => m.id)).toEqual([first.id])
  })

  it('overwrites an existing mix, keeping its creation date', async () => {
    const repo = makeRepo()
    const saved = await repo.save({ name: 'A', mix: createEmptyMix(manifest) })
    const updated = await repo.save({ id: saved.id, name: 'B', mix: createEmptyMix(manifest) })
    expect(updated).toMatchObject({ id: saved.id, name: 'B', createdAt: saved.createdAt })
    expect(updated.updatedAt > saved.updatedAt).toBe(true)
    expect(await repo.list()).toHaveLength(1)
  })

  it('stores a copy, not a live reference', async () => {
    const repo = makeRepo()
    const mix = createEmptyMix(manifest)
    const saved = await repo.save({ name: 'A', mix })
    mix.characters.kick!.soundId = 'kick-2'
    expect((await repo.get(saved.id))?.mix.characters.kick?.soundId).toBeNull()
  })

  it('ignores corrupted storage and invalid entries', async () => {
    const repo = makeRepo()
    localStorage.setItem(MIX_STORAGE_KEY, '{not json')
    expect(await repo.list()).toEqual([])

    const valid = await repo.save({ name: 'Ok', mix: createEmptyMix(manifest) })
    const stored = JSON.parse(localStorage.getItem(MIX_STORAGE_KEY) ?? '[]')
    localStorage.setItem(MIX_STORAGE_KEY, JSON.stringify([...stored, { id: 'x', name: 'bad' }]))
    expect((await repo.list()).map((m) => m.id)).toEqual([valid.id])
  })

  it('reports a full or blocked storage as MixStorageError', async () => {
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError')
      },
    } as unknown as Storage
    const repo = new LocalStorageMixRepository({ storage: () => full })
    await expect(repo.save({ name: 'A', mix: createEmptyMix(manifest) })).rejects.toMatchObject({
      kind: 'quota',
    })

    const blocked = new LocalStorageMixRepository({
      storage: () => {
        throw new Error('SecurityError')
      },
    })
    await expect(blocked.list()).rejects.toBeInstanceOf(MixStorageError)
  })
})
