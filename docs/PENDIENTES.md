# Pendientes de EzyBeatbox

> **Fuente de verdad de lo que falta.** Vive en el repo para que esté igual en cualquier PC o cuenta.
> Al terminar algo: márcalo `[x]`, muévelo a "Hecho recientemente" con la fecha y haz commit junto con el cambio.
>
> Última actualización: **2026-11-05**, Fases A y B de temáticas terminadas en la rama `feat/editorial-themes` (subida a GitHub, todavía sin fusionar a `main`: falta que Daniel la revise). En la PC1 se rescataron las referencias de diseño de una sesión anterior (ver "Ideas rescatadas").

## Estado en una línea

Las 6 fases del plan (0–5) y la PWA están terminadas. Ya hay interfaz editorial, selector de packs (Boom Bap y Trap, cada uno con su escenario temático) y cambio de pack sin recargar. Los doce personajes de Boom Bap y Trap ya están integrados en Rive. **Falta:** personalizar los avatares, revisar y fusionar la rama, publicar la app, probar en dispositivos reales y avanzar con las funciones nuevas.

---

## 1. Próximo paso de código (en este orden)

- [ ] **Fusionar `feat/editorial-themes` en `main`** cuando Daniel revise la interfaz (y hacer push para que la otra PC la tenga).
- [ ] **Personajes en Rive:** un renderer `RiveCharacter` con el contrato de `CharacterRenderer` (inputs `level`, `beat`, `status`, `muted`). Referencia de arte: las hojas de 6 personajes de Stitch. CLI 1.9.0 instalado. Primera pasada de los seis personajes de Boom Bap y los seis de Trap integrada. Ambos escenarios comprobados en el navegador. Primera afinación de la respuesta al audio por rol. Pendiente personalizar el arte y probar la sincronía con Bluetooth.
  - [x] **Cargar el arte de cada temática al abrir su pack.** El renderer mantiene el SVG como respaldo.
- [ ] **Loop Station** (contratos en `src/extensions/loopStation.ts` y `userSounds.ts`, diseño en `docs/EXTENSIONS.md`). Conviene hacerla con la app ya publicada, para probar el micrófono en el celular.

### Ideas rescatadas de la PC1 (sesión del 2026-11-04, sin implementar en esta rama)

Esa sesión hizo una portada neutra y personajes SVG streetwear **que nunca se subieron**. La rama los reemplazó con el selector de packs y Rive. Las referencias visuales están ahora en `docs/design/` (`characters-v1/` y `home-neutral-v1/`). El código completo quedó solo en la rama local `respaldo/portada-neutra-pc1` de la PC1 (no está en GitHub). Ideas que valen la pena evaluar:

- [ ] **Botón "Inicio" en el escenario** que vuelve a la portada **sin perder el beat**, y desde ahí **"Continuar mi beat"** sin recargar sonidos.
- [ ] **"Mis mixes" desde la portada:** abrir la biblioteca antes de elegir pack (solo cargar, sin el formulario de guardar). Al cargar un mix se prepara su pack.
- [ ] **Bases por temática:** después de elegir el género, elegir una base (se propusieron **tres por temática**) o **"Crear desde cero"**. Las bases deben sonar bien juntas y compartir tempo y duración.
- [ ] **Personaje piloto:** pulir **solo Kick** al nivel de su concepto (`docs/design/characters-v1/kick.webp`), comparándolo en escritorio y móvil, antes de rehacer los seis.
- [ ] **Detalles de animación:** parpadeo escalonado entre personajes y pulso del cuerpo con el audio. Verificar si Rive ya los cubre.
- [ ] **Robustez de carga:** evitar dos cargas de pack simultáneas y, si falla, reintentar el pack pedido en vez de volver al predeterminado. Verificar contra la rama, que ya maneja "pack inexistente".
- [ ] **Controles en móvil:** M/S debajo del personaje y quitar sonido junto a él, sin que tocar ese botón inicie un arrastre. Se relaciona con el punto de los botones de 32 px de la sección 5.

## 2. Tareas de Daniel (no son código)

