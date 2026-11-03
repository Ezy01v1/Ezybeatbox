import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseManifest } from '../../src/core/packs/loader'
import { dbToGain, peakOf, rmsOf } from './dsp'
import { BOOM_BAP_RECIPES } from './recipes'
import { PEAK_CEILING_DB, renderPlaceholder } from './render'
import { encodeWav } from './wav'

const settings = { bpm: 90, timeSignature: [4, 4] as const, loopBars: 2 }
const allRecipes = BOOM_BAP_RECIPES.flatMap((character) => character.sounds)

describe('placeholder recipes', () => {
  it('define 6 characters with 5 sounds each', () => {
    expect(BOOM_BAP_RECIPES).toHaveLength(6)
    for (const character of BOOM_BAP_RECIPES) expect(character.sounds).toHaveLength(5)
  })

  it.each(allRecipes.map((recipe) => [recipe.id, recipe] as const))(
    '%s renders an exact-length, non-silent loop within the peak ceiling',
    (_, recipe) => {
      const data = renderPlaceholder(recipe, settings)
      expect(data.length).toBe(235_200)
      expect(data.every(Number.isFinite)).toBe(true)
      expect(rmsOf(data)).toBeGreaterThan(0.001)
      expect(peakOf(data)).toBeLessThanOrEqual(dbToGain(PEAK_CEILING_DB) + 1e-6)
    },
  )

  it('is deterministic', () => {
    const recipe = allRecipes.find((r) => r.id === 'hihat-2')!
    expect(renderPlaceholder(recipe, settings)).toEqual(renderPlaceholder(recipe, settings))
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

describe('shipped boom-bap-01 pack', () => {
  const packDir = resolve(__dirname, '../../public/packs/boom-bap-01')

  it('has a valid manifest whose files all exist', () => {
    const manifest = parseManifest(JSON.parse(readFileSync(join(packDir, 'manifest.json'), 'utf8')))
    expect(manifest.bpm).toBe(90)
    for (const sound of manifest.characters.flatMap((c) => c.sounds)) {
      expect(existsSync(join(packDir, sound.file)), sound.file).toBe(true)
      if (sound.fallback)
        expect(existsSync(join(packDir, sound.fallback)), sound.fallback).toBe(true)
    }
  })
})
