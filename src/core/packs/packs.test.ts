import { PackLoadError, fetchManifest, parseManifest, pickSoundFile, resolveText } from './loader'
import { makeTestManifest } from './testing'

function expectInvalid(data: unknown, detailPattern: RegExp) {
  try {
    parseManifest(data)
  } catch (error) {
    expect(error).toBeInstanceOf(PackLoadError)
    const details = (error as PackLoadError).details.join('\n')
    expect(details).toMatch(detailPattern)
    return
  }
  throw new Error('expected manifest to be rejected')
}

describe('parseManifest', () => {
  it('accepts a base with a sound from another section, but not unknown or repeated ones', () => {
    expect(() =>
      parseManifest(
        makeTestManifest({ bases: [{ id: 'b', name: 'B', sounds: { kick: 'snare-1' } }] }),
      ),
    ).not.toThrow()
    expectInvalid(
      makeTestManifest({ bases: [{ id: 'b', name: 'B', sounds: { kick: 'nope' } }] }),
      /unknown sound "nope"/,
    )
    expectInvalid(
      makeTestManifest({
        bases: [{ id: 'b', name: 'B', sounds: { kick: 'snare-1', snare: 'snare-1' } }],
      }),
      /on two characters/,
    )
  })

  it('accepts a valid manifest', () => {
    const manifest = makeTestManifest()
    expect(parseManifest(manifest)).toEqual(manifest)
  })

  it('requires exactly 6 characters', () => {
    const manifest = makeTestManifest()
    expectInvalid({ ...manifest, characters: manifest.characters.slice(0, 5) }, /characters/)
  })

  it('rejects duplicate character ids', () => {
    const manifest = makeTestManifest()
    const [first, second, ...rest] = manifest.characters
    expectInvalid(
      { ...manifest, characters: [first, { ...second, id: first?.id }, ...rest] },
      /duplicate character id "kick"/,
    )
  })

  it('rejects duplicate sound ids across characters', () => {
    const manifest = makeTestManifest()
    const snare = manifest.characters[1]!
    snare.sounds[0] = { ...snare.sounds[0]!, id: 'kick-1' }
    expectInvalid(manifest, /duplicate sound id "kick-1"/)
  })

  it.each(['../secret.ogg', '/abs/kick.ogg', 'https://evil.example/kick.ogg', 'kick/kick.exe'])(
    'rejects unsafe or unsupported audio path %s',
    (file) => {
      const manifest = makeTestManifest()
      manifest.characters[0]!.sounds[0]!.file = file
      expectInvalid(manifest, /characters\.0\.sounds\.0\.file/)
    },
  )

  it('rejects out-of-range bpm and invalid time signatures', () => {
    expectInvalid(makeTestManifest({ bpm: 500 }), /bpm/)
    expectInvalid({ ...makeTestManifest(), timeSignature: [4, 3] }, /timeSignature/)
  })

  it('rejects unknown roles', () => {
    const manifest = makeTestManifest()
    expectInvalid(
      {
        ...manifest,
        characters: [
          { ...manifest.characters[0], role: 'guitar' },
          ...manifest.characters.slice(1),
        ],
      },
      /role/,
    )
  })

  it('accepts localized labels', () => {
    const manifest = makeTestManifest()
    manifest.characters[0]!.label = { es: 'Bombo', en: 'Kick' }
    expect(() => parseManifest(manifest)).not.toThrow()
  })

  describe('theme', () => {
    const theme = {
      id: 'hip-hop',
      stage: {
        background: '#e8a588',
        panel: '#f3e6d3',
        outline: '#2a3550',
        ink: '#2a3550',
        glow: '#fbf1e4',
        pattern: 'vinyl' as const,
      },
      roles: {
        kick: '#e8702a',
        snare: '#2a9a8f',
        hihat: '#f0b93a',
        bass: '#2a3550',
        voice: '#b03a7a',
        fx: '#5b8fb9',
      },
    }

    it('is optional', () => {
      expect(parseManifest(makeTestManifest()).theme).toBeUndefined()
    })

    it('accepts a complete theme', () => {
      expect(parseManifest(makeTestManifest({ theme })).theme).toEqual(theme)
    })

    it('rejects colors that are not #rrggbb, so no CSS can be injected', () => {
      for (const bad of ['red', '#fff', 'url(x)', 'var(--x)', '#e8a588;color:red']) {
        expectInvalid(
          makeTestManifest({ theme: { ...theme, stage: { ...theme.stage, background: bad } } }),
          /#rrggbb/,
        )
      }
    })

    it('requires a color for every role', () => {
      const roles = Object.fromEntries(
        Object.entries(theme.roles).filter(([role]) => role !== 'fx'),
      )
      expectInvalid({ ...makeTestManifest(), theme: { ...theme, roles } }, /roles/)
    })
  })
})

describe('fetchManifest', () => {
  it('fetches manifest.json under the pack url and validates it', async () => {
    const manifest = makeTestManifest()
    const fetchFn = vi.fn(async () => new Response(JSON.stringify(manifest)))

    await expect(fetchManifest('/packs/test-pack/', fetchFn)).resolves.toEqual(manifest)
    expect(fetchFn).toHaveBeenCalledWith('/packs/test-pack/manifest.json')
  })

  it('reports HTTP errors as network errors', async () => {
    const fetchFn = vi.fn(async () => new Response('nope', { status: 404 }))
    await expect(fetchManifest('/packs/x/', fetchFn)).rejects.toMatchObject({ kind: 'network' })
  })

  it('reports malformed JSON', async () => {
    const fetchFn = vi.fn(async () => new Response('{not json'))
    await expect(fetchManifest('/packs/x/', fetchFn)).rejects.toMatchObject({
      kind: 'invalid-json',
    })
  })
})

describe('pickSoundFile', () => {
  const sound = { id: 'k', label: 'k', file: 'k/k.ogg', fallback: 'k/k.m4a' }

  it('uses the primary file when the browser can play it', () => {
    expect(pickSoundFile(sound, () => 'probably')).toBe('k/k.ogg')
  })

  it('uses the fallback when the browser cannot play the primary', () => {
    expect(pickSoundFile(sound, (mime) => (mime.startsWith('audio/mp4') ? 'maybe' : ''))).toBe(
      'k/k.m4a',
    )
  })

  it('uses the primary file when there is no fallback', () => {
    expect(pickSoundFile({ id: 'k', label: 'k', file: 'k/k.ogg' }, () => '')).toBe('k/k.ogg')
  })
})

describe('resolveText', () => {
  it('returns plain strings as-is', () => {
    expect(resolveText('Seco', 'en')).toBe('Seco')
  })

  it('picks exact language, then base language, then fallback', () => {
    const text = { es: 'Seco', en: 'Dry' }
    expect(resolveText(text, 'en')).toBe('Dry')
    expect(resolveText(text, 'en-US')).toBe('Dry')
    expect(resolveText(text, 'fr')).toBe('Seco')
  })
})
