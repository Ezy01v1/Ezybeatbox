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
            ├─► Channel (vol/mute/solo) ─┬─► master Volume ─► Limiter (−1 dB) ─┬─► salida
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

## Escena y drag & drop (Fase 2)

```
main.tsx ─ new AudioEngine() ─ createAppStore(engine) ─ <AppStoreProvider> ─ <App>
                                                                  ├─ StartScreen  (start / loading / error)
                                                                  └─ StageScreen  (ready)
                                                                       ├─ TransportBar (play, compás, volumen)
                                                                       ├─ CharacterSlot × 6 → ActiveCharacterRenderer
                                                                       ├─ Palette → SoundIcon × 30
                                                                       ├─ DragLayer (fantasma)
                                                                       └─ ResumeOverlay
```

- **Store (`app/store/appStore.ts`):** Zustand _vanilla_ creado con `createAppStore({ engine, packUrl })`. Depende de `EngineLike`, una interfaz reducida del motor, así las pruebas usan `FakeEngine` (mismas reglas de cuantización, pero los compases avanzan a mano). El store escucha los eventos del motor y solo se actualiza por evento (como mucho una vez por tiempo de compás), nunca por frame.
- **Fases de la app:** `start` → `loading` (progreso) → `ready`, o `error` (`pack`, `audio-blocked`, `unknown`) con botón de reintentar. Si el navegador suspende el `AudioContext` a mitad de la sesión, `ResumeOverlay` pide un toque para reanudarlo.
- **Drag & drop (`features/palette/dnd/`):**
  - `usePointerDrag` usa pointer events, así que funciona igual con mouse, touch y lápiz. Si el puntero se mueve menos de 8 px, cuenta como **tap**: se dispara el `click` normal, que es lo mismo que hace Enter/Espacio con el teclado. Esa es la alternativa accesible al arrastre.
  - Cada `CharacterSlot` es un _drop target_ (`data-drop-character`) y se detecta con `elementFromPoint`.
  - `resolveDrop` (lógica pura, con pruebas) decide qué pasa al soltar. Un sonido de la paleta solo se asigna a **su** personaje. Arrastrar el sonido de un personaje fuera de él lo quita.
  - El fantasma sigue al puntero escribiendo `transform` directamente en el DOM (`dragStore.positionGhost`). React solo se entera del inicio, del fin y de cuando el puntero cruza el borde de un personaje.
- **Render de personajes:** `visuals/CharacterRenderer.ts` define las props (`role`, `status`, `muted`, `level`, `reducedMotion`). `visuals/index.ts` exporta `ActiveCharacterRenderer = SvgCharacter`; para cambiar el arte basta cambiar esa línea. El renderer es solo visual (`aria-hidden`): el nombre accesible y los controles viven en `CharacterSlot`.
- **i18n:** todos los textos de la UI están en `i18n/locales/es/common.json`, con claves tipadas. Los textos del pack (nombres, etiquetas) se resuelven con `useLocalizedText`.
- **Movimiento reducido:** `usePrefersReducedMotion` desactiva el pulso del estado "en espera"; las transiciones CSS usan `motion-reduce:`.

## Visual reactivo (Fase 3)

```
AudioEngine ── getMeter(id) ──► compensateLatency ──► LevelReader ─┐
            ── getBeatClock() ─────────────────────► BeatClock ───┤
                                                                   ▼
animationLoop (un solo rAF) ──► SvgCharacter × 6: followLevel → computePose → setAttribute(...)
                            └─► StageBackdrop (canvas): nivel master → brillo; ringsAt(beat) → anillos
```

