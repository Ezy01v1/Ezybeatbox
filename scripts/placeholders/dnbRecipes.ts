import {
  bassNote,
  chord,
  clap,
  hat,
  kick,
  laser,
  reese,
  reverseCymbal,
  rimshot,
  riser,
  shaker,
  snare,
  subDrop,
  vocalNote,
} from './instruments'
import { type CharacterRecipe, line, play, range, twoBars } from './recipes'

/*
 * Drum & bass placeholders at 174 BPM, 2 bars = 32 sixteenths. Two-step: kick on 1 and the "and"
 * of 3 (steps 0 and 10), snare on 2 and 4 (steps 4 and 12). E minor.
 */
const E1 = 28
const G1 = 31
const A1 = 33
const C2 = 36
const D2 = 38

export const DNB_RECIPES: CharacterRecipe[] = [
  {
    id: 'kick',
    role: 'kick',
    label: 'Kick',
    sounds: [
      {
        id: 'dnb-kick-1',
        label: 'Two-step',
        render: (c) => play(c, kick({ ampTau: 0.1, click: 0.7, drive: 2 }), twoBars([0, 10])),
      },
      {
        id: 'dnb-kick-2',
        label: 'Rodante',
        render: (c) => play(c, kick({ ampTau: 0.1, click: 0.6 }), [0, 10, 16, 23, 26]),
      },
      {
        id: 'dnb-kick-3',
        label: 'Jungla',
        render: (c) => play(c, kick({ ampTau: 0.08, click: 0.8 }), [0, 2, 10, 16, 18, 25, 26]),
      },
      {
        id: 'dnb-kick-4',
        label: 'Pesado',
        render: (c) => play(c, kick({ ampTau: 0.2, drive: 3.5, endHz: 46 }), twoBars([0, 10])),
      },
      {
        id: 'dnb-kick-5',
        label: 'Medio tiempo',
        render: (c) => play(c, kick({ ampTau: 0.18, drive: 2 }), [0, 16, 22]),
      },
    ],
  },
  {
    id: 'snare',
    role: 'snare',
    label: 'Snare',
    sounds: [
      {
        id: 'dnb-snare-1',
        label: 'Golpe',
        render: (c) => play(c, snare({ toneHz: 210, noiseTau: 0.09 }), twoBars([4, 12])),
      },
      {
        id: 'dnb-snare-2',
        label: 'Fantasma',
        render: (c) =>
          play(
            c,
            snare({ toneHz: 210, noiseTau: 0.07 }),
            twoBars([4, 12, [7, 0.3], [9, 0.25], [15, 0.3]]),
          ),
      },
      {
        id: 'dnb-snare-3',
        label: 'Amen',
        render: (c) =>
          play(c, snare({ toneHz: 230, noiseTau: 0.06 }), [
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
      {
        id: 'dnb-snare-4',
        label: 'Clap',
        render: (c) => {
          play(c, clap(), twoBars([4, 12]))
          play(c, rimshot(), twoBars([4, 12]), 0.5)
        },
      },
      {
        id: 'dnb-snare-5',
        label: 'Medio tiempo',
        render: (c) => play(c, snare({ toneHz: 190, noiseTau: 0.14 }), [8, 24]),
      },
    ],
  },
  {
    id: 'hihat',
    role: 'hihat',
    label: 'Hi-hat',
    sounds: [
      {
        id: 'dnb-hihat-1',
        label: 'Corcheas',
        render: (c) =>
          play(
            c,
            hat({ tau: 0.018 }),
            range(0, 32, 2).map((s) => [s, s % 4 ? 1 : 0.6]),
          ),
      },
      {
        id: 'dnb-hihat-2',
        label: 'Rápido',
        render: (c) =>
          play(
            c,
            hat({ tau: 0.012 }),
            range(0, 32).map((s) => [s, s % 2 ? 0.45 : 0.9]),
          ),
      },
      {
        id: 'dnb-hihat-3',
        label: 'Ride',
        render: (c) => play(c, hat({ tau: 0.2, cutoffHz: 5500 }), range(0, 32, 2), 0.7),
      },
      {
        id: 'dnb-hihat-4',
        label: 'Shaker',
        render: (c) =>
          play(
            c,
            shaker(),
            range(0, 32).map((s) => [s, s % 4 === 2 ? 1 : 0.45]),
          ),
      },
      {
        id: 'dnb-hihat-5',
        label: 'Abierto',
        render: (c) => {
          play(c, hat({ tau: 0.015 }), range(0, 32, 2))
          play(c, hat({ tau: 0.12, cutoffHz: 6500 }), range(6, 32, 8), 0.8)
        },
      },
    ],
  },
  {
    id: 'bass',
    role: 'bass',
    label: 'Bass',
    sounds: [
      {
        id: 'dnb-bass-1',
        label: 'Reese',
        render: (c) =>
          line(c, reese, [
            [0, E1 + 12, 10],
            [10, G1 + 12, 6],
            [16, C2, 10],
            [26, D2, 6],
          ]),
      },
      {
        id: 'dnb-bass-2',
        label: 'Sub',
        render: (c) =>
          line(c, (m, d) => bassNote(m, d, { decayTau: 2 }), [
            [0, E1, 10],
            [10, G1, 6],
            [16, C2 - 12, 10],
            [26, D2 - 12, 6],
          ]),
      },
      {
        id: 'dnb-bass-3',
        label: 'Rodante',
        render: (c) =>
          line(c, bassNote, [
            [0, E1, 3],
            [3, E1 + 12, 1],
            [6, E1, 2],
            [10, G1, 3],
            [14, A1, 2],
            [16, C2 - 12, 3],
            [19, C2, 1],
            [22, C2 - 12, 2],
            [26, D2 - 12, 3],
            [30, E1, 2],
          ]),
      },
      {
        id: 'dnb-bass-4',
        label: 'Gruñido',
        render: (c) =>
          line(c, (m, d) => reese(m, d, { cutoffHz: 1800 }), [
            [0, E1 + 12, 2],
            [3, E1 + 12, 2],
            [6, E1 + 12, 1],
            [10, G1 + 12, 4],
            [16, C2, 2],
            [19, C2, 2],
            [22, C2, 1],
            [26, D2, 4],
          ]),
      },
      {
        id: 'dnb-bass-5',
        label: 'Deslizado',
        render: (c) =>
          line(c, (m, d) => bassNote(m, d, { decayTau: 1.5, glideFrom: m + 7 }), [
            [0, E1, 16],
            [16, C2 - 12, 16],
          ]),
      },
    ],
  },
  {
    id: 'voice',
    role: 'voice',
    label: 'Voice',
    sounds: [
      {
        id: 'dnb-voice-1',
        label: 'Pad',
        render: (c) => {
          play(c, chord([52, 55, 59], 16 * c.step, { cutoffHz: 900, tau: 3, attack: 0.25 }), [0])
          play(c, chord([48, 52, 55], 16 * c.step, { cutoffHz: 900, tau: 3, attack: 0.25 }), [16])
        },
      },
      {
        id: 'dnb-voice-2',
        label: 'MC',
        render: (c) =>
          line(c, vocalNote, [
            [0, 64, 1],
            [2, 64, 1],
            [4, 67, 2],
            [16, 64, 1],
            [18, 62, 1],
            [20, 59, 2],
          ]),
      },
      {
        id: 'dnb-voice-3',
        label: 'Etéreo',
        render: (c) =>
          line(c, vocalNote, [
            [0, 76, 14],
            [16, 72, 14],
          ]),
      },
      {
        id: 'dnb-voice-4',
        label: 'Stab',
        render: (c) =>
          play(c, chord([64, 67, 71], 2 * c.step, { cutoffHz: 3500, tau: 0.12 }), [6, 14, 22, 30]),
      },
      {
        id: 'dnb-voice-5',
        label: 'Grave',
        render: (c) =>
          line(c, vocalNote, [
            [0, 52, 7],
            [8, 55, 7],
            [16, 48, 7],
            [24, 50, 7],
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
        id: 'dnb-fx-1',
        label: 'Subida',
        render: (c) => play(c, riser(2 * c.stepsPerBar * c.step), [0]),
      },
      { id: 'dnb-fx-2', label: 'Láser', render: (c) => play(c, laser(), [6, 22], 0.8) },
      { id: 'dnb-fx-3', label: 'Bajón', render: (c) => play(c, subDrop(), [0]) },
      {
        id: 'dnb-fx-4',
        label: 'Barrido',
        render: (c) => play(c, reverseCymbal(8 * c.step), [8, 24], 0.7),
      },
      {
        id: 'dnb-fx-5',
        label: 'Sirena',
        render: (c) => play(c, riser(c.stepsPerBar * c.step), [0, 16], 0.6),
      },
    ],
  },
]
