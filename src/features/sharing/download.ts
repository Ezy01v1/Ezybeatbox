const EXTENSION_BY_TYPE: [prefix: string, extension: string][] = [
  ['audio/webm', 'webm'],
  ['audio/ogg', 'ogg'],
  ['audio/mp4', 'm4a'],
  ['audio/wav', 'wav'],
]

export function audioExtension(mimeType: string): string {
  return EXTENSION_BY_TYPE.find(([prefix]) => mimeType.startsWith(prefix))?.[1] ?? 'webm'
}

/** e.g. `ezybeatbox-boom-bap-01-2026-11-04-1530.webm` */
export function exportFileName(packId: string, mimeType: string, date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
  return `ezybeatbox-${packId}-${stamp}.${audioExtension(mimeType)}`
}

/** Saves a Blob through a temporary `<a download>` (works in every modern browser). */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before freeing the memory.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