- **Un único `requestAnimationFrame`** (`visuals/animationLoop.ts`) para todo lo animado. Solo corre mientras hay suscriptores, y el navegador lo pausa en pestañas ocultas.
- **Cero renders de React por frame.** React dibuja las formas solo cuando cambia el estado (`status`, `muted`). El movimiento (boca, rebote, pulso, brillo) se escribe directo en los atributos SVG mediante refs. Lo verifica `features/stage/animation.test.tsx` con `<Profiler>`: 30 frames animados, 0 commits.
- **Pose independiente del arte:** `computePose` (función pura) convierte nivel + tiempo de compás en `{ mouthOpen, headOffset, bodyScale, glow }`. Un renderer de Rive puede reutilizarla mapeando esos valores a los inputs de su state machine.
- **Sincronía con lo que se escucha:**
  - `BeatClock.getBeatPosition()` usa el tiempo del transporte menos la latencia de salida (`outputLatency + baseLatency`).
  - `compensateLatency` retrasa los niveles de los medidores esa misma cantidad con una `DelayLine`. Importa sobre todo con Bluetooth.
  - Safari no expone `outputLatency`: ahí la compensación vale 0.
- **Nivel visual:** `normalizeLevel` (raíz cuadrada + ganancia) y `followLevel` (envolvente con ataque de 15 ms y release de 120 ms). El suavizado del `Tone.Meter` bajó a 0.5 para no perder los golpes de kick y snare. Las constantes están en `visuals/config.ts`.
- **Escena:** `StageBackdrop` es un canvas detrás de los personajes. El brillo sigue al nivel del master y cada tiempo emite un anillo, más fuerte en el tiempo 1. `ringsAt` deriva los anillos solo de la posición del compás, sin estado, así que no puede desfasarse.
- **Movimiento reducido:** sin rebote, sin pulso del cuerpo, sin respiración ni anillos. La boca y el brillo siguen mostrando el nivel, porque es información y no decoración.
- **Cambiar el arte:** se implementa `CharacterRenderer` y se cambia `ActiveCharacterRenderer` en `visuals/index.ts`. El motor y la escena no se tocan.

## Guardar, compartir y exportar (Fase 4)

- **`MixRepository`** (`core/mix/repository.ts`) es un puerto asíncrono con `list`, `get`, `save` y `delete`. Hoy lo implementa `LocalStorageMixRepository`, que guarda todo en una sola clave (`ezybeatbox.mixes.v1`). Al leer valida con Zod y descarta las entradas corruptas. Si el almacenamiento está lleno o bloqueado (modo privado), lanza `MixStorageError`.
- **Link para compartir** (`core/mix/shareLink.ts`): el mix viaja en el **hash** de la URL. No pasa por ningún servidor ni necesita backend. Ejemplo del formato v1:

  ```
  #v=1&p=boom-bap-01&pv=1&s=kick.kick-3~bass.bass-2&m=snare&o=bass&vol=bass.-3&mv=-2
  ```

  - Solo se escriben los valores que no son los de por defecto, y los separadores (`.` y `~`) son caracteres que no se escapan.
  - `decodeShareLink` nunca lanza errores. Devuelve `invalid` o `newer-version`, y los ids se validan como kebab-case, así que un link no puede apuntar fuera de `public/packs/`.
  - `resolveSharedMix` adapta el mix al pack cargado: omite los sonidos que ya no existen y avisa si el pack cambió de versión. Las migraciones de formatos viejos van en `decodeShareLink`, según `v`.

- **Al abrir un link:** el hash se lee al iniciar (`initialHash`). Después de "Toca para empezar" se carga **el pack del link** y se aplica el mix. Luego el hash se borra de la barra de direcciones para que una recarga empiece limpia. Si el link llega con la app ya abierta (`hashchange`), se aplica en el momento.
- **Exportar audio:** `AudioEngine.startRecording`/`stopRecording` usan `Tone.Recorder` (MediaRecorder) conectado **después del limitador**, así que se graba lo mismo que se escucha.
  - MediaRecorder no es preciso a la muestra, por eso el store arranca la grabación en el evento `barStart` de un **inicio de loop** y la detiene tras `EXPORT_LOOP_COUNT` (2) loops completos.
  - El formato depende del navegador: WebM/Opus en Chrome y Firefox, MP4 en Safari.
  - Si se detiene la reproducción a mitad de la exportación, se cancela limpio.
