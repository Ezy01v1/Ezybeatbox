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
  tom,
  vocalNote,
} from './instruments'
import { type CharacterRecipe, line, play, range, twoBars } from './recipes'

/*
 * Reggaetón / dembow placeholders at 95 BPM, 2 bars = 32 sixteenths. The dembow snare lands on
 * steps 3, 6, 11 and 14 of each bar over four-on-the-floor kicks. A minor (Am – F – C – G feel).
 */
const A1 = 33
const C2 = 36
const D2 = 38
const E2 = 40
const F2 = 41
const G2 = 43
const A2 = 45

const DEMBOW = [3, 6, 11, 14] as const

export const REGGAETON_RECIPES: CharacterRecipe[] = [
  {
    id: 'kick',
    role: 'kick',
    label: 'Kick',
    sounds: [
      {
        id: 'reggaeton-kick-1',
        label: 'Dembow',
        render: (c) => play(c, kick({ ampTau: 0.2, drive: 2 }), twoBars([0, 4, 8, 12])),
      },
      {
        id: 'reggaeton-kick-2',
        label: 'Perreo',
        render: (c) => play(c, kick({ ampTau: 0.35, endHz: 44, drive: 2.5 }), twoBars([0, 8])),
      },
      {
        id: 'reggaeton-kick-3',
        label: 'Seco',
        render: (c) => play(c, kick({ ampTau: 0.09, click: 0.7 }), twoBars([0, 4, 8, 12])),
      },
      {
        id: 'reggaeton-kick-4',
        label: 'Saltado',
        render: (c) => play(c, kick({ ampTau: 0.15 }), twoBars([0, 4, 7, 8, 12, 15])),
      },
      {
        id: 'reggaeton-kick-5',
        label: 'Moombah',
        render: (c) =>
          play(
            c,
            kick({ ampTau: 0.25, startHz: 180, drive: 3 }),
            [0, 4, 8, 12, 16, 20, 24, 27, 28],
          ),
      },
    ],
  },
  {
    id: 'snare',
    role: 'snare',
    label: 'Snare',
    sounds: [
      {
        id: 'reggaeton-snare-1',
        label: 'Dembow',
        render: (c) => play(c, snare({ toneHz: 240, noiseTau: 0.08 }), twoBars(DEMBOW)),
      },
      { id: 'reggaeton-snare-2', label: 'Palmas', render: (c) => play(c, clap(), twoBars(DEMBOW)) },
      {
        id: 'reggaeton-snare-3',
        label: 'Aro',
        render: (c) => play(c, rimshot(), twoBars(DEMBOW)),
      },
      {
        id: 'reggaeton-snare-4',
        label: 'Timbal',
        render: (c) =>
          play(c, tom({ hz: 330, tau: 0.08, slap: 0.5 }), [
            ...twoBars(DEMBOW),
            [29, 0.6],
            [30, 0.7],
            [31, 0.8],
          ]),
      },
      {
        id: 'reggaeton-snare-5',
        label: 'Doble',
        render: (c) => {
          play(c, snare({ toneHz: 240, noiseTau: 0.08 }), twoBars(DEMBOW))
          play(c, clap(), twoBars([6, 14]), 0.6)
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
        id: 'reggaeton-hihat-1',
        label: 'Corcheas',
        render: (c) => play(c, hat({ tau: 0.025 }), range(0, 32, 2)),
      },
      {
        id: 'reggaeton-hihat-2',
        label: 'Contratiempo',
        render: (c) => play(c, hat({ tau: 0.12, cutoffHz: 6000 }), range(2, 32, 4)),
      },
      {
        id: 'reggaeton-hihat-3',
        label: 'Shaker',
        render: (c) =>
          play(
            c,
            shaker(),
            range(0, 32).map((s) => [s, s % 2 ? 0.5 : 1]),
          ),
      },
      {
        id: 'reggaeton-hihat-4',
        label: 'Güiro',
        render: (c) =>
          play(
            c,
            hat({ tau: 0.05, cutoffHz: 3500 }),
            twoBars([0, [1, 0.5], 2, 4, [5, 0.5], 6, 8, [9, 0.5], 10, 12, 14]),
          ),
      },
      {
        id: 'reggaeton-hihat-5',
        label: 'Cencerro',
        render: (c) =>
          play(
            c,
            hat({ tau: 0.02 }),
            range(0, 32).filter((s) => s % 4 !== 1),
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
        id: 'reggaeton-bass-1',
        label: 'Tumbao',
        render: (c) =>
          line(c, bassNote, [
            [0, A1, 3],
            [3, A1, 3],
            [8, F2 - 12, 3],
            [11, F2 - 12, 5],
            [16, C2, 3],
            [19, C2, 3],
            [24, G2 - 12, 3],
            [27, G2 - 12, 5],
          ]),
      },
      {
        id: 'reggaeton-bass-2',
        label: 'Sub',
        render: (c) =>
          line(c, (m, d) => bassNote(m, d, { decayTau: 1.5 }), [
            [0, A1, 8],
            [8, F2 - 12, 8],
            [16, C2, 8],
            [24, G2 - 12, 8],
          ]),
      },
      {
        id: 'reggaeton-bass-3',
        label: 'Rebote',
        render: (c) =>
          line(c, bassNote, [
            [0, A1, 2],
            [3, A2 - 12, 2],
            [6, E2 - 12, 2],
            [8, F2 - 12, 2],
            [11, F2 - 12, 2],
            [14, A1, 2],
            [16, C2, 2],
            [19, C2, 2],
            [22, D2 - 12, 2],
            [24, G2 - 12, 2],
            [27, G2 - 12, 2],
            [30, A1, 2],
          ]),
      },
      {
        id: 'reggaeton-bass-4',
        label: 'Deslizado',
        render: (c) =>
          line(c, (m, d) => bassNote(m, d, { decayTau: 1, glideFrom: m + 5 }), [
            [0, A1, 6],
            [8, F2 - 12, 6],
            [16, C2, 6],
            [24, G2 - 12, 6],
          ]),
      },
      {
        id: 'reggaeton-bass-5',
        label: 'Guitarra',
        render: (c) =>
          line(c, (m, d) => pluck(m, d, { tau: 0.25 }), [
            [0, A2, 2],
            [3, C2 + 12, 2],
            [6, E2 + 12, 2],
            [8, F2, 2],
            [11, A2, 2],
            [14, C2 + 12, 2],
            [16, C2 + 12, 2],
            [19, E2 + 12, 2],
            [22, G2, 2],
            [24, G2, 2],
            [27, D2 + 12, 2],
            [30, G2, 2],
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
        id: 'reggaeton-voice-1',
        label: 'Coro',
        render: (c) =>
          line(c, vocalNote, [
            [0, 69, 6],
            [8, 72, 6],
            [16, 67, 6],
            [24, 71, 6],
          ]),
      },
      {
        id: 'reggaeton-voice-2',
        label: 'Ad-lib',
        render: (c) =>
          line(c, vocalNote, [
            [14, 76, 1],
            [15, 74, 2],
            [30, 72, 1],
            [31, 69, 1],
          ]),
      },
      {
        id: 'reggaeton-voice-3',
        label: 'Piano',
        render: (c) => {
          const stab = (step: number, notes: number[]) =>
            play(c, chord(notes, 2 * c.step, { tau: 0.15, cutoffHz: 3000 }), [step])
          for (const offset of [0, 3, 6]) stab(offset, [57, 60, 64])
          for (const offset of [8, 11, 14]) stab(offset, [53, 57, 60])
          for (const offset of [16, 19, 22]) stab(offset, [55, 60, 64])
          for (const offset of [24, 27, 30]) stab(offset, [55, 59, 62])
        },
      },
      {
        id: 'reggaeton-voice-4',
        label: 'Grave',
        render: (c) =>
          line(c, vocalNote, [
            [0, 57, 14],
            [16, 55, 14],
          ]),
      },
      {
        id: 'reggaeton-voice-5',
        label: 'Melodía',
        render: (c) =>
          line(c, (m, d) => pluck(m, d, { tau: 0.4 }), [
            [0, 76, 3],
            [3, 74, 3],
            [6, 72, 2],
            [8, 72, 3],
            [11, 69, 5],
            [16, 72, 3],
            [19, 74, 3],
            [22, 76, 2],
            [24, 74, 8],
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
        id: 'reggaeton-fx-1',
        label: 'Sirena',
        render: (c) => play(c, riser(c.stepsPerBar * c.step), [16]),
      },
      { id: 'reggaeton-fx-2', label: 'Láser', render: (c) => play(c, laser(), [14, 30], 0.8) },
      {
        id: 'reggaeton-fx-3',
        label: 'Bajón',
        render: (c) => play(c, subDrop(), [0]),
      },
      {
        id: 'reggaeton-fx-4',
        label: 'Barrido',
        render: (c) => play(c, reverseCymbal(8 * c.step), [24], 0.8),
      },
      {
        id: 'reggaeton-fx-5',
        label: 'Timbales',
        render: (c) =>
          play(c, tom({ hz: 260, tau: 0.1, slap: 0.4 }), [
            [24, 0.6],
            [26, 0.7],
            [27, 0.8],
            [28, 0.9],
            [30, 1],
            [31, 1],
          ]),
      },
    ],
  },
]
