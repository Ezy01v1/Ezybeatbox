/**
 * Character names. Every genre shares the same character art, so the names are gender-neutral
 * and short enough for the stage. They are drawn at random once, from a fixed seed, so each
 * pack gets its own cast and regenerating the packs never renames anyone.
 */
export const NAME_POOL = [
  'Kai', 'Sol', 'Noa', 'Alex', 'Sam', 'Río', 'Cruz', 'Ari', 'Eli', 'Ale',
  'Jade', 'Robin', 'Luca', 'Andy', 'Charlie', 'Fran', 'Toni', 'Jesse', 'Remy', 'Sasha',
  'Mika', 'Lou', 'Isa', 'Cris', 'Gabi', 'Pau', 'Mar', 'Yael', 'Tali', 'Juni',
  'Coco', 'Zuri', 'Oli', 'Vic', 'Jo', 'Max', 'Ilan', 'Nao', 'Ren', 'Uri',
] as const // prettier-ignore

/** Changing the seed reshuffles every cast: only do it on purpose. */
const SEED = 2026_11_06

function seededRandom(seed: number): () => number {
  let a = seed
  return () => {
    // mulberry32
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The pool, shuffled once (Fisher–Yates) with the fixed seed. */
const SHUFFLED: readonly string[] = (() => {
  const names: string[] = [...NAME_POOL]
  const random = seededRandom(SEED)
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[names[i], names[j]] = [names[j] as string, names[i] as string]
  }
  return names
})()

/**
 * `count` names for the pack at position `packIndex` in the catalog. Casts never overlap
 * while the pool lasts (40 names: six packs of six).
 */
export function castFor(packIndex: number, count: number): string[] {
  const start = packIndex * count
  if (start + count > SHUFFLED.length) {
    throw new Error(`Name pool too small for pack #${packIndex + 1}: add names to NAME_POOL`)
  }
  return SHUFFLED.slice(start, start + count)
}
