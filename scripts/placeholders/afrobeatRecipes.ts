import {
  bassNote,
  chord,
  clap,
  cowbell,
  hat,
  kick,
  pluck,
  reverseCymbal,
  rimshot,
  riser,
  shaker,
  snare,
  subDrop,
  tom,
  vocalNote,
} from './instruments'
import { type CharacterRecipe, line, play, range, twoBars } from './recipes'

/*
 * Afrobeats placeholders at 105 BPM, 2 bars = 32 sixteenths. Syncopated kick around the
 * tresillo (steps 0, 3, 6 / 8, 11, 14), rim on 2 and 4, shakers and log-drum style percussion.
 * G minor (Gm – Eb – Bb – F feel).
 */
const G1 = 31
const Bb1 = 34
const C2 = 36
const D2 = 38
const Eb2 = 39
const F2 = 41

export const AFROBEAT_RECIPES: CharacterRecipe[] = [
  {
    id: 'kick',
    role: 'kick',
    label: 'Kick',
    sounds: [
      {
        id: 'afrobeat-kick-1',
        label: 'Tresillo',
        render: (c) => play(c, kick({ ampTau: 0.16 }), twoBars([0, 3, 6, 10])),
      },
      {
        id: 'afrobeat-kick-2',
        label: 'Suave',
        render: (c) => play(c, kick({ ampTau: 0.22, click: 0.2, drive: 1.2 }), twoBars([0, 7, 10])),
      },
      {
        id: 'afrobeat-kick-3',
        label: 'Amapiano',
        render: (c) => play(c, kick({ ampTau: 0.2 }), range(0, 32, 4)),
      },
      {
        id: 'afrobeat-kick-4',
        label: 'Saltado',
        render: (c) =>
          play(c, kick({ ampTau: 0.13, click: 0.6 }), [0, 3, 6, 8, 11, 16, 19, 22, 26, 29]),
      },
      {
        id: 'afrobeat-kick-5',
        label: 'Profundo',
        render: (c) => play(c, kick({ ampTau: 0.35, endHz: 42, drive: 2 }), twoBars([0, 6, 10])),
      },
    ],
  },
  {
    id: 'snare',
    role: 'snare',
    label: 'Snare',
    sounds: [
      { id: 'afrobeat-snare-1', label: 'Aro', render: (c) => play(c, rimshot(), twoBars([4, 12])) },
      {
        id: 'afrobeat-snare-2',
        label: 'Palmas',
        render: (c) => play(c, clap(), twoBars([4, 12, [15, 0.5]])),
      },
      {
        id: 'afrobeat-snare-3',
        label: 'Caja',
        render: (c) => play(c, snare({ toneHz: 260, noiseTau: 0.07 }), twoBars([4, 12])),
      },
      {
        id: 'afrobeat-snare-4',
        label: 'Clave',
        render: (c) => play(c, rimshot(), twoBars([0, 3, 6, 10, 12]), 0.8),
      },
      {
        id: 'afrobeat-snare-5',
        label: 'Capas',
        render: (c) => {
          play(c, rimshot(), twoBars([4, 12]))
          play(c, clap(), twoBars([4, 12]), 0.6)
        },
      },
    ],
  },
  {
    id: 'hihat',
    role: 'hihat',
    label: 'Shaker',
    sounds: [
      {
        id: 'afrobeat-hihat-1',
        label: 'Shaker',
        render: (c) =>
          play(
            c,
            shaker(),
            range(0, 32).map((s) => [s, s % 4 === 2 ? 1 : 0.4]),
          ),
      },
      {
        id: 'afrobeat-hihat-2',
        label: 'Cencerro',
        render: (c) => play(c, cowbell(), twoBars([0, 3, 6, 8, 10, 12, 14]), 0.7),
      },
      {
        id: 'afrobeat-hihat-3',
        label: 'Hi-hat',
        render: (c) => play(c, hat({ tau: 0.02 }), twoBars([0, 2, 3, 6, 8, 10, 11, 14])),
      },
      {
        id: 'afrobeat-hihat-4',
        label: 'Congas',
        render: (c) =>
          play(
            c,
            tom({ hz: 320, tau: 0.09, bend: 1.2, slap: 0.4 }),
            twoBars([2, [3, 0.6], 7, 10, [11, 0.6], 14]),
          ),
      },
      {
        id: 'afrobeat-hihat-5',
        label: 'Abierto',
        render: (c) => {
          play(c, shaker(), range(0, 32, 2), 0.6)
          play(c, hat({ tau: 0.1, cutoffHz: 6500 }), range(2, 32, 4), 0.8)
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
        id: 'afrobeat-bass-1',
        label: 'Groove',
        render: (c) =>
          line(c, bassNote, [
            [0, G1, 3],
            [3, G1, 2],
            [6, Bb1, 2],
            [10, C2, 4],
            [16, Eb2 - 12, 3],
            [19, Eb2 - 12, 2],
            [22, F2 - 12, 2],
            [26, D2 - 12, 4],
          ]),
      },
      {
        id: 'afrobeat-bass-2',
        label: 'Log drum',
        render: (c) =>
          play(
            c,
            tom({ hz: 70, tau: 0.25, bend: 2.2, slap: 0.1 }),
            [0, 3, 6, 10, 14, 16, 19, 22, 26, 28],
          ),
      },
      {
        id: 'afrobeat-bass-3',
        label: 'Sub',
        render: (c) =>
          line(c, (m, d) => bassNote(m, d, { decayTau: 1.4 }), [
            [0, G1, 10],
            [10, Bb1, 6],
            [16, Eb2 - 12, 10],
            [26, F2 - 12, 6],
          ]),
      },
      {
        id: 'afrobeat-bass-4',
        label: 'Saltón',
        render: (c) =>
          line(c, bassNote, [
            [0, G1, 1],
            [2, G1 + 12, 1],
            [3, G1, 2],
            [6, D2 - 12, 2],
            [8, F2 - 12, 2],
            [11, G1, 2],
            [16, Eb2 - 12, 1],
            [18, Eb2, 1],
            [19, Eb2 - 12, 2],
            [22, Bb1, 2],
            [24, C2, 2],
            [27, D2 - 12, 2],
          ]),
      },
      {
        id: 'afrobeat-bass-5',
        label: 'Deslizado',
        render: (c) =>
          line(c, (m, d) => bassNote(m, d, { decayTau: 0.8, glideFrom: m - 5 }), [
            [0, G1, 6],
            [6, Bb1, 4],
            [16, Eb2 - 12, 6],
            [22, F2 - 12, 4],
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
        id: 'afrobeat-voice-1',
        label: 'Guitarra',
        render: (c) =>
          line(c, (m, d) => pluck(m, d, { tau: 0.2 }), [
            [0, 74, 1],
            [2, 70, 1],
            [3, 67, 1],
            [6, 70, 1],
            [8, 74, 1],
            [10, 72, 1],
            [11, 70, 1],
            [14, 67, 1],
            [16, 75, 1],
            [18, 70, 1],
            [19, 67, 1],
            [22, 72, 1],
            [24, 74, 1],
            [26, 72, 1],
            [27, 70, 1],
            [30, 65, 1],
          ]),
      },
      {
        id: 'afrobeat-voice-2',
        label: 'Coro',
        render: (c) =>
          line(c, vocalNote, [
            [0, 67, 3],
            [3, 70, 3],
            [6, 72, 6],
            [16, 70, 3],
            [19, 67, 3],
            [22, 65, 6],
          ]),
      },
      {
        id: 'afrobeat-voice-3',
        label: 'Piano',
        render: (c) => {
          const chords = [
            [55, 58, 62],
            [55, 58, 63],
            [53, 58, 62],
            [53, 57, 60],
          ]
          chords.forEach((notes, bar) => {
            for (const s of [2, 6])
              play(c, chord(notes, 2 * c.step, { cutoffHz: 2800, tau: 0.25 }), [bar * 8 + s])
          })
        },
      },
      {
        id: 'afrobeat-voice-4',
        label: 'Ad-lib',
        render: (c) =>
          line(c, vocalNote, [
            [12, 74, 1],
            [13, 72, 1],
            [14, 70, 2],
            [28, 77, 4],
          ]),
      },
      {
        id: 'afrobeat-voice-5',
        label: 'Marimba',
        render: (c) =>
          line(
            c,
            (m, d) => pluck(m, d, { tau: 0.12 }),
            twoBars([0, 3, 6, 8, 11, 14]).map((hit, i) => {
              const step = typeof hit === 'number' ? hit : hit[0]
              return [step, [79, 74, 77, 74, 70, 72][i % 6] ?? 79, 2] as const
            }),
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
        id: 'afrobeat-fx-1',
        label: 'Subida',
        render: (c) => play(c, riser(c.stepsPerBar * c.step), [16]),
      },
      {
        id: 'afrobeat-fx-2',
        label: 'Tambor',
        render: (c) =>
          play(c, tom({ hz: 160, tau: 0.15, bend: 1.8 }), [
            [24, 0.6],
            [26, 0.7],
            [27, 0.8],
            [28, 0.9],
            [30, 1],
          ]),
      },
      {
        id: 'afrobeat-fx-3',
        label: 'Silbato',
        render: (c) =>
          line(c, (m, d) => pluck(m, d, { tau: 1 }), [
            [0, 96, 2],
            [2, 96, 2],
            [16, 96, 3],
          ]),
      },
      { id: 'afrobeat-fx-4', label: 'Bajón', render: (c) => play(c, subDrop(), [0]) },
      {
        id: 'afrobeat-fx-5',
        label: 'Barrido',
        render: (c) => play(c, reverseCymbal(8 * c.step), [8, 24], 0.7),
      },
    ],
  },
]
