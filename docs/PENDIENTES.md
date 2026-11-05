# Pendientes de EzyBeatbox

> **Fuente de verdad de lo que falta.** Vive en el repo para que esté igual en cualquier PC o cuenta.
> Al terminar algo: márcalo `[x]`, muévelo a "Hecho recientemente" con la fecha y haz commit junto con el cambio.
>
> Última actualización: **2026-11-05**, Fase B en curso: pack trap y catálogo listos; falta la pantalla para elegir pack y cambiar de pack (rama `feat/editorial-themes`).

## Estado en una línea

Las 6 fases del plan (0–5) y la PWA están terminadas. Ya está la interfaz editorial (marfil, Plus Jakarta Sans, cobalto) con el escenario temático de hip hop. **Falta:** elegir pack y el pack trap, los personajes en Rive, publicar la app, probar en dispositivos reales y las funciones nuevas.

---

## 1. Próximo paso de código (en este orden)

- [ ] **Sistema multi-pack y temáticas, Fase B** (ver `docs/DESIGN_BRIEF.md`, secciones 0 y 3):
  - [x] Campo `theme` en el manifest y la interfaz editorial común (Fase A, 2026-11-05).
  - [ ] Pantalla para elegir el pack antes de "Toca para empezar", basada en "Inicio neutro · Elige tu sonido" de Stitch (tarjetas con la ilustración de cada temática).
  - [ ] Cambiar de pack sin recargar, con un botón "Cambiar estilo" en la barra. Hoy un link de otro pack con la app abierta muestra el aviso `mixOtherPack`.
  - [x] Pack de prueba `trap-01` (140 BPM, half-time, rolls de hi-hat) con placeholders y el tema trap. Catálogo `public/packs/index.json`; `description` y `cover` en el manifest (2026-11-05).
  - [ ] Cargar el arte de cada temática solo cuando se usa.
- [ ] **Personajes en Rive:** un renderer `RiveCharacter` con el contrato de `CharacterRenderer` (inputs `level`, `beat`, `status`, `muted`). Referencia de arte: las hojas de 6 personajes de Stitch. Falta instalar el CLI de Rive (`irm https://releases.rive.app/cli/install.ps1 | iex`; el instalador ya se revisó).
- [ ] **Loop Station** (contratos en `src/extensions/loopStation.ts` y `userSounds.ts`, diseño en `docs/EXTENSIONS.md`). Conviene hacerla con la app ya publicada, para probar el micrófono en el celular.

## 2. Tareas de Daniel (no son código)

- [x] **Diseño en Stitch:** dirección elegida y 6 personajes por temática (2026-11-05). Stitch está conectado por MCP en la configuración de usuario de esta PC (en la otra PC hay que agregarlo de nuevo con `claude mcp add stitch …`).
- [ ] **Rotar la API key de Stitch**: quedó escrita en una conversación.
- [ ] **Revisar la interfaz nueva** con `npm run dev` y decir qué ajustar.
- [ ] **Animar los avatares en Rive** (o pedirle a Claude que lo haga con el CLI).
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

## 5. Deuda técnica y mejoras menores

- [ ] **Cargar Tone.js recién después de "Toca para empezar".** Hoy la app pesa 193 KB comprimida, casi todo es Tone.js.
- [ ] **Botones M/S/✕ de 32 px en celular** (44 px desde `lg`), para que entren tres tarjetas por fila. Revisar en QA táctil si alcanza o si conviene otro layout.
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

- **2026-11-05:** interfaz editorial común y tema por pack (campo `theme` del manifest, solo `#rrggbb`). Escenario hip hop terracota con vinilos; Mis mixes y Compartir con el estilo nuevo. Se descartaron las 3 direcciones oscuras de Stitch.

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
