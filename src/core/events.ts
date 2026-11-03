type Listener<T> = (payload: T) => void

/** Minimal typed event emitter for framework-free core modules. */
export class TypedEmitter<Events extends Record<string, unknown>> {
  // Listener sets are keyed by event name; `on`/`emit` keep the payload types aligned.
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>()

  /** Subscribes to an event; returns the unsubscribe function. */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(listener)
    return () => set.delete(listener)
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event) as Set<Listener<Events[K]>> | undefined
    set?.forEach((listener) => listener(payload))
  }

  clear(): void {
    this.listeners.clear()
  }
}
