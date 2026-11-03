/**
 * Generates the 30 placeholder loops (6 characters × 5 variants) for `boom-bap-01`, plus its
 * manifest, into public/packs/boom-bap-01/.
 *
 *   npm run generate:placeholders               # create missing files only
 *   npm run generate:placeholders -- --force    # overwrite audio and manifest
 *   npm run generate:placeholders -- --wav      # skip ffmpeg, write .wav files
 *
 * Existing files are kept unless --force, so recorded samples that replaced a placeholder are
 * never overwritten by accident.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type PackManifest, type SoundDef, packManifestSchema } from '../src/core/packs/schema'
import { BOOM_BAP_RECIPES } from './placeholders/recipes'
import { PLACEHOLDER_SAMPLE_RATE, renderPlaceholder } from './placeholders/render'
import { encodeWav } from './placeholders/wav'

const PACK = {
  id: 'boom-bap-01',
  name: 'Boom Bap',
  version: 1,
  bpm: 90,
  timeSignature: [4, 4],
  loopBars: 2,
} satisfies Omit<PackManifest, 'characters'>

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packDir = join(root, 'public', 'packs', PACK.id)
const tmpDir = join(root, '.tmp', 'placeholders')

const args = new Set(process.argv.slice(2))
const force = args.has('--force')
const hasFfmpeg = !args.has('--wav') && spawnSync('ffmpeg', ['-version']).status === 0

if (!hasFfmpeg && !args.has('--wav')) {
  console.warn('ffmpeg not found in PATH: writing .wav files instead of .ogg/.m4a.')
}

function ffmpeg(input: string, output: string, codecArgs: string[]): void {
  const result = spawnSync(
    'ffmpeg',
    ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, ...codecArgs, output],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed for ${output}:\n${result.stderr}`)
  }
}

function writeFile(path: string, data: Uint8Array | string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, data)
}

let written = 0
let skipped = 0

const manifest: PackManifest = {
  ...PACK,
  characters: BOOM_BAP_RECIPES.map((character) => ({
    id: character.id,
    role: character.role,
    label: character.label,
    sounds: character.sounds.map((recipe) => {
      const base = `${character.id}/${recipe.id}`
      const sound: SoundDef = hasFfmpeg
        ? { id: recipe.id, label: recipe.label, file: `${base}.ogg`, fallback: `${base}.m4a` }
        : { id: recipe.id, label: recipe.label, file: `${base}.wav` }

      const outputs = sound.fallback ? [sound.file, sound.fallback] : [sound.file]
      if (!force && outputs.every((file) => existsSync(join(packDir, file)))) {
        skipped++
        return sound
      }

      const wav = encodeWav(renderPlaceholder(recipe, PACK), PLACEHOLDER_SAMPLE_RATE)
      if (hasFfmpeg) {
        const wavPath = join(tmpDir, `${recipe.id}.wav`)
        writeFile(wavPath, wav)
        mkdirSync(join(packDir, character.id), { recursive: true })
        ffmpeg(wavPath, join(packDir, `${base}.ogg`), ['-c:a', 'libvorbis', '-q:a', '5'])
        ffmpeg(wavPath, join(packDir, `${base}.m4a`), ['-c:a', 'aac', '-b:a', '128k'])
      } else {
        writeFile(join(packDir, sound.file), wav)
      }
      written++
      console.log(`  ✓ ${base}`)
      return sound
    }),
  })),
}

// Fails loudly if the recipes ever drift from the schema.
packManifestSchema.parse(manifest)

const manifestPath = join(packDir, 'manifest.json')
if (force || !existsSync(manifestPath)) {
  writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`  ✓ manifest.json`)
} else {
  console.log('  · manifest.json exists, kept (use --force to regenerate)')
}

console.log(`\n${written} sounds generated, ${skipped} kept, in ${packDir}`)
