import { z } from 'zod'
import { PackLoadError, fetchManifest } from './loader'
import { type PackManifest, idSchema } from './schema'

/**
 * `packs/index.json`: which packs the app offers, in picker order. Only ids: everything shown
 * in the picker (name, tempo, theme, cover) comes from each pack's own manifest.
 */
export const catalogSchema = z.object({
  version: z.literal(1),
  packs: z.array(idSchema).min(1).max(50),
})

export type PackCatalog = z.infer<typeof catalogSchema>

/** What the pack picker needs about one pack. */
export interface PackSummary {
  id: string
  manifest: PackManifest
  /** Absolute-ish URL of the cover image, or null when the pack has none. */
  coverUrl: string | null
}

export interface CatalogResult {
  packs: PackSummary[]
  /** Packs listed in the catalog whose manifest could not be loaded (they are left out). */
  failed: string[]
}

async function fetchCatalogIndex(
  packsBaseUrl: string,
  fetchFn: typeof fetch,
): Promise<PackCatalog> {
  const url = `${packsBaseUrl}index.json`
  let response: Response
  try {
    response = await fetchFn(url)
  } catch (cause) {
    throw new PackLoadError('network', `Could not fetch ${url}`, [], { cause })
  }
  if (!response.ok) {
    throw new PackLoadError('network', `Could not fetch ${url} (HTTP ${response.status})`)
  }
  let data: unknown
  try {
    data = await response.json()
  } catch (cause) {
    throw new PackLoadError('invalid-json', `${url} is not valid JSON`, [], { cause })
  }
  const parsed = catalogSchema.safeParse(data)
  if (!parsed.success) {
    throw new PackLoadError(
      'invalid-manifest',
      `${url} is not a valid pack catalog`,
      parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    )
  }
  return parsed.data
}

/**
 * Loads the catalog and every listed manifest (no audio). One broken pack does not hide the
 * others; it is reported in `failed`. Throws only if the catalog itself is unusable or no pack
 * could be loaded.
 */
export async function fetchCatalog(
  packsBaseUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<CatalogResult> {
  const catalog = await fetchCatalogIndex(packsBaseUrl, fetchFn)
  const ids = [...new Set(catalog.packs)]
  const results = await Promise.allSettled(
    ids.map(async (id) => ({
      id,
      manifest: await fetchManifest(`${packsBaseUrl}${id}/`, fetchFn),
    })),
  )

  const packs: PackSummary[] = []
  const failed: string[] = []
  results.forEach((result, i) => {
    // allSettled keeps order, so a rejected entry belongs to ids[i].
    const id = result.status === 'fulfilled' ? result.value.id : (ids[i] ?? '?')
    // The manifest id must match its folder, or links and saved mixes would point elsewhere.
    if (result.status === 'fulfilled' && result.value.manifest.id === id) {
      const { manifest } = result.value
      packs.push({
        id,
        manifest,
        coverUrl: manifest.cover ? `${packsBaseUrl}${id}/${manifest.cover}` : null,
      })
    } else {
      failed.push(id)
    }
  })

  if (packs.length === 0) {
    throw new PackLoadError('network', 'No pack in the catalog could be loaded', failed)
  }
  return { packs, failed }
}
