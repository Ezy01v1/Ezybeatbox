import { z } from 'zod'
import { AUDIO_CONFIG } from '../audio/config'
import { idSchema } from '../packs/schema'
import type { Mix } from './types'

const volumeSchema = z.number().min(AUDIO_CONFIG.minVolumeDb).max(AUDIO_CONFIG.maxVolumeDb)

export const characterMixSchema = z.object({
  soundId: idSchema.nullable(),
  muted: z.boolean(),
  solo: z.boolean(),
  volumeDb: volumeSchema,
})

/** Validates a `Mix` read from storage or the network (never trust persisted data). */
export const mixSchema = z.object({
  schemaVersion: z.number().int().positive(),
  packId: idSchema,
  packVersion: z.number().int().positive(),
  masterVolumeDb: volumeSchema,
  characters: z.record(idSchema, characterMixSchema),
}) satisfies z.ZodType<Mix>
