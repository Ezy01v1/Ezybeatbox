# EzyBeatbox — guía para agentes

App web de "6 personajes con loops cuantizados al compás" (juego casual de beatbox). Autor: Daniel (beatboxer, ingeniero). Arquitectura en `docs/ARCHITECTURE.md`.

## Reglas de trabajo

- Trabajar **por fases**. Al terminar cada una: qué se hizo, cómo probarlo, pendientes y decisiones. Esperar aprobación antes de la siguiente.
- No cambiar decisiones tomadas sin preguntar; proponer alternativas con pros y contras.
- No agregar funcionalidades fuera de la fase actual.
- Código y comentarios técnicos en **inglés**; UI y textos para el usuario en **español** vía i18n (nunca hardcodeados).
- Commits pequeños con mensajes convencionales (`feat:`, `fix:`, `docs:`, `chore:`).
- Mantener `docs/ARCHITECTURE.md` al día cuando cambie algo estructural.

## Fases

0. Scaffold ✅
1. Motor de audio + packs: Zod, `AudioEngine`, loops cuantizados, canales, mute/solo, limitador, placeholders, tests de cuantización y manifest.
2. Escena y drag & drop: pantalla "Toca para empezar", 6 personajes SVG, pointer events + fallback teclado/tap, controles, i18n.
3. Visual reactivo: `CharacterRenderer` SVG ligado al nivel de cada canal; 60 fps sin re-renders por frame.
4. Guardar y compartir: `MixRepository` (localStorage), link versionado, exportar audio con `Tone.Recorder`.
5. Puntos de extensión: solo interfaces + `docs/EXTENSIONS.md` (Loop Station, BeatRecognizer, colaborativo, backend, móvil).

## Reglas de audio (no negociables)

- Todo el scheduling con `Tone.Transport`; nunca `setTimeout`/`setInterval` para audio.
- Los cambios de sonido entran en el **siguiente inicio de compás**.
- Duración del loop calculada por BPM (`loopEnd`), no por la duración del archivo.
- Un canal (`Tone.Channel` + meter) por personaje; master con limitador.

## Calidad

- TS strict, sin `any` salvo justificación comentada.
- Antes de dar algo por terminado: `npm run lint`, `npm test` y `npm run build` en limpio.
- Accesibilidad: foco visible, alternativa de teclado al drag & drop, `aria-label`, `prefers-reduced-motion`.
- Sin samples ni imágenes con derechos de terceros.
