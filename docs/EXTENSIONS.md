# Puntos de extensión

Contratos para las funciones que vienen después. Están en `src/extensions/` y son **solo tipos y constantes**: la app no los importa y no hay lógica a medias en producción. `src/extensions/extensions.test.ts` comprueba que cada contrato se puede implementar y que encaja con el núcleo actual (ids, roles y `Mix`).

| Extensión                 | Contrato                                                              | Qué falta para implementarla                                      |
| ------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Loop Station              | `LoopRecorder`, `LatencyCalibrator`, `UserSound*`                     | AudioWorklet de grabación, `UserSoundHost` en el motor, IndexedDB |
| Reconocimiento de beatbox | `BeatRecognizer`, `PatternQuantizer`, `PatternRenderer`               | Detección de onsets, clasificador entrenado con tus muestras      |
| Colaborativo              | `MixOperation`, `StampedOperation`, `MixSyncTransport`, `SharedClock` | Backend en tiempo real (WebSocket)                                |
| Backend                   | `MixRepository` (ya existe en `core/mix`)                             | API NestJS + PostgreSQL y un `HttpMixRepository`                  |
| Móvil                     | — (decisiones de plataforma)                                          | PWA y Capacitor; plugin nativo de audio para la Loop Station      |

---

## 1. Loop Station

**Objetivo:** grabar una capa de voz en sincronía con el compás y usarla como un sonido más en un personaje.

### Flujo

```
arm()  ──► getUserMedia(LOOP_RECORDER_MIC_CONSTRAINTS)
record({ bars, countInBars, latencyCompensationSeconds })
  ├─ espera el próximo inicio de loop (barStart con bar % loopBars === 0)
  ├─ cuenta de entrada opcional (metrónomo en el transporte)
  ├─ AudioWorklet captura muestras con su `currentFrame` (marca de tiempo exacta)
  └─ recorta [inicio − latencia, inicio − latencia + duración del loop]
       └─ suma la cola del final al inicio (igual que los placeholders) → loop sin clic
→ RecordedLoop (AudioBuffer exacto) → UserSound → UserSoundHost.addUserSound()
```

- **Micrófono crudo:** `echoCancellation`, `noiseSuppression` y `autoGainControl` en `false`. Ese procesamiento está pensado para llamadas y aplasta los transitorios del beatbox.
- **AudioWorklet en lugar de MediaRecorder:** MediaRecorder no es preciso a la muestra y comprime el audio. El worklet entrega muestras con tiempo exacto del `AudioContext`, así que el recorte cae justo en el compás.
- **Compensación de latencia:** lo que grabas llega tarde por la latencia de entrada (micrófono) y de salida (lo que escuchas para seguir el tiempo). `LatencyCalibrator.measureRoundTrip()` reproduce clics, los graba y detecta los onsets. El resultado se guarda **por dispositivo** y además se puede ajustar a mano. Con audífonos Bluetooth la latencia es enorme (150–300 ms): se avisa al usuario y se recomienda usar cable.
- **Cómo se convierte en un `Sound`:**
  1. `RecordedLoop` → `UserSound` con id `user-<uuid>` (kebab-case válido, igual que los ids de packs), `characterId`, `label`, `bpm` y `bars`.
  2. `AudioEngine` implementa `UserSoundHost.addUserSound()`: crea un `Tone.Player` con el mismo `loopEnd` calculado por BPM y lo conecta al canal del personaje.
  3. Desde ahí, `setSound(characterId, 'user-…')`, la cuantización, mute/solo, los visuales y `Mix` funcionan **sin cambios**.
  4. Se guarda en IndexedDB mediante `UserSoundStore` (localStorage no sirve para audio).
