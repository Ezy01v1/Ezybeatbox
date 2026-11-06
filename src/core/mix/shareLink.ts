import { findSound } from '../packs/sounds'
import { AUDIO_CONFIG } from '../audio/config'
import type { PackManifest } from '../packs/schema'
import { idSchema } from '../packs/schema'
import { type Mix, createEmptyMix } from './types'

/**
 * Share links put the mix in the URL hash, so nothing reaches a server and no backend is
 * needed. Format v1 (URLSearchParams, only unreserved separators so nothing gets %-escaped):
 *
 *   #v=1&p=boom-bap-01&pv=1&s=kick.kick-2~snare.snare-1&m=hihat&o=voice&vol=bass.-3&mv=-2
 *
 *   v   link format version          p/pv  pack id / pack version
 *   s   character.sound pairs        m/o   muted / solo character ids
 *   vol character.volume (dB), only non-default                mv  master volume, if not 0
 *
 * Ids are kebab-case (validated), so "." and "~" can never appear inside them.
 */
export const SHARE_LINK_VERSION = 1

const PAIR_SEPARATOR = '~'
const KEY_VALUE_SEPARATOR = '.'

export type ShareLinkError = 'invalid' | 'newer-version'

/** Raw content of a link, before checking it against a pack manifest. */
export interface SharedMix {
  packId: string
  packVersion: number
  sounds: Record<string, string>
  muted: string[]
  solo: string[]
  volumes: Record<string, number>
  masterVolumeDb: number
}

export type DecodeResult = { ok: true; shared: SharedMix } | { ok: false; error: ShareLinkError }

/** Rounds to 0.1 dB and keeps the value in range (a -Infinity "silence" becomes the minimum). */
const roundDb = (db: number) =>
  Math.round(
    Math.min(
      AUDIO_CONFIG.maxVolumeDb,
      Math.max(AUDIO_CONFIG.minVolumeDb, Number.isNaN(db) ? 0 : db),
    ) * 10,
  ) / 10

function joinPairs(entries: [string, string | number][]): string {
  return entries.map(([k, v]) => `${k}${KEY_VALUE_SEPARATOR}${v}`).join(PAIR_SEPARATOR)
}

export function encodeShareLink(mix: Mix): string {
  const entries = Object.entries(mix.characters)
  // Built by hand: URLSearchParams would escape "~". Every value is a validated id or number,
  // so nothing here needs escaping.
  const params = new Map<string, string>()
  params.set('v', String(SHARE_LINK_VERSION))
  params.set('p', mix.packId)
  params.set('pv', String(mix.packVersion))

  const sounds = entries.flatMap(([id, c]) =>
    c.soundId ? [[id, c.soundId] as [string, string]] : [],
  )
  if (sounds.length) params.set('s', joinPairs(sounds))

  const muted = entries.filter(([, c]) => c.muted).map(([id]) => id)
  if (muted.length) params.set('m', muted.join(PAIR_SEPARATOR))

  const solo = entries.filter(([, c]) => c.solo).map(([id]) => id)
  if (solo.length) params.set('o', solo.join(PAIR_SEPARATOR))

  const volumes = entries
    .map(([id, c]) => [id, roundDb(c.volumeDb)] as [string, number])
    .filter(([, db]) => db !== AUDIO_CONFIG.defaultChannelVolumeDb)
  if (volumes.length) params.set('vol', joinPairs(volumes))

  const master = roundDb(mix.masterVolumeDb)
  if (master !== AUDIO_CONFIG.defaultMasterVolumeDb) params.set('mv', String(master))

  return [...params].map(([key, value]) => `${key}=${value}`).join('&')
}

const isId = (value: string) => idSchema.safeParse(value).success

function parseList(value: string | null): string[] | null {
  if (!value) return []
  const ids = value.split(PAIR_SEPARATOR)
  return ids.every(isId) ? ids : null
}

function parsePairs<T>(
  value: string | null,
  parseValue: (raw: string) => T | null,
): Record<string, T> | null {
  const result: Record<string, T> = {}
  if (!value) return result
  for (const pair of value.split(PAIR_SEPARATOR)) {
    const at = pair.indexOf(KEY_VALUE_SEPARATOR)
    const key = pair.slice(0, at)
    const parsed = at > 0 ? parseValue(pair.slice(at + 1)) : null
    if (!isId(key) || parsed === null) return null
    result[key] = parsed
  }
  return result
}

function parseDb(raw: string): number | null {
  const db = Number(raw)
  return raw !== '' && Number.isFinite(db)
    ? Math.min(AUDIO_CONFIG.maxVolumeDb, Math.max(AUDIO_CONFIG.minVolumeDb, db))
    : null
}

/** Parses a hash (with or without the leading `#`). Never throws. */
export function decodeShareLink(hash: string): DecodeResult {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const version = Number(params.get('v'))
  if (!Number.isInteger(version) || version < 1) return { ok: false, error: 'invalid' }
  if (version > SHARE_LINK_VERSION) return { ok: false, error: 'newer-version' }
  // Future versions: migrate older formats here before parsing (v1 is the first).

  const packId = params.get('p') ?? ''
  const packVersion = Number(params.get('pv'))
  const sounds = parsePairs(params.get('s'), (raw) => (isId(raw) ? raw : null))
  const muted = parseList(params.get('m'))
  const solo = parseList(params.get('o'))
  const volumes = parsePairs(params.get('vol'), parseDb)
  const master = params.has('mv')
    ? parseDb(params.get('mv') ?? '')
    : AUDIO_CONFIG.defaultMasterVolumeDb

  if (
    !isId(packId) ||
    !Number.isInteger(packVersion) ||
    packVersion < 1 ||
    !sounds ||
    !muted ||
    !solo ||
    !volumes ||
    master === null
  ) {
    return { ok: false, error: 'invalid' }
  }
  return {
    ok: true,
    shared: { packId, packVersion, sounds, muted, solo, volumes, masterVolumeDb: master },
  }
}

export interface ResolvedMix {
  mix: Mix
  /** The link was made with a different pack version; sounds may have changed. */
  packVersionChanged: boolean
  /** Sounds or characters in the link that no longer exist in the pack (skipped). */
  missingCount: number
}

/** Builds a playable `Mix` from a link for the given pack, skipping what no longer exists. */
export function resolveSharedMix(shared: SharedMix, manifest: PackManifest): ResolvedMix {
  const mix = createEmptyMix(manifest)
  mix.masterVolumeDb = shared.masterVolumeDb
  let missingCount = 0

  for (const [characterId, soundId] of Object.entries(shared.sounds)) {
    const character = manifest.characters.find((c) => c.id === characterId)
    const target = mix.characters[characterId]
    const taken = Object.values(mix.characters).some((c) => c.soundId === soundId)
    if (target && character && findSound(manifest, soundId) && !taken) target.soundId = soundId
    else missingCount++
  }
  for (const id of shared.muted) {
    const target = mix.characters[id]
    if (target) target.muted = true
  }
  for (const id of shared.solo) {
    const target = mix.characters[id]
    if (target) target.solo = true
  }
  for (const [id, db] of Object.entries(shared.volumes)) {
    const target = mix.characters[id]
    if (target) target.volumeDb = db
  }

  return { mix, packVersionChanged: shared.packVersion !== manifest.version, missingCount }
}
