import { z } from 'zod'
import {
  MixStorageError,
  type MixRepository,
  type SaveMixInput,
  type SavedMix,
  type SavedMixSummary,
} from './repository'
import { mixSchema } from './schema'

export const MIX_STORAGE_KEY = 'ezybeatbox.mixes.v1'
const MAX_NAME_LENGTH = 60

const savedMixSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(MAX_NAME_LENGTH),
  createdAt: z.string(),
  updatedAt: z.string(),
  mix: mixSchema,
})

function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  )
}

export interface LocalStorageMixRepositoryOptions {
  /** Injectable for tests; defaults to `window.localStorage` (may throw in private mode). */
  storage?: () => Storage
  now?: () => Date
}

/** `MixRepository` backed by one JSON array in localStorage. Invalid entries are skipped. */
export class LocalStorageMixRepository implements MixRepository {
  private readonly storage: () => Storage
  private readonly now: () => Date

  constructor({ storage, now }: LocalStorageMixRepositoryOptions = {}) {
    this.storage = storage ?? (() => window.localStorage)
    this.now = now ?? (() => new Date())
  }

  async list(): Promise<SavedMixSummary[]> {
    return this.readAll()
      .map(({ mix, ...rest }) => ({ ...rest, packId: mix.packId }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async get(id: string): Promise<SavedMix | null> {
    return this.readAll().find((m) => m.id === id) ?? null
  }

  async save({ id, name, mix }: SaveMixInput): Promise<SavedMix> {
    const all = this.readAll()
    const timestamp = this.now().toISOString()
    const existing = id ? all.find((m) => m.id === id) : undefined
    if (id && !existing) throw new MixStorageError('not-found', `No saved mix with id ${id}`)

    const saved: SavedMix = {
      id: existing?.id ?? newId(),
      name: name.trim().slice(0, MAX_NAME_LENGTH) || 'Mix',
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      mix: structuredClone(mix),
    }
    this.writeAll([saved, ...all.filter((m) => m.id !== saved.id)])
    return saved
  }

  async delete(id: string): Promise<void> {
    this.writeAll(this.readAll().filter((m) => m.id !== id))
  }

  private getStorage(): Storage {
    try {
      return this.storage()
    } catch (cause) {
      throw new MixStorageError('unavailable', 'localStorage is not available', { cause })
    }
  }

  private readAll(): SavedMix[] {
    const raw = this.getStorage().getItem(MIX_STORAGE_KEY)
    if (!raw) return []
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      return []
    }
    if (!Array.isArray(data)) return []
    return data.flatMap((entry) => {
      const parsed = savedMixSchema.safeParse(entry)
      return parsed.success ? [parsed.data] : []
    })
  }

  private writeAll(mixes: SavedMix[]): void {
    try {
      this.getStorage().setItem(MIX_STORAGE_KEY, JSON.stringify(mixes))
    } catch (cause) {
      if (cause instanceof MixStorageError) throw cause
      throw new MixStorageError('quota', 'Could not write to localStorage', { cause })
    }
  }
}
