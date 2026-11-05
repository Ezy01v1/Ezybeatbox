import type { Mix } from './types'

export interface SavedMix {
  id: string
  name: string
  /** ISO 8601 timestamps. */
  createdAt: string
  updatedAt: string
  mix: Mix
}

export type SavedMixSummary = Omit<SavedMix, 'mix'> & { packId: string }

export interface SaveMixInput {
  /** Omit to create; pass an existing id to overwrite. */
  id?: string
  name: string
  mix: Mix
}

export class MixStorageError extends Error {
  readonly kind: 'unavailable' | 'quota' | 'not-found'

  constructor(kind: MixStorageError['kind'], message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'MixStorageError'
    this.kind = kind
  }
}

/**
 * Persistence port. Async on purpose: today it is localStorage, tomorrow an HTTP API
 * (see docs/EXTENSIONS.md) without changing callers.
 */
export interface MixRepository {
  /** Newest first. */
  list(): Promise<SavedMixSummary[]>
  get(id: string): Promise<SavedMix | null>
  save(input: SaveMixInput): Promise<SavedMix>
  delete(id: string): Promise<void>
}
