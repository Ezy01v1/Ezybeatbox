/**
 * The extensions are contracts only. These tests prove they are implementable and fit the
 * existing core (ids, roles, Mix), so a future implementation does not have to change it.
 */
import type { LevelReader } from '@/core/audio/AudioEngine'
import { createEmptyMix, fitMixToPack, type Mix } from '@/core/mix/types'
import { CHARACTER_ROLES, idSchema } from '@/core/packs/schema'
import { makeTestManifest } from '@/core/packs/testing'
import {
  BEATBOX_CLASS_TO_ROLE,
  type BeatRecognizer,
  LOOP_RECORDER_MIC_CONSTRAINTS,
  type LoopRecorder,
  type MixOperation,
  type MixSyncTransport,
  USER_SOUND_ID_PREFIX,
  type UserSoundHost,
  type UserSoundId,
} from './index'

const silent: LevelReader = { getLevel: () => 0 }
const noopOn = () => () => {}

describe('Loop Station contract', () => {
  it('asks the browser for the raw mic signal', () => {
    expect(LOOP_RECORDER_MIC_CONSTRAINTS.audio).toMatchObject({
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    })
  })

  it('is implementable', () => {
    const recorder: LoopRecorder = {
      state: 'idle',
      arm: async () => {},
      getInputLevel: () => silent,
      record: async () => ({
        audio: {} as AudioBuffer,
        bars: 2,
        bpm: 90,
        timeSignature: [4, 4],
        peak: 0.5,
      }),
      cancel: () => {},
      on: noopOn,
      dispose: () => {},
    }
    expect(recorder.state).toBe('idle')
  })
})

describe('user sounds', () => {
  const userId: UserSoundId = `${USER_SOUND_ID_PREFIX}3f2a9c1e-7b4d-4e8a-9f10-2c6b8d0e1a77`

  it('use ids that are valid wherever pack sound ids are (Mix, saved mixes, links)', () => {
    expect(idSchema.safeParse(userId).success).toBe(true)
  })

  it('are dropped (and counted) when a mix reaches a device that does not have them', () => {
    const manifest = makeTestManifest()
    const mix = createEmptyMix(manifest)
    mix.characters.voice!.soundId = userId
    const { missingCount, mix: fitted } = fitMixToPack(mix, manifest)
    expect(missingCount).toBe(1)
    expect(fitted.characters.voice?.soundId).toBeNull()
  })

  it('the engine host contract is implementable', () => {
    const host: UserSoundHost = { addUserSound: () => {}, removeUserSound: () => {} }
    expect(host).toBeDefined()
  })
})

describe('beat recognition contract', () => {
  it('maps every recognized class it routes to an existing character role', () => {
    for (const role of Object.values(BEATBOX_CLASS_TO_ROLE)) {
      expect(CHARACTER_ROLES).toContain(role)
    }
  })

  it('is implementable', () => {
    const recognizer: BeatRecognizer = {
      state: 'idle',
      start: async () => {},
      stop: () => {},
      on: noopOn,
      dispose: () => {},
    }
    expect(recognizer.state).toBe('idle')
  })
})

describe('collaboration contract', () => {
  /** Any Mix can be expressed as operations from an empty one: the op set is complete. */
  function toOperations(mix: Mix): MixOperation[] {
    return [
      { type: 'setMasterVolume', volumeDb: mix.masterVolumeDb },
      ...Object.entries(mix.characters).flatMap(([characterId, c]): MixOperation[] => [
        { type: 'setSound', characterId, soundId: c.soundId },
        { type: 'setMute', characterId, muted: c.muted },
        { type: 'setSolo', characterId, solo: c.solo },
        { type: 'setVolume', characterId, volumeDb: c.volumeDb },
      ]),
    ]
  }

  function applyOperation(mix: Mix, op: MixOperation): void {
    if (op.type === 'setMasterVolume') {
      mix.masterVolumeDb = op.volumeDb
      return
    }
    const character = mix.characters[op.characterId]
    if (!character) return
    if (op.type === 'setSound') character.soundId = op.soundId
    else if (op.type === 'setMute') character.muted = op.muted
    else if (op.type === 'setSolo') character.solo = op.solo
    else character.volumeDb = op.volumeDb
  }

  it('operations can rebuild any mix', () => {
    const manifest = makeTestManifest()
    const target = createEmptyMix(manifest)
    target.characters.kick!.soundId = 'kick-2'
    target.characters.bass!.solo = true
    target.characters.fx!.volumeDb = -20
    target.masterVolumeDb = -3

    const replica = createEmptyMix(manifest)
    for (const op of toOperations(target)) applyOperation(replica, op)
    expect(replica).toEqual(target)
  })

  it('the transport contract is implementable', () => {
    const transport: MixSyncTransport = {
      join: async () => ({ clientId: 'a' }),
      leave: () => {},
      send: () => {},
      on: noopOn,
    }
    expect(transport).toBeDefined()
  })
})
