# Arquitectura de EzyBeatbox

> Documento vivo. Se actualiza cada vez que cambia una decisión estructural.

## Objetivo

Construir el juego de "6 personajes con loops cuantizados al compás" con un núcleo que permita agregar después _loop station_, reconocimiento de beatbox, backend, modo colaborativo y móvil **sin reescribir el núcleo**.

## Capas y regla de dependencias

```
app/        → bootstrap, providers, composición
features/   → pantallas y casos de uso (stage, palette, sharing)
visuals/    → CharacterRenderer + implementaciones (svg/ hoy, rive/ mañana)
ui/         → componentes base reutilizables
i18n/       → configuración y traducciones
extensions/ → interfaces de extensión futuras (sin implementación)
core/       → TypeScript puro: audio/, packs/, mix/
```

Las dependencias solo apuntan "hacia abajo":

- `core/` **no importa** React, `features/`, `visuals/`, `ui/` ni `app/`. Se puede probar y reutilizar sin DOM.
- `visuals/` recibe estado y niveles de audio; **nunca** llama al motor de audio directamente.
- `features/` consume `core/` (a través del store) y `visuals/`.
- `extensions/` depende solo de tipos de `core/`.

## Piezas principales (planeadas)

| Pieza               | Ubicación         | Fase | Notas                                                                                                  |
| ------------------- | ----------------- | ---- | ------------------------------------------------------------------------------------------------------ |
| `AudioEngine`       | `core/audio`      | 1    | API pequeña: `loadPack`, `start`, `setSound`, `clearSound`, `setMute`, `setSolo`, `getMeter`, eventos. |
| Manifest de packs   | `core/packs`      | 1    | Esquema Zod validado al cargar. BPM, compás y `loopBars` por pack.                                     |
| Modelo `Mix`        | `core/mix`        | 1–4  | Serializable y versionado. Base para guardar, compartir por link y colaborativo.                       |
| `MixRepository`     | `core/mix`        | 4    | Puerto; adaptador `LocalStorage` hoy, HTTP mañana.                                                     |
| Store de UI         | `app/` / features | 2    | Zustand. Refleja el estado del mix; no guarda nada por frame.                                          |
| `CharacterRenderer` | `visuals/`        | 2–3  | Recibe estado (inactivo / en espera / cantando) y nivel de audio. SVG hoy, Rive mañana.                |

## Motor de audio (Fase 1)

```
Player × 5 ─┐
            ├─► Channel (vol/mute/solo) ─┬─► master Channel ─► Limiter (−1 dB) ─┬─► salida
            │   × 6 personajes           └─► Meter (nivel 0–1)                  └─► Meter master
```

- **Archivos:** `core/audio/AudioEngine.ts` (único archivo que importa Tone.js), `timing.ts` y `transitions.ts` (lógica pura, con pruebas), `config.ts` (todas las constantes de audio).
- **Estado por personaje:** `target` (lo que pidió el usuario) y `playing` (lo que suena). Su diferencia da el estado visual: `empty`, `queued` ("en espera"), `playing`, `stopping`.
- **Cuantización:** un único `Transport.scheduleRepeat` por tiempo de compás. En el primer tiempo de cada compás, `planBarTransitions` calcula los cambios y se programan con el `time` exacto del transporte. Nada de `setTimeout`.
- **Fase de los loops:** un sonido entra en el siguiente compás, pero **alineado a la cuadrícula global de loops**. Un loop de 2 compases que entra en un compás par arranca desde su segundo compás, así el "compás 1" de todos los personajes coincide siempre (`loopOffsetAtBar`).
- **Eventos para la UI:** `soundQueued` (inmediato), `soundStarted`/`soundStopped`/`barStart`/`beat` (emitidos con `Tone.Draw` cuando el cambio es audible), `transportChanged` y `contextStateChanged`.
- **Niveles:** `getMeter(id)`/`getMasterMeter()` devuelven un `LevelReader` (`getLevel(): 0–1`) para leer desde `requestAnimationFrame`. La UI nunca ve objetos de Tone.
- **Banco de pruebas:** `harness.html` → `src/harness/`. Solo existe en desarrollo y no entra en el build. Se reemplaza por la escena real en la Fase 2.

