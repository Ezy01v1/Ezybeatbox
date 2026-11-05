# Pendientes de EzyBeatbox

> **Fuente de verdad de lo que falta.** Vive en el repo para que esté igual en cualquier PC o cuenta.
> Al terminar algo: márcalo `[x]`, muévelo a "Hecho recientemente" con la fecha y haz commit junto con el cambio.
>
> Última actualización: **2026-11-04**, después de la PWA y el brief de diseño (commit `8950bf8`).

## Estado en una línea

Las 6 fases del plan (0–5) y la PWA están terminadas y en `main`. El juego tiene audio, escena, drag & drop, visuales reactivos, guardar/compartir/exportar, contratos de extensiones, y se puede instalar y usar sin conexión. **Falta:** el diseño visual final, publicar la app, probar en dispositivos reales y las funciones nuevas.

---

## 1. Próximo paso de código (en este orden)

- [ ] **Sistema multi-pack y temáticas** (ver `docs/DESIGN_BRIEF.md`, sección 3):
  - [ ] Campo `theme` en el manifest (colores por rol, fondo, skin de personajes) y que `src/visuals/` lo use en lugar de los colores fijos de `theme.ts`.
  - [ ] Pantalla para elegir el pack antes de "Toca para empezar".
  - [ ] Cambiar de pack sin recargar. Hoy un link de otro pack con la app abierta muestra el aviso `mixOtherPack`.
  - [ ] Segundo pack de prueba "Trap" (~140 BPM) con placeholders generados por script.
  - [ ] Cargar el arte de cada temática solo cuando se usa.
- [ ] **Rediseño visual**: cuando llegue el Figma. Se implementa leyéndolo con el MCP de Figma; solo cambian los estilos y `src/visuals/`, el motor y la lógica no se tocan.
- [ ] **Loop Station** (contratos en `src/extensions/loopStation.ts` y `userSounds.ts`, diseño en `docs/EXTENSIONS.md`). Conviene hacerla con la app ya publicada, para probar el micrófono en el celular.

## 2. Tareas de Daniel (no son código)

- [ ] **Diseño:** explorar en Google Stitch con los prompts de `docs/DESIGN_BRIEF.md` → diseño final en Figma (primero el rig base y la temática hip hop).
- [ ] **Autorizar la integración de Figma** con `/mcp` en una terminal de `claude` y pasar el link del archivo.
- [ ] **Grabar los samples reales** del pack hip hop siguiendo `docs/SAMPLES.md` (90 BPM, 2 compases exactos, ~−18 LUFS). Basta reemplazar los archivos: el script de placeholders no los vuelve a pisar.
- [ ] **Publicar la app (deploy)** desde la otra cuenta/PC, en Vercel o Netlify conectado al repo de GitHub, para que cada push se publique solo.
  - Desbloquea la QA en el celular, la instalación de la PWA (necesita HTTPS) y, después, el micrófono de la Loop Station.
  - Configuración: build `npm run build`, carpeta de salida `dist`, Node 24. No hace falta nada más: es una app estática.
  - Si se usa GitHub Pages, la app queda en `/Ezybeatbox/`: hay que ajustar `base` en Vite y el `start_url`, el `scope` y el patrón `/packs/` de la PWA (pedírselo a Claude).
  - Al terminar, anotar aquí la URL publicada.
- [ ] **QA en dispositivos reales:** ver la sección 3.

## 3. QA pendiente (solo se puede probar a mano)

Detalle completo en `docs/QA.md`. Lo más importante:

- [ ] **Escuchar con audífonos:** que no haya clics al repetirse el loop (Voice "Coro", Bass "Sub", FX "Vinilo") ni desfases en 5+ minutos.
- [ ] **Arrastre con el dedo en un celular real:** arrastrar hacia arriba asigna el sonido; deslizar en horizontal sobre la paleta hace scroll.
- [ ] **FPS en un celular de gama media** (Chrome DevTools remoto): unos 60 fps con los 6 personajes sonando.
- [ ] **Safari / iOS:**
  - [ ] Que el `.m4a` dure exacto (sin avisos de duración al cargar).
  - [ ] Que la exportación de audio funcione.
  - [ ] Que con el switch de silencio activado se siga escuchando.