- [x] **Diseño en Stitch:** dirección elegida y 6 personajes por temática (2026-11-05). Stitch está conectado por MCP en la configuración de usuario de esta PC (en la otra PC hay que agregarlo de nuevo con `claude mcp add stitch …`).
- [ ] **Rotar la API key de Stitch**: quedó escrita en una conversación.
- [ ] **Revisar la interfaz nueva** con `npm run dev` (selector, escenario hip hop y trap, "Cambiar estilo") y decir qué ajustar. Primera mirada el 2026-11-05: le gustó; sigue probando.
- [ ] **Generar más ritmos sintéticos** para ampliar la variedad de loops de prueba de Boom Bap y Trap.
- [ ] **Grabar los samples reales del pack trap** (140 BPM, 2 compases). Los nombres de los sonidos están en `scripts/placeholders/trapRecipes.ts`; para regenerar los placeholders hace falta `ffmpeg` en el `PATH`.
- [ ] **Animar los avatares en Rive** (o pedirle a Claude que lo haga con el CLI).
- [ ] **Grabar los samples reales** del pack hip hop siguiendo `docs/SAMPLES.md` (90 BPM, 2 compases exactos, ~−18 LUFS). Basta reemplazar los archivos: el script de placeholders no los vuelve a pisar.
- [ ] **Publicar la app (deploy)** desde la otra cuenta/PC, en Vercel o Netlify conectado al repo de GitHub, para que cada push se publique solo.
  - Desbloquea la QA en el celular, la instalación de la PWA (necesita HTTPS) y, después, el micrófono de la Loop Station.
  - Configuración: build `npm run build`, carpeta de salida `dist`, Node 24. No hace falta nada más: es una app estática.
  - Si se usa GitHub Pages, la app queda en `/Ezybeatbox/`: hay que ajustar `base` en Vite y el `start_url`, el `scope` y el patrón `/packs/` de la PWA (pedírselo a Claude).
  - Al terminar, anotar aquí la URL publicada.
- [ ] **QA en dispositivos reales:** Daniel retomará la prueba en su celular cuando tenga el cable para conectarlo a la PC. Ver la sección 3.

## 3. QA pendiente (solo se puede probar a mano)

Detalle completo en `docs/QA.md`. Lo más importante:

- [x] **Escuchar los loops con audífonos de cable.** Daniel confirmó que se escuchan bien.
- [x] **Reproducción prolongada en Trap:** seis capas durante 5 min 40 s, sin desfase perceptible con audífonos de cable.
- [ ] **Arrastre con el dedo en un celular real:** arrastrar hacia arriba asigna el sonido; deslizar en horizontal sobre la paleta hace scroll.
- [ ] **FPS en un celular de gama media** (Chrome DevTools remoto): unos 60 fps con los 6 personajes sonando.
- [ ] **Safari / iOS:**
  - [ ] Que el `.m4a` dure exacto (sin avisos de duración al cargar).
  - [ ] Que la exportación de audio funcione.
  - [ ] Que con el switch de silencio activado se siga escuchando.
- [ ] **Link compartido** en otro dispositivo o navegador: debe sonar idéntico. Verificado en otra pestaña del navegador local: Trap restauró 808 Largo y Rápido y ambos entraron en reproducción.
- [ ] **Bluetooth:** que los visuales caigan junto con el golpe que se escucha.
- [ ] **PWA:** instalarla en Android e iOS y usarla en modo avión.

## 4. Decisiones abiertas

- [ ] **¿Un 7.º personaje "Tú" para los sonidos de la Loop Station?** Por ahora los sonidos de usuario van en uno de los 6 personajes; el número fijo de personajes es `CHARACTER_COUNT = 6` en `src/core/packs/schema.ts`.
- [ ] **Hosting:** Vercel, Netlify o GitHub Pages (lo decide Daniel al hacer el deploy desde su otra cuenta).
- [ ] **¿2D o 3D para los personajes?** Daniel tiene cuenta de Meshy y preguntó por 3D. Recomendación: mantener 2D con Rive, que ya está integrado. El 3D no es necesario para la calidad, y sumaría peso y otro pipeline de animación.
- [ ] **¿Borrar la rama local `respaldo/portada-neutra-pc1`** de la PC1, una vez que esté claro que no se necesita más su código?

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

- **2026-11-05:** en la PC1 se rescataron las referencias de una sesión que no se había subido: los 6 conceptos de personajes hip hop (PNG → WebP, de 8,8 MB a 0,9 MB) y la portada neutra de Stitch, en `docs/design/`. Las ideas de interacción quedaron anotadas en la sección 1.

- **2026-11-05:** beta local guardada en el commit `7f5c12b` de `feat/editorial-themes`. Incluye los doce personajes de Rive, el indicador «Fuera del solo» y los resultados de QA. Pasaron el lint, el build y 232 pruebas. Queda elegir alojamiento y publicar una vista previa con HTTPS.

- **2026-11-05:** Fase B de temáticas: selector de packs como portada (basado en "Inicio neutro" de Stitch), pack `trap-01` a 140 BPM con su tema, catálogo `packs/index.json`, chip "Cambiar estilo" en la barra, y cambio de pack sin recargar (también desde un link o un mix guardado de otro pack). Si un pack no existe, se queda el escenario actual con un aviso.

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
