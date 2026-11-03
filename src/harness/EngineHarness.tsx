import { useEffect, useReducer, useRef, useState } from 'react'
import { AUDIO_CONFIG, AudioEngine, type LevelReader } from '@/core/audio'
import { type PackManifest, fetchManifest, resolveText } from '@/core/packs'

const PACK_URL = `${import.meta.env.BASE_URL}packs/boom-bap-01/`

// One engine for the page lifetime (survives StrictMode's double effects).
const engine = new AudioEngine()

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading'; progress: number }
  | { kind: 'ready'; manifest: PackManifest; warnings: string[] }
  | { kind: 'error'; message: string; details: readonly string[] }

/** Re-renders on any engine event. Events are rare (per beat at most), never per frame. */
function useEngineEvents(): { bar: number; beat: number } {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const [position, setPosition] = useState({ bar: 0, beat: 0 })
  useEffect(() => {
    const offs = [
      engine.on('soundQueued', bump),
      engine.on('soundStarted', bump),
      engine.on('soundStopped', bump),
      engine.on('transportChanged', bump),
      engine.on('contextStateChanged', bump),
      engine.on('beat', setPosition),
    ]
    return () => offs.forEach((off) => off())
  }, [])
  return position
}

function LevelBar({ reader }: { reader: LevelReader }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let frame = 0
    const tick = () => {
      if (ref.current) {
        ref.current.style.transform = `scaleX(${Math.min(1, reader.getLevel() * 2)})`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reader])
  return (
    <div className="h-2 overflow-hidden rounded bg-neutral-800">
      <div
        ref={ref}
        className="h-full origin-left bg-emerald-400"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}

const statusStyle = {
  empty: 'bg-neutral-800 text-neutral-400',
  queued: 'bg-amber-500/20 text-amber-300 animate-pulse',
  playing: 'bg-emerald-500/20 text-emerald-300',
  stopping: 'bg-rose-500/20 text-rose-300 animate-pulse',
} as const

export function EngineHarness() {
  const [load, setLoad] = useState<LoadState>({ kind: 'idle' })
  const { bar, beat } = useEngineEvents()

  async function loadPack() {
    try {
      await engine.unlock()
      setLoad({ kind: 'loading', progress: 0 })
      const manifest = await fetchManifest(PACK_URL)
      const { warnings } = await engine.loadPack(manifest, PACK_URL, {
        onProgress: (progress) => setLoad({ kind: 'loading', progress }),
      })
      setLoad({ kind: 'ready', manifest, warnings })
    } catch (error) {
      const details =
        error instanceof Error && 'details' in error ? (error.details as readonly string[]) : []
      setLoad({ kind: 'error', message: String(error), details })
    }
  }

  function randomize() {
    if (load.kind !== 'ready') return
    for (const character of load.manifest.characters) {
      const sound = character.sounds[Math.floor(Math.random() * character.sounds.length)]
      if (sound) engine.setSound(character.id, sound.id)
    }
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Banco de pruebas del motor</h1>
        <span className="rounded bg-neutral-800 px-2 py-1 font-mono text-xs">
          AudioContext: {engine.contextState}
        </span>
      </header>

      {load.kind === 'idle' && (
        <button
          type="button"
          onClick={loadPack}
          className="self-start rounded-lg bg-amber-400 px-4 py-3 font-semibold text-neutral-950"
        >
          Cargar pack y activar audio
        </button>
      )}

      {load.kind === 'loading' && (
        <div className="flex flex-col gap-1" role="status">
          <span>Cargando samples… {Math.round(load.progress * 100)}%</span>
          <progress value={load.progress} max={1} className="w-full" />
        </div>
      )}

      {load.kind === 'error' && (
        <div className="rounded-lg border border-rose-500 p-3 text-rose-300" role="alert">
          <p>{load.message}</p>
          <ul className="list-disc pl-5 font-mono text-xs">
            {load.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {load.kind === 'ready' && (
        <>
          {load.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-500 p-3 text-xs text-amber-300">
              <p>Avisos de duración de loop:</p>
              <ul className="list-disc pl-5 font-mono">
                {load.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <section className="flex flex-wrap items-center gap-3 rounded-lg bg-neutral-900 p-3">
            <button
              type="button"
              onClick={() => (engine.isPlaying ? engine.stop() : void engine.start())}
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-neutral-950"
            >
              {engine.isPlaying ? 'Detener' : 'Reproducir'}
            </button>
            <button
              type="button"
              onClick={randomize}
              className="rounded-lg bg-neutral-700 px-3 py-2"
            >
              Aleatorio (6 a la vez)
            </button>
            <span className="font-mono text-lg" aria-live="off">
              {load.manifest.bpm} BPM · compás {bar + 1} · tiempo {beat + 1}
            </span>
            <div className="flex gap-1" aria-hidden>
              {Array.from({ length: load.manifest.timeSignature[0] }, (_, i) => (
                <span
                  key={i}
                  className={`size-3 rounded-full ${
                    engine.isPlaying && i === beat ? 'bg-amber-400' : 'bg-neutral-700'
                  }`}
                />
              ))}
            </div>
            <label className="ml-auto flex items-center gap-2 text-sm">
              Master
              <input
                type="range"
                min={AUDIO_CONFIG.minVolumeDb}
                max={AUDIO_CONFIG.maxVolumeDb}
                defaultValue={AUDIO_CONFIG.defaultMasterVolumeDb}
                onChange={(e) => engine.setMasterVolume(Number(e.target.value))}
              />
            </label>
            <div className="w-full">
              <LevelBar reader={engine.getMasterMeter()} />
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {load.manifest.characters.map((character) => {
              const slot = engine.getSlot(character.id)
              return (
                <article
                  key={character.id}
                  className="flex flex-col gap-2 rounded-lg bg-neutral-900 p-3"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{resolveText(character.label, 'es')}</h2>
                    <span className={`rounded px-2 py-0.5 text-xs ${statusStyle[slot.status]}`}>
                      {slot.status}
                    </span>
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        aria-pressed={slot.muted}
                        onClick={() => engine.setMute(character.id, !slot.muted)}
                        className={`rounded px-2 text-sm ${slot.muted ? 'bg-rose-500 text-neutral-950' : 'bg-neutral-700'}`}
                      >
                        M
                      </button>
                      <button
                        type="button"
                        aria-pressed={slot.solo}
                        onClick={() => engine.setSolo(character.id, !slot.solo)}
                        className={`rounded px-2 text-sm ${slot.solo ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-700'}`}
                      >
                        S
                      </button>
                    </div>
                  </div>
                  <LevelBar reader={engine.getMeter(character.id)} />
                  <div className="flex flex-wrap gap-1">
                    {character.sounds.map((sound) => (
                      <button
                        key={sound.id}
                        type="button"
                        aria-pressed={slot.target === sound.id}
                        onClick={() => engine.setSound(character.id, sound.id)}
                        className={`rounded px-2 py-1 text-sm ${
                          slot.target === sound.id
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-neutral-800 hover:bg-neutral-700'
                        }`}
                      >
                        {resolveText(sound.label, 'es')}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => engine.clearSound(character.id)}
                      className="rounded px-2 py-1 text-sm text-rose-300 hover:bg-neutral-800"
                    >
                      Quitar
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-neutral-400">
                    Volumen
                    <input
                      type="range"
                      min={AUDIO_CONFIG.minVolumeDb}
                      max={AUDIO_CONFIG.maxVolumeDb}
                      defaultValue={AUDIO_CONFIG.defaultChannelVolumeDb}
                      onChange={(e) => engine.setVolume(character.id, Number(e.target.value))}
                      className="flex-1"
                    />
                  </label>
                </article>
              )
            })}
          </section>
        </>
      )}
    </main>
  )
}
