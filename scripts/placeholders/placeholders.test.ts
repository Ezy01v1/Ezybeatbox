import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loopSampleCount } from '../../src/core/audio/timing'
import { parseManifest } from '../../src/core/packs/loader'
import { dbToGain, peakOf, rmsOf } from './dsp'
import { PLACEHOLDER_PACKS } from './packs'
import { PEAK_CEILING_DB, PLACEHOLDER_SAMPLE_RATE, renderPlaceholder } from './render'
import { encodeWav } from './wav'

const packsDir = resolve(__dirname, '../../public/packs')

describe.each(PLACEHOLDER_PACKS.map((pack) => [pack.meta.id, pack] as const))(
  '%s placeholder recipes',
  (_, { meta, recipes, finish }) => {
    const allRecipes = recipes.flatMap((character) => character.sounds)
    const roleOf = (id: string) =>
      recipes.find((c) => c.sounds.some((s) => s.id === id))?.role ?? 'fx'
    const render = (recipe: (typeof allRecipes)[number]) =>
      renderPlaceholder(recipe, meta, finish && { role: roleOf(recipe.id), apply: finish })
    const expectedLength = loopSampleCount(meta, meta.loopBars, PLACEHOLDER_SAMPLE_RATE)

    it('define the 6 roles in order with 11 sounds each (5 + swing, half-time, two fills, stop and double time)', () => {
      expect(recipes.map((c) => c.role)).toEqual(['kick', 'snare', 'hihat', 'bass', 'voice', 'fx'])
      for (const character of recipes) expect(character.sounds).toHaveLength(11)
    })

    it.each(recipes.map((c) => [c.id, c] as const))(
      '%s variations differ from every other sound of the character',
      (_, character) => {
        const rendered = character.sounds.map((s) => renderPlaceholder(s, meta))
        for (const variation of rendered.slice(5)) {
          for (const other of rendered) {
            if (other === variation) continue
            expect(other).not.toEqual(variation)
          }
        }
      },
      // Eleven full loops per character; the richer instruments take a few seconds.
      60_000,
    )

    it.each(allRecipes.map((recipe) => [recipe.id, recipe] as const))(
      '%s renders an exact-length, non-silent loop within the peak ceiling',
      (_, recipe) => {
        const data = render(recipe)
        expect(data.length).toBe(expectedLength)
        expect(data.every(Number.isFinite)).toBe(true)
        expect(rmsOf(data)).toBeGreaterThan(0.001)
        expect(peakOf(data)).toBeLessThanOrEqual(dbToGain(PEAK_CEILING_DB) + 1e-6)
      },
    )

    it('is deterministic', () => {
      const recipe = allRecipes[7]!
      expect(render(recipe)).toEqual(render(recipe))
    })

    it('ships a valid manifest, matching the recipes, whose files all exist', () => {
      const packDir = join(packsDir, meta.id)
      const manifest = parseManifest(
        JSON.parse(readFileSync(join(packDir, 'manifest.json'), 'utf8')),
      )
      expect(manifest.bpm).toBe(meta.bpm)
      expect(manifest.theme).toEqual(meta.theme)
      expect(manifest.characters.flatMap((c) => c.sounds.map((s) => s.id))).toEqual(
        allRecipes.map((r) => r.id),
      )
      if (manifest.cover) expect(existsSync(join(packDir, manifest.cover))).toBe(true)
      for (const sound of manifest.characters.flatMap((c) => c.sounds)) {
        expect(existsSync(join(packDir, sound.file)), sound.file).toBe(true)
        if (sound.fallback)
          expect(existsSync(join(packDir, sound.fallback)), sound.fallback).toBe(true)
      }
    })
  },
)

describe('pack catalog', () => {
  it('lists every generated pack', () => {
    const catalog = JSON.parse(readFileSync(join(packsDir, 'index.json'), 'utf8'))
    expect(catalog.packs).toEqual(PLACEHOLDER_PACKS.map((p) => p.meta.id))
  })
})

describe('encodeWav', () => {
  it('writes a 44-byte header plus 16-bit mono samples', () => {
    const wav = encodeWav(new Float32Array([0, 1, -1]), 44_100)
    const view = new DataView(wav.buffer)
    expect(new TextDecoder().decode(wav.slice(0, 4))).toBe('RIFF')
    expect(wav.byteLength).toBe(44 + 3 * 2)
    expect(view.getUint32(24, true)).toBe(44_100)
    expect(view.getInt16(46, true)).toBe(0x7fff)
    expect(view.getInt16(48, true)).toBe(-0x7fff)
  })
})
