import { CHARACTER_ROLES, type PackManifest } from './schema'

/** Builds a valid 6-character manifest for tests; override any field as needed. */
export function makeTestManifest(overrides: Partial<PackManifest> = {}): PackManifest {
  return {
    id: 'test-pack',
    name: 'Test Pack',
    version: 1,
    bpm: 90,
    timeSignature: [4, 4],
    loopBars: 2,
    characters: CHARACTER_ROLES.map((role) => ({
      id: role,
      role,
      label: role,
      sounds: [1, 2].map((n) => ({
        id: `${role}-${n}`,
        label: `${role} ${n}`,
        file: `${role}/${role}-${n}.ogg`,
        fallback: `${role}/${role}-${n}.m4a`,
      })),
    })),
    bases: [
      {
        id: 'base-1',
        name: 'Base 1',
        sounds: { kick: 'kick-1', snare: 'snare-1', hihat: 'hihat-1' },
      },
      { id: 'base-2', name: 'Base 2', sounds: { kick: 'kick-2', bass: 'bass-2' } },
    ],
    ...overrides,
  }
}
