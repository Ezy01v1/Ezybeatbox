/*
 * Genre sound palettes: each genre swaps the generic placeholder instruments for its own
 * signature timbres (and, through finish.ts, its own mix color). Ids stay the same, so saved
 * mixes, share links and bases keep working; only the sound and the label change.
 */
import { clap, hat, kick, reverseCymbal, riser, scratch, subDrop } from './instruments'
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
  breakSnare,
  dembowSnare,
  dustyKick,
  logDrum,
  shekere,
  talkingDrum,
  whistle,
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

/* ---------------------------------------------------------- Boom Bap (D minor, 90) */
export function boomBapPalette(recipes: CharacterRecipe[]): CharacterRecipe[] {
  return overrideSounds(recipes, {
    'kick-1': {
      label: 'Clásico',
      render: (c) => play(c, dustyKick(), [0, [7, 0.7], 10, 16, [23, 0.7], 26]),
    },
    'kick-4': {
      label: 'Pesado',
      render: (c) => play(c, dustyKick({ tail: 0.32 }), [0, 10, 16, [19, 0.8], 26]),
    },
    'snare-1': {
      label: 'Caja',
      render: (c) => play(c, breakSnare({ ring: 0.06 }), twoBars([4, 12])),
    },
    'snare-4': {
      label: 'Fantasma',
      render: (c) =>
        play(c, breakSnare({ ring: 0.05 }), twoBars([4, 12, [7, 0.25], [10, 0.2], [15, 0.3]])),
    },
    'voice-1': {
      label: 'Yeah',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['i', 'e', 'a'], breath: 0.2 }), [
          [14, 62, 2],
          [30, 65, 2],
        ]),
    },
    'voice-2': {
      label: 'Coro soul',
      render: (c) => {
        for (const note of [62, 65, 69]) {
          line(c, (m, d) => voice(m, d, { vowels: ['o', 'u'], vibrato: 0.018 }), [
            [0, note, 7],
            [8, note - 2, 7],
            [16, note - 4, 7],
            [24, note - 2, 7],
          ])
        }
      },
    },
    'voice-3': {
      label: 'Respuesta',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['e', 'o'], breath: 0.15 }), [
          [6, 69, 1],
          [7, 67, 2],
          [22, 65, 1],
          [23, 62, 3],
        ]),
    },
    'voice-4': {
      label: 'Grave',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['u', 'o'] }), [
          [0, 50, 14],
          [16, 46, 14],
        ]),
    },
    'voice-5': {
      label: 'Hook',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['a', 'e', 'i'], vibrato: 0.02 }), [
          [0, 74, 3],
          [3, 72, 3],
          [6, 69, 6],
          [16, 74, 3],
          [19, 77, 3],
          [22, 74, 6],
        ]),
    },
    'fx-1': {
      label: 'Scratch baby',
      render: (c) => play(c, scratch(2 * c.step), [12, 13, 14, [15, 0.7], 28, 29, 30, [31, 0.7]]),
    },
    'fx-2': { label: 'Rewind', render: (c) => play(c, rewind(6 * c.step), [26]) },
    'fx-5': {
      label: 'Tape stop',
      render: (c) => play(c, tapeStop([50, 57, 62, 65], 8 * c.step), [24]),
    },
  })
}