- **"Slot libre":** por ahora un sonido de usuario va en uno de los 6 personajes, como cualquier otro. Un 7.º personaje "Tú" sería otra decisión de producto, porque `CHARACTER_COUNT = 6` está fijado en el esquema.
- **Compartir:** el audio no cabe en un link. Hoy, si un mix con sonidos de usuario llega a otro dispositivo, `fitMixToPack` los omite y avisa ("1 sonido ya no existe…"), y la prueba lo comprueba. Con backend, los sonidos se suben a almacenamiento de objetos y el link pasa a llevar el id del servidor.

## 2. Reconocimiento de beatbox

**Objetivo:** escuchar al usuario hacer beatbox y convertirlo en un patrón o loop.

```
MediaStream ─► BeatRecognizer ─► BeatHit { class, time, confidence, velocity }
                                     │  (time = tiempo del AudioContext, sin la latencia de entrada)
                                     ▼
              PatternQuantizer.quantize(hits, { startTime, bpm, bars, stepsPerBar: 16, … })
                                     ▼
              BeatPattern { steps: [{ step, class, velocity }] }
                    ├─► PatternRenderer.render(pattern, one-shots) ─► AudioBuffer ─► UserSound
                    └─► (alternativa) elegir la variante del pack más parecida por personaje
```

- **Detección:** un AudioWorklet calcula el flujo espectral (spectral flux) y detecta onsets con umbral adaptativo. Por cada onset extrae unos 50 ms de rasgos: energía por bandas, centroide espectral, cruces por cero y MFCC.
- **Clasificación**, en dos etapas:
  1. Reglas simples: un kick tiene energía grave y es corto; un hi-hat tiene un centroide alto.
  2. Un modelo pequeño (TensorFlow.js u ONNX Runtime Web) entrenado con **muestras etiquetadas grabadas por Daniel**. Todo corre en el navegador.
- **Clases → personajes:** `BEATBOX_CLASS_TO_ROLE` define qué personaje recibe cada clase (kick → Kick, hi-hats → Hi-hat, vocal → Voice, …).
- **Cuantización:** cada `time` se convierte a posición musical con la misma matemática de `core/audio/timing.ts` y se ajusta a semicorcheas, con tolerancia para el swing. Si hay dos golpes en el mismo paso, se queda el de mayor confianza. Los hits bajo `minConfidence` se descartan.
- **De patrón a loop:** `PatternRenderer` dibuja el patrón offline con one-shots (del pack o grabados por el usuario) y genera un `AudioBuffer` del largo exacto del loop. Desde ahí sigue el mismo camino que la Loop Station (`UserSound`).

## 3. Colaborativo en tiempo real

**Objetivo:** varias personas editando el mismo mix al mismo tiempo.

- **El estado ya es serializable:** `Mix` es datos planos. Cada cambio se expresa como una `MixOperation` sobre un campo (`setSound`, `setMute`, `setSolo`, `setVolume`, `setMasterVolume`). La prueba demuestra que cualquier `Mix` se puede reconstruir solo con operaciones.
- **Resolución de conflictos:** cada campo es un registro "gana el último que escribe" (LWW). Las operaciones viajan como `StampedOperation` con reloj de Lamport + `clientId` para desempatar. No hace falta un CRDT complejo porque los campos son independientes.
- **Latencia de red:** los cambios de sonido ya entran **en el siguiente compás** (2,7 s a 90 BPM). Una operación que llega con 100–300 ms de retraso sigue cayendo en el mismo compás en todos los clientes.
- **Transporte compartido:** `SharedClock` estima el desfase con el servidor (intercambio de pings estilo NTP) y fija un origen común para el compás 1 (`originServerMs`). Cada cliente arranca su `Tone.Transport` en ese instante convertido a su tiempo local, así que los compases quedan alineados entre dispositivos.
- **Integración:** los eventos del motor (`soundQueued`, etc.) se convierten en operaciones salientes, y las entrantes se aplican con las mismas acciones del store (`setSound`, `toggleMute`…). `MixSyncTransport` se implementa con WebSocket (NestJS Gateway) o con un canal de datos WebRTC.

