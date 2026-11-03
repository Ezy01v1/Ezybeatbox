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
- **2026-11-02 — Alias de imports** `@/` → `src/`.
