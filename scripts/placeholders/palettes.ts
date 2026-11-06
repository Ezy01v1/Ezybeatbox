/*
 * Genre sound palettes: each genre swaps the generic placeholder instruments for its own
 * signature timbres (and, through finish.ts, its own mix color). Ids stay the same, so saved
 * mixes, share links and bases keep working; only the sound and the label change.
 */
import { clap, hat, kick, reverseCymbal, riser, subDrop } from './instruments'
import {
  type CharacterRecipe,
  type Hit,
  line,
  overrideSounds,
  play,
  range,
  twoBars,
} from './recipes'
import {
  airhorn,
  bigClap,
  dembowSnare,
  eight08,
  filterSweep,
  guiro,
  kick909,
  metalHat,
  rewind,
  siren,
  talkbox,
  tapeStop,
  voice,
} from './voices'

const roll = (start: number, count: number, every: number): Hit[] =>
  Array.from({ length: count }, (_, i) => [start + i * every, 0.45 + (0.5 * i) / count] as const)

/* ---------------------------------------------------------------- Trap (C minor, 140) */
const C2 = 36
const Eb2 = 39
const F2 = 41
const G2 = 43
const Ab1 = 32
const Bb1 = 34

export function trapPalette(recipes: CharacterRecipe[]): CharacterRecipe[] {
  return overrideSounds(recipes, {
    // Metallic 808 hats instead of plain noise.
    'trap-hihat-1': {
      label: 'Rápido',
      render: (c) =>
        play(
          c,
          metalHat(),
          range(0, 32).map((s) => [s, s % 2 === 0 ? 0.9 : 0.5]),
        ),
    },
    'trap-hihat-2': {
      label: 'Tresillos',
      render: (c) =>
        play(
          c,
          metalHat(),
          range(0, 32, 2 / 3).map((s, i) => [s, i % 3 === 0 ? 0.95 : 0.5]),
        ),
    },
    'trap-hihat-3': {
      label: 'Rodada',
      render: (c) =>
        play(c, metalHat({ tau: 0.018 }), [
          ...range(0, 12).map((s): Hit => [s, s % 2 === 0 ? 0.9 : 0.55]),
          ...roll(12, 8, 0.5),
          ...range(16, 28).map((s): Hit => [s, s % 2 === 0 ? 0.9 : 0.55]),
          ...roll(28, 8, 0.5),
        ]),
    },
    'trap-hihat-4': {
      label: 'Abierto',
      render: (c) => {
        play(
          c,
          metalHat(),
          range(0, 32, 2).filter((s) => s % 8 !== 6),
        )
        play(c, metalHat({ open: true }), [6, 14, 22, 30], 0.7)
      },
    },
    // Real gliding 808s.
    'trap-bass-1': {
      label: '808',
      render: (c) =>
        line(c, eight08, [
          [0, C2, 11],
          [11, C2, 5],
          [16, Ab1, 11],
          [27, Bb1, 5],
        ]),
    },
    'trap-bass-2': {
      label: '808 Deslizado',
      render: (c) =>
        line(c, (m, d) => eight08(m, d, { glideFrom: m === G2 ? C2 : m === Eb2 ? G2 : Eb2 }), [
          [0, C2, 11],
          [11, G2, 5],
          [16, Eb2, 11],
          [27, C2, 5],
        ]),
    },
    'trap-bass-4': {
      label: '808 Pulso',
      render: (c) =>
        line(c, (m, d) => eight08(m, d, { drive: 3 }), [
          [0, C2, 3],
          [3, C2, 3],
          [6, Eb2, 2],
          [11, C2, 3],
          [16, F2, 3],
          [19, F2, 3],
          [22, Eb2, 2],
          [27, G2, 3],
        ]),
    },
    'trap-voice-1': {
      label: 'Ad-lib',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['e', 'a'], breath: 0.15 }), [
          [6, 67, 1],
          [7, 70, 2],
          [22, 72, 1],
          [23, 70, 3],
        ]),
    },
    'trap-voice-2': {
      label: 'Coro',
      render: (c) => {
        for (const top of [0, 3, 7]) {
          line(c, (m, d) => voice(m, d, { vowels: ['a', 'o'] }), [
            [0, 60 + top, 14],
            [16, 56 + top, 14],
          ])
        }
      },
    },
    'trap-voice-3': {
      label: 'Eco',
      render: (c) => {
        const shout = voice(72, 2 * c.step, { vowels: ['e', 'i'], breath: 0.12 })
        play(c, shout, [0, [3, 0.5], [6, 0.25], 16, [19, 0.5], [22, 0.25]])
      },
    },
    'trap-voice-4': {
      label: 'Grave',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['o', 'u'] }), [
          [0, 48, 7],
          [8, 51, 7],
          [16, 44, 7],
          [24, 46, 7],
        ]),
    },
    'trap-voice-5': {
      label: 'Talkbox',
      render: (c) =>
        line(c, (m, d) => talkbox(m, d, ['u', 'a', 'o']), [
          [0, 67, 3],
          [3, 70, 3],
          [6, 72, 2],
          [12, 70, 4],
          [16, 67, 3],
          [19, 63, 3],
          [22, 65, 6],
        ]),
    },
    'trap-fx-2': {
      label: 'Tape stop',
      render: (c) => play(c, tapeStop([60, 63, 67], 8 * c.step), [24]),
    },
    'trap-fx-3': {
      label: 'Sirena',
      render: (c) => play(c, siren(8 * c.step, 1.5), [0, [16, 0.6]], 0.7),
    },
    'trap-fx-4': { label: 'Rewind', render: (c) => play(c, rewind(6 * c.step), [26]) },
  })
}

