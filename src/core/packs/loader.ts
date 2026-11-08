import { type LocalizedText, type PackManifest, type SoundDef, packManifestSchema } from './schema'

export class PackLoadError extends Error {
  readonly kind: 'network' | 'invalid-json' | 'invalid-manifest' | 'audio'
  readonly details: readonly string[]
  readonly httpStatus: number | undefined

  constructor(
    kind: PackLoadError['kind'],
    message: string,
    details: readonly string[] = [],
    options?: ErrorOptions & { httpStatus?: number },
  ) {
    super(message, options)
    this.name = 'PackLoadError'
    this.kind = kind
    this.details = details
    this.httpStatus = options?.httpStatus
  }
}

/** Validates raw manifest data. Throws `PackLoadError` with one readable line per issue. */
export function parseManifest(data: unknown): PackManifest {
  const result = packManifestSchema.safeParse(data)
  if (!result.success) {
    const details = result.error.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
    )
    throw new PackLoadError('invalid-manifest', 'Pack manifest is invalid', details)
  }
  return result.data
}

/** Fetches and validates `<packUrl>/manifest.json`. `packUrl` must end with `/`. */
export async function fetchManifest(
  packUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<PackManifest> {
  const url = `${packUrl}manifest.json`
  let response: Response
  try {
    response = await fetchFn(url)
  } catch (cause) {
    throw new PackLoadError('network', `Could not fetch ${url}`, [], { cause })
  }
  if (!response.ok) {
    throw new PackLoadError('network', `Could not fetch ${url} (HTTP ${response.status})`, [], {
      httpStatus: response.status,
    })
  }

  let data: unknown
  try {
    data = await response.json()
  } catch (cause) {
    throw new PackLoadError('invalid-json', `${url} is not valid JSON`, [], { cause })
  }
  return parseManifest(data)
}

const MIME_BY_EXTENSION: Record<string, string> = {
  ogg: 'audio/ogg; codecs="vorbis"',
  m4a: 'audio/mp4; codecs="mp4a.40.2"',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  webm: 'audio/webm; codecs="opus"',
}

/** Returns `''`, `'maybe'` or `'probably'`, like `HTMLMediaElement.canPlayType`. */
export type CanPlayType = (mimeType: string) => string

function extensionOf(path: string): string {
  return path.slice(path.lastIndexOf('.') + 1).toLowerCase()
}

/** Picks the primary file when the browser can decode it, otherwise the fallback (if any). */
export function pickSoundFile(sound: SoundDef, canPlayType: CanPlayType): string {
  const mime = MIME_BY_EXTENSION[extensionOf(sound.file)]
  if (!sound.fallback || (mime !== undefined && canPlayType(mime) !== '')) {
    return sound.file
  }
  return sound.fallback
}

export function resolveText(
  text: LocalizedText,
  language: string,
  fallbackLanguage = 'es',
): string {
  if (typeof text === 'string') return text
  const base = language.split('-')[0] ?? language
  return text[language] ?? text[base] ?? text[fallbackLanguage] ?? Object.values(text)[0] ?? ''
}
