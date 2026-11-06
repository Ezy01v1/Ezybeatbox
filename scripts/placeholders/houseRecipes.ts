import {
  bassNote,
  chord,
  clap,
  hat,
  kick,
  laser,
  pluck,
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
 * House placeholders at 124 BPM, 2 bars = 32 sixteenths. Four-on-the-floor kick, clap on 2 and
 * 4 (steps 4 and 12), open hats on the off-beats. F minor (Fm – Db – Ab – Eb feel).
 */
const F1 = 29
const Ab1 = 32
const Db2 = 37
const Eb2 = 39
const F2 = 41

export const HOUSE_RECIPES: CharacterRecipe[] = [
  {
    id: 'kick',
    role: 'kick',
    label: 'Kick',
    sounds: [
      {
        id: 'house-kick-1',
        label: 'Four',
        render: (c) => play(c, kick({ ampTau: 0.17, startHz: 130, endHz: 50 }), range(0, 32, 4)),
      },
      {
        id: 'house-kick-2',
        label: 'Profundo',
        render: (c) => play(c, kick({ ampTau: 0.3, endHz: 44, drive: 1.2 }), range(0, 32, 4)),
      },
      {
        id: 'house-kick-3',
        label: 'Golpe',
        render: (c) => play(c, kick({ ampTau: 0.12, click: 0.9, drive: 2.5 }), range(0, 32, 4)),
      },
      {
        id: 'house-kick-4',
        label: 'Saltado',
        render: (c) => play(c, kick({ ampTau: 0.15 }), [...range(0, 32, 4), [14, 0.6], [30, 0.6]]),
      },
      {
        id: 'house-kick-5',
        label: 'Garage',
        render: (c) => play(c, kick({ ampTau: 0.14 }), twoBars([0, 7, 10])),
      },
    ],
  },
  {
    id: 'snare',
    role: 'snare',
    label: 'Snare',
    sounds: [
      { id: 'house-snare-1', label: 'Clap', render: (c) => play(c, clap(), twoBars([4, 12])) },
      {
        id: 'house-snare-2',
        label: 'Caja',
        render: (c) => play(c, snare({ toneHz: 200, noiseTau: 0.1 }), twoBars([4, 12])),
      },
      {
        id: 'house-snare-3',
        label: 'Doble',
        render: (c) => play(c, clap(), [4, 12, 20, [27, 0.5], 28]),
      },
      {
        id: 'house-snare-4',
        label: 'Rim',
        render: (c) => play(c, rimshot(), twoBars([4, 12, [7, 0.5], [15, 0.4]])),
      },
      {
        id: 'house-snare-5',
        label: 'Capas',
        render: (c) => {
          play(c, clap(), twoBars([4, 12]))
          play(c, snare({ noiseTau: 0.06 }), twoBars([4, 12]), 0.5)
        },
      },
    ],
  },
  {
    id: 'hihat',
    role: 'hihat',
    label: 'Hi-hat',
    sounds: [
      {
        id: 'house-hihat-1',
        label: 'Abierto',
        render: (c) => play(c, hat({ tau: 0.09, cutoffHz: 6500 }), range(2, 32, 4)),
      },
      {
        id: 'house-hihat-2',
        label: 'Cerrado',
        render: (c) =>
          play(
            c,
            hat({ tau: 0.02 }),
            range(0, 32).map((s) => [s, s % 2 ? 0.45 : 0.9]),
          ),
      },
      {
        id: 'house-hihat-3',
        label: 'Shaker',
        render: (c) =>
          play(
            c,
            shaker(),
            range(0, 32).map((s) => [s, s % 4 === 2 ? 1 : 0.5]),
          ),
      },
      {
        id: 'house-hihat-4',
        label: 'Swing',
        render: (c) => {
          play(c, hat({ tau: 0.02 }), range(0, 32, 2))
          play(c, hat({ tau: 0.02 }), range(1.33, 32, 2), 0.5)
        },
      },
      {
        id: 'house-hihat-5',
        label: 'Ride',
        render: (c) => {
          play(c, hat({ tau: 0.25, cutoffHz: 5000 }), range(0, 32, 2), 0.6)
          play(c, hat({ tau: 0.09, cutoffHz: 6500 }), range(2, 32, 4), 0.8)
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
        id: 'house-bass-1',
        label: 'Contra',
        render: (c) =>
          line(c, bassNote, [
            [2, F1, 2],
            [6, F1, 2],
            [10, Db2 - 12, 2],
            [14, Db2 - 12, 2],
            [18, Ab1, 2],
            [22, Ab1, 2],
            [26, Eb2 - 12, 2],
            [30, Eb2 - 12, 2],
          ]),
      },
      {
        id: 'house-bass-2',
        label: 'Octavas',
        render: (c) =>
          line(
            c,
            bassNote,
            range(0, 32, 2).map((s, i) => {
              const root = [F1, Db2 - 12, Ab1, Eb2 - 12][Math.floor(s / 8)] ?? F1
              return [s, root + (i % 2 ? 12 : 0), 2] as const
            }),
          ),
      },
      {
        id: 'house-bass-3',
        label: 'Rodante',
        render: (c) =>
          line(c, bassNote, [
            [0, F1, 3],
            [3, F2 - 12, 1],
            [6, Ab1, 2],
            [10, F1, 2],
            [14, Eb2 - 12, 2],
            [16, Db2 - 12, 3],
            [19, Db2, 1],
            [22, Eb2 - 12, 2],
            [26, F1, 2],
            [30, Ab1, 2],
          ]),
      },
      {
        id: 'house-bass-4',
        label: 'Sub',
        render: (c) =>
          line(c, (m, d) => bassNote(m, d, { decayTau: 0.3 }), [
            [2, F1, 2],
            [10, Db2 - 12, 2],
            [18, Ab1, 2],
            [26, Eb2 - 12, 2],
          ]),
      },
      {
        id: 'house-bass-5',
        label: 'Órgano',
        render: (c) =>
          line(c, (m, d) => chord([m, m + 12], d, { cutoffHz: 1200, tau: 0.4 }), [
            [2, F2, 2],
            [6, F2, 1],
            [10, Db2 + 12, 2],
            [14, Db2 + 12, 1],
            [18, Ab1 + 12, 2],
            [22, Ab1 + 12, 1],
            [26, Eb2, 2],
            [30, Eb2, 1],
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
        id: 'house-voice-1',
        label: 'Piano',
        render: (c) => {
          const chords = [
            [56, 60, 65],
            [56, 61, 65],
            [56, 60, 63],
            [55, 58, 63],
          ]
          chords.forEach((notes, bar) => {
            for (const s of [0, 3, 6])
              play(c, chord(notes, 2 * c.step, { cutoffHz: 3500, tau: 0.2 }), [bar * 8 + s])
          })
        },
      },
      {
        id: 'house-voice-2',
        label: 'Diva',
        render: (c) =>
          line(c, vocalNote, [
            [0, 72, 6],
            [6, 75, 2],
            [8, 77, 8],
            [16, 75, 4],
            [20, 72, 4],
            [24, 70, 8],
          ]),
      },
      {
        id: 'house-voice-3',
        label: 'Pad',
        render: (c) => {
          play(c, chord([53, 56, 60], 16 * c.step, { cutoffHz: 1000, tau: 3, attack: 0.3 }), [0])
          play(c, chord([49, 56, 61], 16 * c.step, { cutoffHz: 1000, tau: 3, attack: 0.3 }), [16])
        },
      },
      {
        id: 'house-voice-4',
        label: 'Grito',
        render: (c) =>
          line(c, vocalNote, [
            [14, 77, 2],
            [30, 80, 2],
          ]),
      },
      {
        id: 'house-voice-5',
        label: 'Arpegio',
        render: (c) =>
          line(
            c,
            (m, d) => pluck(m, d, { tau: 0.2 }),
            range(0, 32).map((s) => [s, [65, 68, 72, 77][s % 4] ?? 65, 1] as const),
          ),
      },
    ],
  },
  {
    id: 'fx',
    role: 'fx',
    label: 'FX',
    sounds: [
      {
        id: 'house-fx-1',
        label: 'Subida',
        render: (c) => play(c, riser(2 * c.stepsPerBar * c.step), [0]),
      },
      {
        id: 'house-fx-2',
        label: 'Barrido',
        render: (c) => play(c, reverseCymbal(4 * c.step), [12, 28], 0.8),
      },
      { id: 'house-fx-3', label: 'Zap', render: (c) => play(c, laser(), [7, 23], 0.7) },
      { id: 'house-fx-4', label: 'Caída', render: (c) => play(c, subDrop(), [0]) },
      {
        id: 'house-fx-5',
        label: 'Redoble',
        render: (c) =>
          play(
            c,
            snare({ noiseTau: 0.05 }),
            range(16, 32).map((s) => [s, 0.3 + (0.7 * (s - 16)) / 16]),
          ),
      },
    ],
  },
]