- [ ] **Link compartido** abierto en otro dispositivo o navegador: debe sonar idéntico.
- [ ] **Bluetooth:** que los visuales caigan junto con el golpe que se escucha.
- [ ] **PWA:** instalarla en Android e iOS y usarla en modo avión.

## 4. Decisiones abiertas

- [ ] **¿Un 7.º personaje "Tú" para los sonidos de la Loop Station?** Por ahora los sonidos de usuario van en uno de los 6 personajes; el número fijo de personajes es `CHARACTER_COUNT = 6` en `src/core/packs/schema.ts`.
- [ ] **Hosting:** Vercel, Netlify o GitHub Pages (lo decide Daniel al hacer el deploy desde su otra cuenta).
- [ ] **Estilo visual base:** cuál de las 3 direcciones de Stitch (street 90s, neón o casual).

## 5. Deuda técnica y mejoras menores

- [ ] **Cargar Tone.js recién después de "Toca para empezar".** Hoy la app pesa 179 KB comprimida, casi todo es Tone.js.
- [ ] **Volver a TypeScript 7** cuando `typescript-eslint` lo soporte (hoy está fijado en 6.0 por eso).
- [ ] **Alertas moderadas de `npm audit`:** solo en herramientas de desarrollo (ESLint/minimatch, workbox-build). Revisar cuando salgan versiones arregladas, sin forzar un downgrade.
- [ ] **Safari no informa `outputLatency`:** ahí los visuales no compensan la latencia de Bluetooth.
- [ ] **El audio exportado dura ~47 ms menos** de lo esperado, porque MediaRecorder tarda en arrancar. Se decidió mantener `Tone.Recorder` (2026-11-04) en lugar del render offline a WAV.
- [ ] **Agregar el idioma inglés:** crear `src/i18n/locales/en/common.json`; la estructura ya está lista.

## 6. Más adelante (roadmap)

Orden sugerido en `docs/EXTENSIONS.md`:

1. Backend (NestJS + PostgreSQL): `HttpMixRepository`, links cortos, subir sonidos de usuario.
2. Reconocimiento de beatbox (antes hay que juntar muestras etiquetadas para entrenar).
3. Modo colaborativo en tiempo real.
4. App nativa con Capacitor y plugin de audio de baja latencia.
5. Más temáticas: hip hop → trap → pop → latino (bachata, etc.), todo hecho con la boca.
6. Monetización: packs de pago (ya están aislados por pack).

---

## Hecho recientemente

- **2026-11-04:** brief de diseño con prompts de Stitch, convenciones de Figma y temáticas (`docs/DESIGN_BRIEF.md`).
- **2026-11-04:** PWA: instalable, sin conexión y aviso de actualización; sesión de audio de iOS.
- **2026-11-04:** Fase 5: contratos de extensiones y `docs/EXTENSIONS.md`.
- **2026-11-04:** Fase 4: guardar, compartir por link y exportar audio. Se corrigió que el solo silenciaba toda la app.
- **2026-11-04:** Fases 2 y 3: escena, drag & drop y visuales reactivos.
- **2026-11-03:** Fases 0 y 1: scaffold, motor de audio y placeholders.

## Cómo retomar en otra PC

```bash
git pull
```

```bash
npm install
```

```bash
npm run dev
```

- Requisitos: Node ≥ 22 (recomendado 24) y `ffmpeg` en el `PATH` (solo para regenerar placeholders).
- Antes de dar algo por terminado: `npm run lint`, `npm test` y `npm run build` en limpio.
- Claude lee `CLAUDE.md` al iniciar, y ahí se le indica revisar este archivo.
