/**
 * Generates placeholder loops (exactly `loopBars` bars at each pack's BPM, ~-18 dB RMS) and the
 * manifest for every pack in scripts/placeholders/packs.ts, into public/packs/<packId>/.
 *
 *   npm run generate:placeholders                     # only what is missing
 *   npm run generate:placeholders -- --force          # overwrite audio and manifests
 *   npm run generate:placeholders -- --pack trap-01   # a single pack
 *   npm run generate:placeholders -- --wav            # skip ffmpeg, write .wav
 *
 * Real recordings can replace the files at any time: without --force nothing is overwritten.
 */
import { spawnSync } from 'node:child_process'
import ffmpegStatic from 'ffmpeg-static'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type PackManifest, type SoundDef, packManifestSchema } from '../src/core/packs/schema'
import { PLACEHOLDER_PACKS, type PlaceholderPack } from './placeholders/packs'
import { PLACEHOLDER_SAMPLE_RATE, renderPlaceholder } from './placeholders/render'
import { encodeWav } from './placeholders/wav'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tmpDir = join(root, '.tmp', 'placeholders')

const argv = process.argv.slice(2)
const args = new Set(argv)
const force = args.has('--force')
const packFlag = argv.indexOf('--pack')
const onlyPack = packFlag >= 0 ? argv[packFlag + 1] : undefined
// Prefer an ffmpeg on the PATH; fall back to the binary bundled by the ffmpeg-static dev dependency.
const ffmpegBin = [process.env.FFMPEG ?? 'ffmpeg', ffmpegStatic].find(
  (bin): bin is string => !!bin && spawnSync(bin, ['-version']).status === 0,
)
const hasFfmpeg = !args.has('--wav') && ffmpegBin !== undefined

if (!hasFfmpeg && !args.has('--wav')) {
  console.warn('ffmpeg not found in PATH: writing .wav files instead of .ogg/.m4a.')
}

function ffmpeg(input: string, output: string, codecArgs: string[]): void {
  const result = spawnSync(
    ffmpegBin ?? 'ffmpeg',
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

function generatePack({ meta, recipes, finish }: PlaceholderPack): void {
  const packDir = join(root, 'public', 'packs', meta.id)
  let written = 0
  let skipped = 0
  console.log(`\n${meta.id} (${meta.bpm} BPM)`)

  const manifest: PackManifest = {
    ...meta,
    characters: recipes.map((character) => ({
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

        const wav = encodeWav(
          renderPlaceholder(recipe, meta, finish && { role: character.role, apply: finish }),
          PLACEHOLDER_SAMPLE_RATE,
        )
        if (hasFfmpeg) {
          const wavPath = join(tmpDir, meta.id, `${recipe.id}.wav`)
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
  // New or renamed sounds in the recipes also rewrite the manifest, so they show up without --force.
  const soundList = (m: PackManifest) =>
    m.characters.flatMap((c) => c.sounds.map((s) => `${s.id}=${s.label}`)).join()
  const stale =
    existsSync(manifestPath) &&
    soundList(JSON.parse(readFileSync(manifestPath, 'utf8')) as PackManifest) !== soundList(manifest)
  if (force || stale || !existsSync(manifestPath)) {
    writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(`  ✓ manifest.json`)
  } else {
    console.log('  · manifest.json exists, kept (use --force to regenerate)')
  }
  console.log(`  ${written} sounds generated, ${skipped} kept`)
}

const packs = onlyPack ? PLACEHOLDER_PACKS.filter((p) => p.meta.id === onlyPack) : PLACEHOLDER_PACKS
if (packs.length === 0) {
  console.error(
    `Unknown pack "${onlyPack}". Known: ${PLACEHOLDER_PACKS.map((p) => p.meta.id).join(', ')}`,
  )
  process.exit(1)
}
packs.forEach(generatePack)
