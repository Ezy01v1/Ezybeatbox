import type { CharacterRole } from '../../src/core/packs/schema'
import type { LoopBuffer } from './dsp'
import {
  type Voice,
  bassNote,
  clap,
  hat,
  kick,
  laser,
  reverseCymbal,
  rimshot,
  riser,
  scratch,
  shaker,
  snare,
  subDrop,
  vinyl,
  vocalNote,
} from './instruments'

export interface RenderContext {
  buffer: LoopBuffer
  /** Seconds per 16th note. */
  step: number
  /** 16th notes per bar. */
  stepsPerBar: number
  rng: () => number
  /**
   * Where a 16th-note step lands, in seconds (null = skip the hit). Defaults to `step * ctx.step`;
   * variations (swing, half time) override it. Only `play` and `line` honor it.
   */
  at?: (step: number) => number | null
}

export interface SoundRecipe {
  id: string
  label: string
  render: (ctx: RenderContext) => void
}

export interface CharacterRecipe {
  id: string
  role: CharacterRole
  label: string
  sounds: SoundRecipe[]
}

export type Hit = number | readonly [step: number, velocity: number]

/** Places `voice` on each 16th-note step (0-based, across the whole loop). */
export function play(ctx: RenderContext, voice: Voice, hits: readonly Hit[], gain = 1): void {
  for (const hit of hits) {
    const [step, velocity] = typeof hit === 'number' ? [hit, 1] : hit
    const time = timeOf(ctx, step)
    if (time === null) continue
    const generate = voice.create(ctx.buffer.sampleRate, ctx.rng)
    ctx.buffer.add(time, voice.duration, generate, gain * velocity)
  }
}

/** Plays a monophonic line of [step, midi, lengthInSteps] notes. */
export function line(
  ctx: RenderContext,
  make: (midi: number, duration: number) => Voice,
  notes: readonly (readonly [number, number, number])[],
): void {
  for (const [step, midi, length] of notes) {
    const time = timeOf(ctx, step)
    if (time === null) continue
    const voice = make(midi, length * ctx.step)
    ctx.buffer.add(time, voice.duration, voice.create(ctx.buffer.sampleRate, ctx.rng))
  }
}

const timeOf = (ctx: RenderContext, step: number) => (ctx.at ? ctx.at(step) : step * ctx.step)

/** Swing amount: off-beat 16ths are pushed this fraction of a step late, off-beat 8ths half. */
export const SWING = 0.33

const swingOffset = (s: number) =>
  !Number.isInteger(s) ? 0 : s % 2 === 1 ? SWING : s % 4 === 2 ? SWING / 2 : 0

/**
 * Two variations per character built from existing sounds: "Swing" (off-beat 16ths pushed
 * late) and "½ tiempo" (the first half of the pattern stretched over the whole loop). The
 * sources must place every hit through `play`/`line`, so `at` reaches them.
 */
export function withVariations(
  recipes: CharacterRecipe[],
  prefix: string,
  sources: Partial<Record<CharacterRole, { swing?: number; half?: number }>> = {},
): CharacterRecipe[] {
  return recipes.map((character) => {
    const pick = (n: number) => {
      const sound = character.sounds[n - 1]
      if (!sound) throw new Error(`${character.id} has no sound ${n}`)
      return sound
    }
    const swingFrom = pick(sources[character.role]?.swing ?? 1)
    const halfFrom = pick(sources[character.role]?.half ?? 2)
    const n = character.sounds.length
    return {
      ...character,
      sounds: [
        ...character.sounds,
        {
          id: `${prefix}${character.id}-${n + 1}`,
          label: `${swingFrom.label} swing`,
          render: (c) =>
            swingFrom.render({
              ...c,
              at: (s) => (s + swingOffset(s)) * c.step,
            }),
        },
        {
          id: `${prefix}${character.id}-${n + 2}`,
          label: `${halfFrom.label} ½`,
          render: (c) => {
            const totalSteps = Math.round(c.buffer.data.length / c.buffer.sampleRate / c.step)
            halfFrom.render({ ...c, at: (s) => (s < totalSteps / 2 ? 2 * s * c.step : null) })
          },
        },
      ],
    }
  })
}

/**
 * Replaces sounds by id (label and render), keeping ids so saved mixes, links and bases still
 * point at the same slot. Fails loudly on an unknown id.
 */
export function overrideSounds(
  recipes: CharacterRecipe[],
  overrides: Record<string, Omit<SoundRecipe, 'id'>>,
): CharacterRecipe[] {
  const known = new Set(recipes.flatMap((c) => c.sounds.map((s) => s.id)))
  for (const id of Object.keys(overrides)) {
    if (!known.has(id)) throw new Error(`overrideSounds: unknown sound ${id}`)
  }
  return recipes.map((character) => ({
    ...character,
    sounds: character.sounds.map((sound) => {
      const override = overrides[sound.id]
      return override ? { id: sound.id, ...override } : sound
    }),
  }))
}