## Packs (Fase 1)

- `core/packs/schema.ts`: esquema Zod del manifest (6 personajes, ids kebab-case únicos, rutas relativas seguras, textos localizables).
- `core/packs/loader.ts`: `fetchManifest`, `parseManifest`, `pickSoundFile` (principal o respaldo según `canPlayType`) y `resolveText`.
- Formato y reglas de los samples: [`SAMPLES.md`](SAMPLES.md).
- Generador de placeholders: `scripts/generate-placeholders.ts` + `scripts/placeholders/`. Importa `timing.ts` y el esquema desde `src/core`, así la duración de los loops y la validación tienen una sola fuente de verdad.

## Principios

1. **Motor de audio separado de la UI.** El motor es TS puro con eventos; React solo lo consume.
2. **Estado del mix serializable.** Todo lo que define "qué suena" vive en `Mix`.
3. **Render intercambiable.** Cambiar el arte no toca la lógica.
4. **Puertos y adaptadores** para persistencia.
5. **Sin números mágicos de audio**: constantes y configuración centralizadas en `core/audio`.
6. **Rendimiento:** animación con `requestAnimationFrame` + refs; nunca estado de React por frame.
7. **Scheduling solo con `Tone.Transport`.** Nada de `setTimeout`/`setInterval` para audio.

## Decisiones registradas

- **2026-11-02 — TypeScript 6.0** en lugar de 7.0 (el que trae la plantilla de Vite): `typescript-eslint` solo soporta `<6.1`. Revisar cuando agregue soporte para TS 7.
- **2026-11-02 — ESLint + Prettier** en lugar de oxlint (que trae la plantilla), según el stack definido.
- **2026-11-02 — Tailwind v4** con `@tailwindcss/vite`; configuración en CSS (`@theme`), sin `tailwind.config.js`.
- **2026-11-02 — Placeholders:** el script sintetiza WAV en TS puro y los convierte con `ffmpeg` (requisito de desarrollo). Si no hay `ffmpeg`, deja `.wav` y el manifest los referencia.
- **2026-11-02 — Duración del loop fijada por BPM:** el motor siempre usa `loopStart = 0` y `loopEnd = loopBars × beatsPerBar × 60 / bpm`, nunca la duración del archivo, para evitar huecos o clics por el padding de los encoders (MP3/AAC). El formato de respaldo para Safari (`.m4a`/WAV en vez de `.mp3`) se evalúa en la Fase 1.
- **2026-11-02 — Gestor de paquetes:** npm.
- **2026-11-02 — Alias de imports** `@/` → `src/`. Dentro de `core/` se usan imports relativos para que los scripts de Node también puedan importarlo.
- **2026-11-03 — Respaldo de audio `.m4a` (AAC)** en lugar de `.mp3`: el MP3 agrega un silencio inicial que los navegadores no recortan y desalinea el loop. Verificado en Chrome: `.ogg` y `.m4a` decodifican a la cantidad exacta de muestras. Safari queda pendiente de verificar en un dispositivo.
- **2026-11-03 — Los loops quedan alineados a la cuadrícula global** (ver "Fase de los loops"). Para que un sonido espere al inicio del siguiente ciclo completo en lugar del siguiente compás, el cambio se haría en `applyBarTransitions`.
- **2026-11-03 — Sound ids únicos en todo el pack** (no solo por personaje), para que un `Mix` serializado sea inequívoco.
- **2026-11-03 — `tsconfig.node.json`** usa `moduleResolution: bundler` para que `scripts/` importe código de `src/core` sin extensiones.
