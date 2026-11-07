import { z } from 'zod'

/** Number of characters on stage. Fixed product decision; packs must provide exactly this many. */
export const CHARACTER_COUNT = 6

export const CHARACTER_ROLES = ['kick', 'snare', 'hihat', 'bass', 'voice', 'fx'] as const

/** Audio extensions a pack may reference. */
export const AUDIO_EXTENSIONS = ['ogg', 'm4a', 'mp3', 'wav', 'webm'] as const

export const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case (a-z, 0-9, "-")')
  .max(64)

/**
 * Pack-relative audio path, e.g. `kick/kick-1.ogg`. Rejects absolute paths, URLs and `..`
 * so a manifest (or, later, a shared link) can never point outside its pack folder.
 */
const audioPathSchema = z
  .string()
  .max(256)
  .regex(
    new RegExp(`^(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\\.(?:${AUDIO_EXTENSIONS.join('|')})$`),
    `must be a relative path inside the pack ending in .${AUDIO_EXTENSIONS.join('/.')}`,
  )

/** Image extensions a pack may reference (cover art). */
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const

/** Pack-relative image path, with the same rules as audio paths. */
const imagePathSchema = z
  .string()
  .max(256)
  .regex(
    new RegExp(`^(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\\.(?:${IMAGE_EXTENSIONS.join('|')})$`),
    `must be a relative path inside the pack ending in .${IMAGE_EXTENSIONS.join('/.')}`,
  )

/** Plain string, or a map of language code → text (e.g. `{ "es": "Seco", "en": "Dry" }`). */
export const localizedTextSchema = z.union([
  z.string().min(1),
  z
    .record(z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/), z.string().min(1))
    .refine((map) => Object.keys(map).length > 0, 'must contain at least one language'),
])

export const soundSchema = z.object({
  id: idSchema,
  label: localizedTextSchema,
  file: audioPathSchema,
  fallback: audioPathSchema.optional(),
})

export const characterSchema = z.object({
  id: idSchema,
  role: z.enum(CHARACTER_ROLES),
  /** Section name ("Kick", "Bajo"…): heads the character's sounds in the palette. */
  label: localizedTextSchema,
  /** The character's own name on stage ("Kai"). Any character can play any sound. */
  name: localizedTextSchema.optional(),
  sounds: z.array(soundSchema).min(1).max(12),
})

/**
 * Strict `#rrggbb`. Theme colors end up in inline styles, so anything looser (named colors,
 * `url(...)`, `var(...)`) is rejected to keep a manifest from injecting arbitrary CSS.
 */
export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a #rrggbb color')

export const STAGE_PATTERNS = ['none', 'vinyl', 'sun', 'lights', 'speed', 'kente'] as const

/**
 * Visual skin of a pack. Only the stage changes per theme; the app UI around it is shared.
 * Optional: packs without a theme use the neutral default (see visuals/theme.ts).
 */
export const themeSchema = z.object({
  id: idSchema,
  stage: z.object({
    /** Stage panel background. */
    background: hexColorSchema,
    /** Character cards. */
    panel: hexColorSchema,
    /** Card borders and character outlines. */
    outline: hexColorSchema,
    /** Text drawn on the stage and on the cards. Must contrast with `background` and `panel`. */
    ink: hexColorSchema,
    /** Beat rings and level glow behind the characters. */
    glow: hexColorSchema,
    /** Decorative shapes drawn on the stage background. */
    pattern: z.enum(STAGE_PATTERNS).optional(),
  }),
  /** One color per role: characters, status chips and palette icons. */
  roles: z.record(z.enum(CHARACTER_ROLES), hexColorSchema),
})

/**
 * A ready-made beat for the pack: which sound each character starts with. Characters left out
 * start silent. The ids are checked against the pack's characters below.
 */
export const baseSchema = z.object({
  id: idSchema,
  name: localizedTextSchema,
  sounds: z.record(idSchema, idSchema),
})

export const packManifestSchema = z
  .object({
    id: idSchema,
    name: localizedTextSchema,
    version: z.number().int().positive(),
    bpm: z.number().min(40).max(240),
    timeSignature: z.tuple([
      z.number().int().min(1).max(16),
      z.union([z.literal(2), z.literal(4), z.literal(8), z.literal(16)]),
    ]),
    loopBars: z.number().int().min(1).max(16),
    characters: z.array(characterSchema).length(CHARACTER_COUNT),
    theme: themeSchema.optional(),
    /** One line for the pack picker, e.g. "Groove cálido, bombos marcados y mucho flow." */
    description: localizedTextSchema.optional(),
    /** Pack-relative cover art for the pack picker (16:9 works best). */
    cover: imagePathSchema.optional(),
    /** Ready-made beats offered on the stage, next to "start from scratch". */
    bases: z.array(baseSchema).max(6).optional(),
  })
  .superRefine((pack, ctx) => {
    const characterIds = new Set<string>()
    const soundIds = new Set<string>()

    pack.characters.forEach((character, ci) => {
      if (characterIds.has(character.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['characters', ci, 'id'],
          message: `duplicate character id "${character.id}"`,
        })
      }
      characterIds.add(character.id)

      character.sounds.forEach((sound, si) => {
        // Sound ids are global within a pack so a mix can reference them unambiguously.
        if (soundIds.has(sound.id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['characters', ci, 'sounds', si, 'id'],
            message: `duplicate sound id "${sound.id}"`,
          })
        }
        soundIds.add(sound.id)
      })
    })

    const baseIds = new Set<string>()
    pack.bases?.forEach((base, bi) => {
      if (baseIds.has(base.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['bases', bi, 'id'],
          message: `duplicate base id "${base.id}"`,
        })
      }
      baseIds.add(base.id)
      const used = new Set<string>()
      for (const [characterId, soundId] of Object.entries(base.sounds)) {
        // Any character may play any sound of the pack, but each sound on one character only.
        const problem = !pack.characters.some((c) => c.id === characterId)
          ? `unknown character "${characterId}"`
          : !soundIds.has(soundId)
            ? `unknown sound "${soundId}"`
            : used.has(soundId)
              ? `sound "${soundId}" on two characters`
              : null
        used.add(soundId)
        if (problem) {
          ctx.addIssue({
            code: 'custom',
            path: ['bases', bi, 'sounds', characterId],
            message: `base "${base.id}": ${problem}`,
          })
        }
      }
    })
  })

export type LocalizedText = z.infer<typeof localizedTextSchema>
export type CharacterRole = (typeof CHARACTER_ROLES)[number]
export type SoundDef = z.infer<typeof soundSchema>
export type CharacterDef = z.infer<typeof characterSchema>
export type PackBase = z.infer<typeof baseSchema>
export type PackTheme = z.infer<typeof themeSchema>
export type StagePattern = (typeof STAGE_PATTERNS)[number]
export type PackManifest = z.infer<typeof packManifestSchema>