/* ------------------------------------------------------ Drum & Bass (E minor, 174) */
export function dnbPalette(recipes: CharacterRecipe[]): CharacterRecipe[] {
  return overrideSounds(recipes, {
    'dnb-snare-1': { label: 'Golpe', render: (c) => play(c, breakSnare(), twoBars([4, 12])) },
    'dnb-snare-2': {
      label: 'Fantasma',
      render: (c) => play(c, breakSnare(), twoBars([4, 12, [7, 0.3], [9, 0.25], [15, 0.3]])),
    },
    'dnb-snare-3': {
      label: 'Amen',
      render: (c) =>
        play(c, breakSnare({ ring: 0.08 }), [
          4,
          [7, 0.5],
          [9, 0.6],
          12,
          20,
          [23, 0.5],
          [25, 0.6],
          28,
          [30, 0.7],
          [31, 0.8],
        ]),
    },
    'dnb-hihat-3': {
      label: 'Ride',
      render: (c) => play(c, metalHat({ tau: 0.3 }), range(0, 32, 2), 0.6),
    },
    'dnb-voice-2': {
      label: 'MC',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['o', 'a'], breath: 0.25 }), [
          [0, 64, 1],
          [2, 64, 1],
          [4, 67, 2],
          [16, 64, 1],
          [18, 62, 1],
          [20, 59, 2],
        ]),
    },
    'dnb-voice-3': {
      label: 'Etéreo',
      render: (c) => {
        for (const note of [76, 79]) {
          line(c, (m, d) => voice(m, d, { vowels: ['a', 'e', 'i'], vibrato: 0.02 }), [
            [0, note, 14],
            [16, note - 4, 14],
          ])
        }
      },
    },
    'dnb-voice-5': {
      label: 'Talkbox',
      render: (c) =>
        line(c, (m, d) => talkbox(m, d, ['u', 'o', 'a']), [
          [0, 52, 6],
          [8, 55, 6],
          [16, 48, 6],
          [24, 50, 6],
        ]),
    },
    'dnb-fx-2': { label: 'Rewind', render: (c) => play(c, rewind(8 * c.step), [22]) },
    'dnb-fx-5': {
      label: 'Sirena',
      render: (c) => play(c, siren(16 * c.step, 1), [0, [16, 0.6]], 0.6),
    },
  })
}

/* --------------------------------------------------------- Afrobeat (G minor, 105) */
export function afrobeatPalette(recipes: CharacterRecipe[]): CharacterRecipe[] {
  return overrideSounds(recipes, {
    'afrobeat-hihat-1': {
      label: 'Shekere',
      render: (c) =>
        play(
          c,
          shekere(),
          range(0, 32).map((s) => [s, s % 4 === 2 ? 1 : 0.45]),
        ),
    },
    'afrobeat-hihat-5': {
      label: 'Shekere abierto',
      render: (c) => {
        play(c, shekere(), range(0, 32, 2), 0.6)
        play(c, shekere(true), range(2, 32, 4))
      },
    },
    'afrobeat-bass-2': {
      label: 'Log drum',
      render: (c) =>
        line(c, (m) => logDrum(m), [
          [0, 43, 1],
          [3, 43, 1],
          [6, 46, 1],
          [10, 41, 1],
          [14, 43, 1],
          [16, 39, 1],
          [19, 39, 1],
          [22, 41, 1],
          [26, 38, 1],
          [28, 43, 1],
        ]),
    },
    'afrobeat-voice-2': {
      label: 'Coro',
      render: (c) => {
        for (const offset of [0, 3]) {
          line(c, (m, d) => voice(m, d, { vowels: ['e', 'o'] }), [
            [0, 67 + offset, 3],
            [3, 70 + offset, 3],
            [6, 72 + offset, 6],
            [16, 70 + offset, 3],
            [19, 67 + offset, 3],
            [22, 65 + offset, 6],
          ])
        }
      },
    },
    'afrobeat-voice-4': {
      label: 'Ad-lib',
      render: (c) =>
        line(c, (m, d) => voice(m, d, { vowels: ['e', 'i', 'o'], breath: 0.18 }), [
          [12, 74, 1],
          [13, 72, 1],
          [14, 70, 2],
          [28, 77, 4],
        ]),
    },
    'afrobeat-fx-2': {
      label: 'Talking drum',
      render: (c) =>
        play(c, talkingDrum(170), [
          [24, 0.6],
          [26, 0.7],
          [27, 0.8],
          [28, 0.9],
          [30, 1],
        ]),
    },
    'afrobeat-fx-3': {
      label: 'Silbato',
      render: (c) => play(c, whistle(2 * c.step), [0, [2, 0.8], 16, [18, 0.8], [19, 0.8]], 0.7),
    },
  })
}
