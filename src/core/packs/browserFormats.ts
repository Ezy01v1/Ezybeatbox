import type { CanPlayType } from './loader'

/** Browser-only: asks an <audio> element which codecs this browser can decode. */
export function browserCanPlayType(): CanPlayType {
  const audio = typeof Audio === 'undefined' ? null : new Audio()
  return (mime) => audio?.canPlayType(mime) ?? ''
}