/** Repeats a one-bar pattern (16th steps 0–15) across a two-bar loop. */
export const twoBars = (hits: readonly Hit[]): Hit[] =>
  [0, 16].flatMap((offset) =>
    hits.map((hit): Hit => (typeof hit === 'number' ? hit + offset : [hit[0] + offset, hit[1]])),
  )

export const range = (from: number, to: number, every = 1) =>
  Array.from({ length: Math.ceil((to - from) / every) }, (_, i) => from + i * every)

// D minor. MIDI: D2 = 38, D4 = 62.
const D2 = 38
const F2 = 41
const G2 = 43
const A2 = 45
const C2 = 36
const Bb1 = 34

export const BOOM_BAP_RECIPES: CharacterRecipe[] = [
  {
    id: 'kick',
    role: 'kick',
    label: 'Kick',
    sounds: [
      { id: 'kick-1', label: 'Clásico', render: (c) => play(c, kick({}), [0, 10, 16, 26, 28]) },
      {
        id: 'kick-2',
        label: 'Doble',
        render: (c) => play(c, kick({ ampTau: 0.14 }), [0, 2, 10, 16, 18, 26]),
      },
      {
        id: 'kick-3',
        label: 'Sincopado',
        render: (c) => play(c, kick({ startHz: 170 }), [0, 7, 10, 16, 23, 26, 30]),
      },
      {
        id: 'kick-4',
        label: 'Pesado',
        render: (c) => play(c, kick({ endHz: 40, ampTau: 0.3, drive: 2.5 }), [0, 10, 16, 26]),
      },
      {
        id: 'kick-5',
        label: 'Rebote',
        render: (c) =>
          play(c, kick({ ampTau: 0.12, click: 0.7 }), [0, 6, 10, 16, 22, [24, 0.7], 26]),
      },
    ],
  },
  {
    id: 'snare',
    role: 'snare',
    label: 'Snare',
    sounds: [
      { id: 'snare-1', label: 'Caja', render: (c) => play(c, snare({}), [4, 12, 20, 28]) },
      {
        id: 'snare-2',
        label: 'Rimshot',
        render: (c) => play(c, rimshot(), [4, 12, 20, 28, [15, 0.35], [31, 0.35]]),
      },
      { id: 'snare-3', label: 'Aplauso', render: (c) => play(c, clap(), [4, 12, 20, 28]) },
      {
        id: 'snare-4',
        label: 'Fantasma',
        render: (c) =>
          play(c, snare({ noiseTau: 0.1 }), [
            4,
            [7, 0.25],
            12,
            [14, 0.3],
            20,
            [23, 0.25],
            28,
            [30, 0.3],
          ]),
      },
      {
        id: 'snare-5',
        label: 'Redoble',
        render: (c) =>
          play(c, snare({ toneHz: 200 }), [4, 12, 20, 28, [29, 0.45], [30, 0.6], [31, 0.8]]),
      },
    ],
  },
  {
    id: 'hihat',
    role: 'hihat',
    label: 'Hi-hat',
    sounds: [
      {
        id: 'hihat-1',
        label: 'Corcheas',
        render: (c) =>
          play(
            c,
            hat({}),
            range(0, 32, 2).map((s) => [s, s % 4 === 0 ? 1 : 0.6]),
          ),
      },
      {
        id: 'hihat-2',
        label: 'Semicorcheas',
        render: (c) =>
          play(
            c,
            hat({ tau: 0.02 }),
            range(0, 32).map((s) => [s, s % 4 === 0 ? 1 : s % 2 === 0 ? 0.6 : 0.35]),
          ),
      },
      {
        id: 'hihat-3',
        label: 'Abierto',
        render: (c) => {
          play(
            c,
            hat({}),
            range(0, 32, 2).filter((s) => s % 16 !== 14),
          )
          play(c, hat({ tau: 0.22, cutoffHz: 6000 }), [14, 30], 0.8)
        },
      },
      {
        id: 'hihat-4',
        label: 'Swing',
        // Off-beat 8ths pushed a third of a 16th late for a shuffle feel.
        render: (c) =>
          play(
            c,
            hat({}),
            range(0, 32, 2).map((s) => [s % 4 === 2 ? s + 1 / 3 : s, s % 4 === 0 ? 1 : 0.55]),
          ),
      },
      {
        id: 'hihat-5',
        label: 'Shaker',
        render: (c) =>
          play(
            c,
            shaker(),
            range(0, 32).map((s) => [s, s % 2 === 0 ? 1 : 0.5]),
          ),
      },
    ],
  },
  {
    id: 'bass',
    role: 'bass',
    label: 'Bass',
    sounds: [
      {
        id: 'bass-1',
        label: 'Raíz',
        render: (c) =>
          line(c, bassNote, [
            [0, D2, 6],
            [10, D2, 4],
            [16, F2, 6],
            [26, C2, 6],
          ]),
      },
      {
        id: 'bass-2',
        label: 'Caminante',
        render: (c) =>
          line(c, bassNote, [
            [0, D2, 3],
            [4, F2, 3],
            [8, G2, 3],
            [12, A2, 3],
            [16, Bb1 + 12, 3],
            [20, A2, 3],
            [24, G2, 3],
            [28, F2, 3],
          ]),
      },
      {
        id: 'bass-3',
        label: 'Sub',
        render: (c) =>
          line(c, (midi, d) => bassNote(midi - 12, d, { decayTau: 2 }), [
            [0, D2, 14],
            [16, Bb1 + 12, 14],
          ]),
      },
      {
        id: 'bass-4',
        label: 'Saltarín',
        render: (c) =>
          line(c, bassNote, [
            [0, D2, 2],
            [3, D2 + 12, 1],
            [6, D2, 2],
            [10, A2, 2],
            [16, F2, 2],
            [19, F2 + 12, 1],
            [22, F2, 2],
            [26, C2 + 12, 2],
          ]),
      },
      {
        id: 'bass-5',
        label: 'Deslizado',
        render: (c) => {
          c.buffer.add(0, 6 * c.step, wrapVoice(c, bassNote(D2, 6 * c.step, { glideFrom: A2 })))
          c.buffer.add(10 * c.step, 4 * c.step, wrapVoice(c, bassNote(F2, 4 * c.step)))
          c.buffer.add(
            16 * c.step,
            8 * c.step,
            wrapVoice(c, bassNote(G2, 8 * c.step, { glideFrom: D2 })),
          )
          c.buffer.add(26 * c.step, 6 * c.step, wrapVoice(c, bassNote(C2, 6 * c.step)))
        },
      },
    ],
  },
  {
    id: 'voice',
    role: 'voice',
    label: 'Voice',
    sounds: [
      {
        id: 'voice-1',
        label: 'Llamada',
        render: (c) =>
          line(c, vocalNote, [
            [0, 69, 3],
            [4, 67, 2],
            [6, 65, 4],
            [16, 69, 3],
            [20, 72, 2],
            [22, 69, 6],
          ]),
      },
      {
        id: 'voice-2',
        label: 'Coro',
        render: (c) => {
          line(c, vocalNote, [
            [0, 62, 14],
            [16, 65, 14],
          ])
          line(c, vocalNote, [
            [0, 65, 14],
            [16, 69, 14],
          ])
        },
      },
      {
        id: 'voice-3',
        label: 'Respuesta',
        render: (c) =>
          line(c, vocalNote, [
            [8, 74, 2],
            [10, 72, 2],
            [12, 69, 3],
            [24, 67, 2],
            [26, 65, 2],
            [28, 62, 3],
          ]),
      },
      {
        id: 'voice-4',
        label: 'Grave',
        render: (c) =>
          line(c, vocalNote, [
            [0, 50, 6],
            [8, 53, 6],
            [16, 55, 6],
            [24, 53, 6],
          ]),
      },
      {
        id: 'voice-5',
        label: 'Agudo',
        render: (c) =>
          line(c, vocalNote, [
            [0, 81, 1],
            [2, 79, 1],
            [4, 77, 2],
            [12, 74, 1],
            [14, 77, 2],
            [16, 81, 1],
            [18, 84, 1],
            [20, 81, 4],
          ]),
      },
    ],
  },
  {
    id: 'fx',
    role: 'fx',
    label: 'FX',
    sounds: [
      {
        id: 'fx-1',
        label: 'Barrido',
        render: (c) => play(c, riser(c.stepsPerBar * c.step), [16]),
      },
      { id: 'fx-2', label: 'Láser', render: (c) => play(c, laser(), [14, 22, 30], 0.8) },
      {
        id: 'fx-3',
        label: 'Scratch',
        render: (c) => play(c, scratch(3 * c.step), [6, 22, [29, 0.8]]),
      },
      {
        id: 'fx-4',
        label: 'Vinilo',
        render: (c) => play(c, vinyl(2 * c.stepsPerBar * c.step), [0]),
      },
      {
        id: 'fx-5',
        label: 'Caída',
        render: (c) => {
          play(c, subDrop(), [0])
          play(c, reverseCymbal(4 * c.step), [28], 0.6)
        },
      },
    ],
  },
]

function wrapVoice(ctx: RenderContext, voice: Voice): (t: number) => number {
  return voice.create(ctx.buffer.sampleRate, ctx.rng)
}
