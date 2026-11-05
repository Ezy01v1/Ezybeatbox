import {
  bassNote,
  clap,
  hat,
  kick,
  laser,
  reverseCymbal,
  rimshot,
  riser,
  scratch,
  snare,
  subDrop,
  vocalNote,
} from './instruments'
import { type CharacterRecipe, type Hit, line, play, range } from './recipes'

/*
 * Trap placeholders at ~140 BPM, 2 bars = 32 sixteenths. Half-time feel: the clap/snare lands
 * on beat 3 of each bar (steps 8 and 24). Hi-hat rolls use 32nds (half steps) and 16th-note
 * triplets (2/3 of a step). C minor. MIDI: C2 = 36.
 */
const C2 = 36
const Eb2 = 39
const F2 = 41
const G2 = 43
const Ab1 = 32
const Bb1 = 34

/** `count` hits evenly spaced from `start`, every `every` steps, with a soft velocity ramp. */
const roll = (start: number, count: number, every: number): Hit[] =>
  Array.from({ length: count }, (_, i) => [start + i * every, 0.45 + (0.5 * i) / count] as const)

export const TRAP_RECIPES: CharacterRecipe[] = [
  {
    id: 'kick',
    role: 'kick',
    label: 'Kick',
    sounds: [
      {
        id: 'trap-kick-1',
        label: '808 Largo',
        render: (c) => play(c, kick({ endHz: 42, ampTau: 0.45, drive: 2 }), [0, 11, 16, 27]),
      },
      {
        id: 'trap-kick-2',
        label: 'Corto',
        render: (c) => play(c, kick({ ampTau: 0.1, click: 0.6 }), [0, 6, 11, 16, 19, 22]),
      },
      {
        id: 'trap-kick-3',
        label: 'Doble',
        render: (c) => play(c, kick({ ampTau: 0.16 }), [0, 3, 11, 16, 19, 27, 30]),
      },
      {
        id: 'trap-kick-4',
        label: 'Distorsión',
        render: (c) => play(c, kick({ ampTau: 0.3, drive: 4, endHz: 45 }), [0, 11, 16, 27]),
      },
      {
        id: 'trap-kick-5',
        label: 'Rebote',
        render: (c) => play(c, kick({ ampTau: 0.1, click: 0.8 }), [0, 7, 10, 16, 23, 26, 29]),
      },
    ],
  },
  {
    id: 'snare',
    role: 'snare',
    label: 'Snare',
    sounds: [
      { id: 'trap-snare-1', label: 'Clap', render: (c) => play(c, clap(), [8, 24]) },
      {
        id: 'trap-snare-2',
        label: 'Caja',
        render: (c) => play(c, snare({ toneHz: 220, noiseTau: 0.09 }), [8, 24]),
      },
      {
        id: 'trap-snare-3',
        label: 'Rimshot',
        render: (c) => play(c, rimshot(), [8, 24, [14, 0.4], [30, 0.4]]),
      },
      {
        id: 'trap-snare-4',
        label: 'Chasquido',
        render: (c) => {
          play(c, clap(), [8, 24])
          play(c, rimshot(), [8, 24], 0.6)
        },
      },
      {
        id: 'trap-snare-5',
        label: 'Redoble',
        render: (c) => play(c, snare({ noiseTau: 0.07 }), [8, 24, ...roll(28, 6, 2 / 3)]),
      },
    ],
  },
  {
    id: 'hihat',
    role: 'hihat',
    label: 'Hi-hat',
    sounds: [
      {
        id: 'trap-hihat-1',
        label: 'Rápido',
        render: (c) =>
          play(
            c,
            hat({ tau: 0.018 }),
            range(0, 32).map((s) => [s, s % 2 === 0 ? 0.9 : 0.5]),
          ),
      },
      {
        id: 'trap-hihat-2',
        label: 'Tresillos',
        render: (c) =>
          play(
            c,
            hat({ tau: 0.018 }),
            range(0, 32, 2 / 3).map((s, i) => [s, i % 3 === 0 ? 0.95 : 0.5]),
          ),
      },
      {
        id: 'trap-hihat-3',
        label: 'Rodada',
        // 16ths with 32nd-note rolls into each bar's last beat.
        render: (c) =>
          play(c, hat({ tau: 0.015 }), [
            ...range(0, 12).map((s): Hit => [s, s % 2 === 0 ? 0.9 : 0.55]),
            ...roll(12, 8, 0.5),
            ...range(16, 28).map((s): Hit => [s, s % 2 === 0 ? 0.9 : 0.55]),
            ...roll(28, 8, 0.5),
          ]),
      },
      {
        id: 'trap-hihat-4',
        label: 'Abierto',
        render: (c) => {
          play(
            c,
            hat({ tau: 0.02 }),
            range(0, 32, 2).filter((s) => s % 8 !== 6),
          )
          play(c, hat({ tau: 0.2, cutoffHz: 6500 }), [6, 14, 22, 30], 0.7)
        },
      },
      {
        id: 'trap-hihat-5',
        label: 'Shaker',
        render: (c) =>
          play(
            c,
            hat({ tau: 0.04, cutoffHz: 5000 }),
            range(0, 32).map((s) => [s, s % 4 === 2 ? 1 : 0.45]),
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
        id: 'trap-bass-1',
        label: 'Sub',
        render: (c) =>
          line(c, (midi, d) => bassNote(midi, d, { decayTau: 1.6 }), [
            [0, C2, 11],
            [11, C2, 5],
            [16, Ab1, 11],
            [27, Bb1, 5],
          ]),
      },
      {
        id: 'trap-bass-2',
        label: 'Deslizado',
        render: (c) => {
          const add = (step: number, length: number, midi: number, from?: number) => {
            const voice = bassNote(midi, length * c.step, {
              decayTau: 1.4,
              ...(from === undefined ? {} : { glideFrom: from }),
            })
            c.buffer.add(step * c.step, voice.duration, voice.create(c.buffer.sampleRate, c.rng))
          }
          add(0, 11, C2)
          add(11, 5, G2, C2)
          add(16, 11, Eb2, G2)
          add(27, 5, C2, Eb2)
        },
      },
      {
        id: 'trap-bass-3',
        label: 'Grave',
        render: (c) =>
          line(c, (midi, d) => bassNote(midi - 12, d, { decayTau: 2 }), [
            [0, C2 + 12, 16],
            [16, Ab1 + 12, 16],
          ]),
      },
      {
        id: 'trap-bass-4',
        label: 'Pulso',
        render: (c) =>
          line(c, bassNote, [
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
      {
        id: 'trap-bass-5',
        label: 'Caída',
        render: (c) =>
          line(c, (midi, d) => bassNote(midi, d, { decayTau: 1.2, glideFrom: midi + 12 }), [
            [0, C2, 8],
            [16, Ab1, 8],
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
        id: 'trap-voice-1',
        label: 'Ad-lib',
        render: (c) =>
          line(c, vocalNote, [
            [6, 67, 1],
            [7, 70, 2],
            [22, 72, 1],
            [23, 70, 3],
          ]),
      },
      {
        id: 'trap-voice-2',
        label: 'Coro',
        render: (c) => {
          line(c, vocalNote, [
            [0, 60, 14],
            [16, 56, 14],
          ])
          line(c, vocalNote, [
            [0, 63, 14],
            [16, 60, 14],
          ])
        },
      },
      {
        id: 'trap-voice-3',
        label: 'Eco',
        render: (c) => {
          line(c, vocalNote, [
            [0, 72, 2],
            [16, 70, 2],
          ])
          // Quieter repeats a dotted 8th later, like a delay throw.
          for (const [step, midi] of [
            [3, 72],
            [6, 72],
            [19, 70],
            [22, 70],
          ] as const) {
            const voice = vocalNote(midi, 2 * c.step)
            c.buffer.add(
              step * c.step,
              voice.duration,
              voice.create(c.buffer.sampleRate, c.rng),
              step % 6 === 0 ? 0.3 : 0.55,
            )
          }
        },
      },
      {
        id: 'trap-voice-4',
        label: 'Grave',
        render: (c) =>
          line(c, vocalNote, [
            [0, 48, 7],
            [8, 51, 7],
            [16, 44, 7],
            [24, 46, 7],
          ]),
      },
      {
        id: 'trap-voice-5',
        label: 'Agudo',
        render: (c) =>
          line(c, vocalNote, [
            [0, 79, 1],
            [1, 77, 1],
            [2, 75, 2],
            [12, 72, 1],
            [13, 75, 3],
            [24, 79, 4],
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
        id: 'trap-fx-1',
        label: 'Riser',
        render: (c) => play(c, riser(c.stepsPerBar * c.step), [16]),
      },
      { id: 'trap-fx-2', label: 'Láser', render: (c) => play(c, laser(), [6, 14, 30], 0.8) },
      {
        id: 'trap-fx-3',
        label: 'Sirena',
        render: (c) => play(c, scratch(6 * c.step), [10, [26, 0.8]]),
      },
      {
        id: 'trap-fx-4',
        label: 'Barrido',
        render: (c) => play(c, reverseCymbal(8 * c.step), [8, 24], 0.7),
      },
      {
        id: 'trap-fx-5',
        label: 'Impacto',
        render: (c) => {
          play(c, subDrop(), [0])
          play(c, clap(), [0], 0.5)
        },
      },
    ],
  },
]
