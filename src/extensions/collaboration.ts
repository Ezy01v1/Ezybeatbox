/**
 * EXTENSION POINT — real-time collaboration. Not implemented yet (Phase 5 defines the contract
 * only). Needs a backend (WebSocket or WebRTC signalling). See docs/EXTENSIONS.md.
 *
 * Every change to a `Mix` is a small operation on one field. Operations are last-writer-wins
 * per field (ordered by Lamport clock, then client id), so clients converge without locks.
 * Sound changes already land on the next bar, which hides network latency below one bar.
 */

export type MixOperation =
  | { type: 'setSound'; characterId: string; soundId: string | null }
  | { type: 'setMute'; characterId: string; muted: boolean }
  | { type: 'setSolo'; characterId: string; solo: boolean }
  | { type: 'setVolume'; characterId: string; volumeDb: number }
  | { type: 'setMasterVolume'; volumeDb: number }

export interface StampedOperation {
  op: MixOperation
  clientId: string
  /** Lamport clock: max(local, received) + 1 on every local change. */
  lamport: number
}

/** Shared transport: every client derives bar 1 from the same server-time origin. */
export interface SharedClock {
  /** Estimated server time minus local `performance.now()` (NTP-style ping exchange). */
  offsetMs: number
  /** Server time (ms) of bar 1 of the session, or null while stopped. */
  originServerMs: number | null
}

export type CollaborationEvents = {
  operation: StampedOperation
  peersChanged: { peers: { clientId: string; name: string }[] }
  clockChanged: SharedClock
}

/** Network layer (WebSocket room, or a WebRTC data channel). */
export interface MixSyncTransport {
  join(roomId: string, clientName: string): Promise<{ clientId: string }>
  leave(): void
  send(operation: StampedOperation): void
  on<K extends keyof CollaborationEvents>(
    event: K,
    listener: (payload: CollaborationEvents[K]) => void,
  ): () => void
}