- **Avisos:** el store emite `Notice` con claves independientes del idioma (`notices.<key>` en i18n). Los informativos se cierran solos a los 5 s; los errores se quedan hasta que el usuario los cierra.
- **UI:** "Mis mixes", "Compartir" y "Exportar audio" en la barra superior. Los diálogos usan `ui/Modal` (accesible: foco inicial en el contenido, Tab no sale del diálogo, Escape lo cierra y el foco vuelve al botón que lo abrió).

## Puntos de extensión (Fase 5)

`src/extensions/` contiene solo contratos tipados: `LoopRecorder`, `LatencyCalibrator`, `UserSound`/`UserSoundStore`/`UserSoundHost`, `BeatRecognizer`/`PatternQuantizer`/`PatternRenderer` y `MixOperation`/`MixSyncTransport`/`SharedClock`. Ningún módulo de la app los importa. Un sonido de usuario usa un id `user-<uuid>` y entra al modelo como cualquier sonido de pack, a través de `UserSoundHost`, que implementará `AudioEngine`. El diseño completo, la API del backend y las notas de móvil están en [`EXTENSIONS.md`](EXTENSIONS.md).

## PWA (después de las fases)

- **`vite-plugin-pwa` (Workbox)**, configurado en `vite.config.ts`.
- **Manifest:** `standalone`, en español, con íconos generados desde `public/icon.svg` (`npm run generate:icons`, preset 2023: 64/192/512, maskable y apple-touch).
- **Precache:** la app (JS, CSS, HTML, íconos), más `packs/**/manifest.json` y los `.ogg` del pack (unos 1,5 MB). Así funciona offline.
- **Runtime cache** (`CacheFirst`): los `.m4a` de respaldo. Solo los pide Safari antiguo, así que no hace falta que los descarguen todos los dispositivos.
- **Actualizaciones** con `registerType: 'prompt'`: `features/pwa/UpdatePrompt` muestra "Hay una versión nueva" con **Actualizar / Después**. Actualizar recarga la página, por eso nunca se hace sola en medio de un beat. También avisa una vez cuando la app ya funciona sin conexión.
- **iOS:** `AudioEngine.unlock()` fija `navigator.audioSession.type = 'playback'` donde existe (Safari 17+). Así el switch de silencio no calla la música, como en una app de música nativa.
- **Pruebas:** `virtual:pwa-register/react` se reemplaza por un mock controlable en `src/test/setup.ts`. El service worker se verifica en el build con `npm run preview` (ver QA).

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
- **2026-11-04 — Paleta en una barra inferior** con los 30 sonidos agrupados por personaje y scroll horizontal en el celular (`touch-action: pan-x`). Así el gesto vertical hacia arriba arrastra y el horizontal hace scroll.
- **2026-11-04 — Un sonido solo cae en su personaje** (los roles son fijos). Mientras arrastras, el personaje correcto se resalta con "Suelta aquí" y los demás se atenúan.
- **2026-11-04 — Pausa = detener y volver al compás 1.** Los sonidos elegidos se mantienen y vuelven a entrar en el compás 1 al reproducir. Con loops, retomar a mitad de compás no aporta nada.
- **2026-11-04 — El master es un `Tone.Volume`, no un `Tone.Channel`.** El solo de Tone es global para todo el contexto: con un master `Channel`, poner en solo a cualquier personaje silenciaba **toda** la app. Era un bug desde la Fase 1 y se encontró al exportar en la Fase 4.
- **2026-11-04 — El motor guarda el volumen elegido por canal** en lugar de leerlo de Tone: un canal en mute informa `-Infinity`, que rompía los links y los mixes guardados.
- **2026-11-04 — Link en el hash** (no en el query string): el mix no llega a los logs del servidor ni a analytics, y no hace falta backend.
- **2026-11-04 — La exportación son 2 loops completos, desde un inicio de loop,** en el formato nativo de MediaRecorder. Alternativa propuesta (pendiente de decisión): render offline a WAV (ver resumen de la Fase 4).
- **2026-11-03 — `tsconfig.node.json`** usa `moduleResolution: bundler` para que `scripts/` importe código de `src/core` sin extensiones.
