# EzyBeatbox — guía para agentes

App web de "6 personajes con loops cuantizados al compás" (juego casual de beatbox). Autor: Daniel (beatboxer, ingeniero). Arquitectura en `docs/ARCHITECTURE.md`.

## Al empezar y al terminar una sesión

Daniel trabaja en **dos PCs con cuentas distintas**: la memoria de Claude y las conversaciones no se comparten entre ellas. El repo es la única memoria común.

- **Al empezar:** lee `docs/PENDIENTES.md`. Es la lista viva de lo que falta, las decisiones abiertas y las tareas de Daniel. Si pide "continúa", sigue con el primer punto pendiente de su sección 1.
- **Al terminar un trabajo:** actualiza `docs/PENDIENTES.md` en el mismo commit (marca lo hecho, agrega lo nuevo que quedó pendiente y cambia la fecha).
- Cuando Daniel dice "continúa", avanza con la opción recomendada en lugar de abrir preguntas; deja las decisiones tomadas en el resumen para que pueda revertirlas.

## Reglas de trabajo

- Trabajar **por fases**. Al terminar cada una: qué se hizo, cómo probarlo, pendientes y decisiones. Esperar aprobación antes de la siguiente.
- No cambiar decisiones tomadas sin preguntar; proponer alternativas con pros y contras.
- No agregar funcionalidades fuera de la fase actual.
- Código y comentarios técnicos en **inglés**; UI y textos para el usuario en **español** vía i18n (nunca hardcodeados).
- Commits pequeños con mensajes convencionales (`feat:`, `fix:`, `docs:`, `chore:`).
- Mantener `docs/ARCHITECTURE.md` al día cuando cambie algo estructural.

## Fases

0. Scaffold ✅
1. Motor de audio + packs ✅ (pendiente: QA manual en Safari/iOS y Android, ver `docs/QA.md`)
2. Escena y drag & drop ✅ (pendiente: QA con touch real en el celular, ver `docs/QA.md`)
3. Visual reactivo ✅ (pendiente: medir fps en un celular de gama media, ver `docs/QA.md`)
4. Guardar y compartir ✅ (pendiente: QA del link en otro dispositivo y exportación en Safari)
5. Puntos de extensión ✅ (contratos en `src/extensions/`, diseño en `docs/EXTENSIONS.md`; la app no los importa)

Después de las fases: PWA ✅. Lo que sigue y su orden está en `docs/PENDIENTES.md`.

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