## 4. Backend

La persistencia ya pasa por el puerto `MixRepository` (`core/mix/repository.ts`), que es asíncrono justamente para esto.

- **Nueva implementación:** `HttpMixRepository implements MixRepository`, que llama a una API REST. Para cambiarla basta **una línea** en `src/main.tsx` (`repository: new HttpMixRepository(...)`). El store y la UI no se tocan.
- **API propuesta (NestJS + PostgreSQL):**

  | Método y ruta       | Uso                                                   |
  | ------------------- | ----------------------------------------------------- |
  | `GET /mixes`        | Lista los mixes del usuario (`SavedMixSummary[]`)     |
  | `GET /mixes/:id`    | Un mix (`SavedMix`)                                   |
  | `PUT /mixes/:id`    | Crear o actualizar (`SaveMixInput`)                   |
  | `DELETE /mixes/:id` | Eliminar                                              |
  | `POST /shares`      | Guarda un mix y devuelve un slug corto (`/m/abc123`)  |
  | `POST /user-sounds` | Sube un sonido de usuario a almacenamiento de objetos |

  ```sql
  create table mixes (
    id uuid primary key,
    owner_id uuid not null references users(id),
    name text not null check (length(name) <= 60),
    pack_id text not null,
    pack_version int not null,
    mix jsonb not null,            -- validado con el mismo esquema Zod (core/mix/schema.ts)
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  ```

- **Validación compartida:** `core/mix/schema.ts` y `core/packs/schema.ts` no dependen del navegador. Se pueden mover a un paquete compartido (monorepo) y usarse igual en NestJS.
- **Links:** el link actual con el mix en el hash sigue funcionando sin backend. El backend agrega links cortos y la posibilidad de compartir sonidos de usuario.
- **Packs de pago:** los packs ya están aislados por carpeta y manifest versionado. El backend serviría los archivos con URLs firmadas según lo que haya comprado el usuario, y `packsBaseUrl` apuntaría a esa CDN.

## 5. Móvil (PWA y Capacitor)

### PWA (primer paso, sin tiendas)

- `manifest.webmanifest` + service worker (por ejemplo `vite-plugin-pwa`) para precachear el shell de la app y los packs. Así funciona offline e instalable.
- Ya está listo: diseño mobile-first, pointer events con `touch-action` correcto, safe areas (`env(safe-area-inset-*)`) y pantalla "Toca para reanudar" para cuando el sistema suspende el audio.
- **iOS:**
  - El switch de silencio silencia Web Audio. Hay que fijar `navigator.audioSession.type = 'playback'` donde exista; si no, usar el truco de un `<audio>` silencioso en loop.
  - Al volver de segundo plano, el contexto queda `interrupted` y ya se maneja.

### Capacitor (tiendas)

- Envuelve la misma app web en iOS y Android sin reescribirla.
- **Latencia:** el Web Audio dentro del WebView agrega latencia, y en Android puede pasar de 50 ms. Para **reproducir** loops no importa, porque todo está programado en el transporte. Para la **Loop Station** y el **reconocimiento** sí: ahí conviene un plugin nativo (Oboe/AAudio en Android, AVAudioEngine en iOS) que implemente las **mismas interfaces** `LoopRecorder` y `BeatRecognizer`. Por eso son interfaces.
- **Bluetooth:** la latencia de salida ya se compensa en los visuales (`getOutputLatency`). Para grabar, se avisa al usuario y se recomienda usar audífonos con cable.

---

## Orden sugerido

1. **PWA** ✅ (hecha: instalable, offline y aviso de actualización).
2. **Loop Station** con `UserSoundHost` e IndexedDB: es el diferencial para beatboxers.
3. **Backend** (`HttpMixRepository`, links cortos, subida de sonidos de usuario).
4. **Reconocimiento:** necesita juntar datos de entrenamiento antes.
5. **Colaborativo:** depende del backend.