/* ------------------------------------------------------------- House (F minor, 124) */
export function housePalette(recipes: CharacterRecipe[]): CharacterRecipe[] {
  return overrideSounds(recipes, {
    'house-kick-1': { label: 'Four', render: (c) => play(c, kick909(), range(0, 32, 4)) },
    'house-kick-2': {
      label: 'Profundo',
      render: (c) => play(c, kick909({ tail: 0.38 }), range(0, 32, 4)),
    },
    'house-kick-3': {
      label: 'Golpe',
      render: (c) => play(c, kick909({ tail: 0.13 }), range(0, 32, 4)),
    },
    'house-kick-4': {
      label: 'Saltado',
      render: (c) => play(c, kick909(), [...range(0, 32, 4), [14, 0.6], [30, 0.6]]),
    },
    'house-snare-1': { label: 'Clap', render: (c) => play(c, bigClap(), twoBars([4, 12])) },
    'house-snare-3': {
      label: 'Doble',
      render: (c) => play(c, bigClap(), [4, 12, 20, [27, 0.5], 28]),
    },
    'house-snare-5': {
      label: 'Capas',
      render: (c) => {
        play(c, bigClap(), twoBars([4, 12]))
        play(c, clap(), twoBars([4, 12]), 0.5)
      },
    },
    'house-hihat-1': {
      label: 'Abierto',
      render: (c) => play(c, metalHat({ open: true, tau: 0.12 }), range(2, 32, 4)),
    },
    'house-voice-2': {
      label: 'Diva',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['o', 'a', 'e'], vibrato: 0.02 }), [
          [0, 72, 6],
          [6, 75, 2],
          [8, 77, 8],
          [16, 75, 4],
          [20, 72, 4],
          [24, 70, 8],
        ]),
    },
    'house-voice-4': {
      label: 'Grito',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['o', 'a'], breath: 0.2, glideFrom: m - 5 }), [
          [14, 77, 2],
          [30, 80, 2],
        ]),
    },
    'house-voice-5': {
      label: 'Coro',
      render: (c) => {
        for (const note of [65, 68, 72]) {
          line(c, (m, d) => voice(m, d, { vowels: ['u', 'a'] }), [
            [0, note, 6],
            [8, note - 3, 6],
            [16, note - 1, 6],
            [24, note - 2, 6],
          ])
        }
      },
    },
    'house-fx-1': {
      label: 'Filtro',
      render: (c) => play(c, filterSweep([53, 56, 60], 2 * c.stepsPerBar * c.step), [0], 0.8),
    },
    'house-fx-3': {
      label: 'Cierre',
      render: (c) => play(c, filterSweep([65, 68, 72], 4 * c.step, false), [12, 28]),
    },
    'house-fx-5': {
      label: 'Redoble',
      render: (c) =>
        play(
          c,
          bigClap(),
          range(16, 32).map((s) => [s, 0.25 + (0.75 * (s - 16)) / 16]),
        ),
    },
  })
}

/* --------------------------------------------------------- Reggaetón (A minor, 95) */
const DEMBOW = [3, 6, 11, 14] as const

export function reggaetonPalette(recipes: CharacterRecipe[]): CharacterRecipe[] {
  return overrideSounds(recipes, {
    'reggaeton-snare-1': {
      label: 'Dembow',
      render: (c) => play(c, dembowSnare(), twoBars(DEMBOW)),
    },
    'reggaeton-snare-5': {
      label: 'Doble',
      render: (c) => {
        play(c, dembowSnare(), twoBars(DEMBOW))
        play(c, clap(), twoBars([6, 14]), 0.6)
      },
    },
    'reggaeton-hihat-4': {
      label: 'Güiro',
      render: (c) => play(c, guiro(2 * c.step), twoBars([0, 2, 4, 6, 8, 10, 12, 14])),
    },
    'reggaeton-hihat-5': {
      label: 'Cencerro',
      render: (c) =>
        play(
          c,
          hat({ tau: 0.02 }),
          range(0, 32).filter((s) => s % 4 !== 1),
        ),
    },
    'reggaeton-voice-1': {
      label: 'Coro',
      render: (c) => {
        for (const offset of [0, 3]) {
          line(c, (m, d) => voice(m, d, { vowels: ['o', 'e'] }), [
            [0, 69 + offset, 6],
            [8, 72 + offset, 6],
            [16, 67 + offset, 6],
            [24, 71 + offset, 6],
          ])
        }
      },
    },
    'reggaeton-voice-2': {
      label: 'Ad-lib',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['e', 'i'], breath: 0.18 }), [
          [14, 76, 1],
          [15, 74, 2],
          [30, 72, 1],
          [31, 69, 1],
        ]),
    },
    'reggaeton-voice-4': {
      label: 'Grave',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['u', 'o'] }), [
          [0, 57, 14],
          [16, 55, 14],
        ]),
    },
    'reggaeton-fx-1': { label: 'Sirena', render: (c) => play(c, siren(8 * c.step), [16], 0.7) },
    'reggaeton-fx-2': {
      label: 'Bocina',
      render: (c) => play(c, airhorn(64, 1.5 * c.step), [0, 2, 4, [6, 0.9]], 0.8),
    },
    'reggaeton-fx-3': {
      label: 'Bajón',
      render: (c) => {
        play(c, subDrop(), [0])
        play(c, kick({ ampTau: 0.3, drive: 3 }), [0], 0.5)
      },
    },
    'reggaeton-fx-4': {
      label: 'Barrido',
      render: (c) => {
        play(c, reverseCymbal(8 * c.step), [24], 0.8)
        play(c, riser(4 * c.step), [28], 0.4)
      },
    },
  })
}
