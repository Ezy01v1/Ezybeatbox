# Pendientes de EzyBeatbox

> **Fuente de verdad de lo que falta.** Vive en el repo para que esté igual en cualquier PC o cuenta.
> Al terminar algo: márcalo `[x]`, muévelo a "Hecho recientemente" con la fecha y haz commit junto con el cambio.
>
> Última actualización: **2026-11-06**, 4 géneros nuevos (Reggaetón, House, Drum & Bass, Afrobeat); Boom Bap en SVG propio (sin marca de agua de Rive), inicio sin perder el beat, respaldo SVG streetwear y parpadeo escalonado en Boom Bap; CLI de Rive en la PC2. En la PC1 se rescataron las referencias de diseño de una sesión anterior (ver "Ideas rescatadas").

## Estado en una línea

Las 6 fases del plan (0–5) y la PWA están terminadas. Ya hay interfaz editorial, selector de packs (Boom Bap, Trap, Reggaetón, House, Drum & Bass y Afrobeat; cada uno con su escenario temático) y cambio de pack sin recargar. Los doce personajes de Boom Bap y Trap ya están integrados en Rive. **Falta:** personalizar los avatares, publicar la app, probar en dispositivos reales y avanzar con las funciones nuevas.

---

## 1. Próximo paso de código (en este orden)

Foco de Daniel (2026-11-06): **diseño, animaciones, funcionalidades, variedad de ritmo y de géneros**. "Mis mixes" queda para después.

- [x] **Variedad de géneros:** Reggaetón/Dembow (95), House (124), Drum & Bass (174) y Afrobeat (105), con sonidos sintéticos propios.
- [x] **Portadas y escenarios de los 4 géneros nuevos:** personajes streetwear en SVG, un patrón de escenario por género (`sun`, `lights`, `speed`, `kente`) y portadas generadas con `scripts/covers/build-covers.ts`.
- [x] **Bases por género:** tres bases por pack y "Desde cero" en el escenario (campo `bases` del manifest).
- [ ] **Más variaciones por rol:** fills, medio tiempo, swing (hoy son 5 por personaje).
- [ ] **Diseño y animaciones:** Trap a SVG streetwear y un escenario con identidad por género (patrones de fondo, luces al compás). Cuando un sonido entra o sale en el compás, que el personaje lo muestre con su animación.
- [ ] **Funcionalidades:** BPM en vivo (cuantizado), botón "Sorpréndeme", drops.

- [ ] **Personajes en Rive:** un renderer `RiveCharacter` con el contrato de `CharacterRenderer` (inputs `level`, `beat`, `status`, `muted`). Referencia de arte: las hojas de 6 personajes de Stitch. CLI 1.9.0 instalado. Primera pasada de los seis personajes de Boom Bap y los seis de Trap integrada. Ambos escenarios comprobados en el navegador. Primera afinación de la respuesta al audio por rol. Pendiente personalizar el arte y probar la sincronía con Bluetooth.
  - [x] **Cargar el arte de cada temática al abrir su pack.** El renderer mantiene el SVG como respaldo.
  - [x] **Boom Bap con los personajes streetwear** (2026-11-05), generados por script desde los conceptos aprobados: `npm run rive:streetwear`. Ver `docs/ARCHITECTURE.md`.
  - [x] **Personajes más grandes y sin tarjetas** (2026-11-05): de la cadera hacia arriba, uno al lado del otro sobre el piso del escenario, estilo banda en vivo.
  - [ ] **Probar el arrastre con el dedo** en el escenario nuevo: el destino ya no es una tarjeta, sino el área del personaje.
  - [x] **Respaldo SVG streetwear en Boom Bap** (2026-11-06): mientras carga Rive, o si falla, se ve `StreetwearCharacter` (mismo arte, boca que sigue el audio). Trap sigue con el `SvgCharacter` clásico hasta que tenga su propio arte.
  - [x] **Parpadeo escalonado en Boom Bap** (2026-11-06): capa `Blink` en bucle, con periodo y desfase propios por rol (`BLINK` en `scripts/rive/build-streetwear.ts`). Trap no lo tiene: su rig no se genera con este script.
  - [x] **Marca de agua de Rive en Boom Bap** (2026-11-06): Boom Bap ya no usa Rive; se dibuja con SVG propio (`StreetwearCharacter`), con el mismo arte, movimiento y parpadeo. Taparla un tiempo fijo no servía: la presentación empieza a correr cuando el canvas se ve.
  - [ ] **Trap sigue en Rive con marca de agua.** Opciones: pasarlo también a SVG (hace falta su arte streetwear en `art.ts`) o pagar un plan de Rive y volver a publicar.
- [ ] **Loop Station** (contratos en `src/extensions/loopStation.ts` y `userSounds.ts`, diseño en `docs/EXTENSIONS.md`). Conviene hacerla con la app ya publicada, para probar el micrófono en el celular.

### Ideas rescatadas de la PC1 (sesión del 2026-11-04, sin implementar todavía)

Esa sesión hizo una portada neutra y personajes SVG streetwear **que nunca se subieron**. La interfaz actual los reemplazó con el selector de packs y Rive. Las referencias visuales están ahora en `docs/design/` (`characters-v1/` y `home-neutral-v1/`). El código completo quedó solo en la rama local `respaldo/portada-neutra-pc1` de la PC1 (no está en GitHub). Ideas que valen la pena evaluar:

- [x] **Inicio sin perder el beat** (2026-11-06): el logo del escenario es "Ir al inicio"; el beat sigue sonando en la portada, con una franja para pausarlo o reanudarlo y **"Continuar mi beat"**. "Cambiar estilo" también deja de detenerlo; solo se detiene al abrir otro pack.
- [ ] **"Mis mixes" desde la portada:** abrir la biblioteca antes de elegir pack (solo cargar, sin el formulario de guardar). Al cargar un mix se prepara su pack.
- [x] **Bases por temática:** hecho el 2026-11-06, en el escenario y no en un paso aparte. Detalle original: después de elegir el género, elegir una base (se propusieron **tres por temática**) o **"Crear desde cero"**. Las bases deben sonar bien juntas y compartir tempo y duración.
- [ ] **Personaje piloto:** pulir **solo Kick** al nivel de su concepto (`docs/design/characters-v1/kick.webp`), comparándolo en escritorio y móvil, antes de rehacer los seis.
- [x] **Pulso del cuerpo con el audio:** cubierto por el rig de Rive. El parpadeo escalonado quedó como pendiente en la sección de Rive.
- [ ] **Robustez de carga:** evitar dos cargas de pack simultáneas y, si falla, reintentar el pack pedido en vez de volver al predeterminado. Verificar contra el código actual, que ya maneja "pack inexistente".
- [ ] **Controles en móvil:** M/S debajo del personaje y quitar sonido junto a él, sin que tocar ese botón inicie un arrastre. Se relaciona con el punto de los botones de 32 px de la sección 5.

## 2. Tareas de Daniel (no son código)

- [x] **Diseño en Stitch:** dirección elegida y 6 personajes por temática (2026-11-05). Stitch está conectado por MCP en la configuración de usuario de esta PC (en la otra PC hay que agregarlo de nuevo con `claude mcp add stitch …`).
- [ ] **Rotar la API key de Stitch**: quedó escrita en una conversación.
- [ ] **Seguir revisando la interfaz nueva** con `npm run dev` (selector, escenario hip hop y trap, "Cambiar estilo"). Aprobada y fusionada en `main` el 2026-11-05; anotar aquí los ajustes que aparezcan.
- [ ] **Generar más ritmos sintéticos** para ampliar la variedad de loops de prueba de Boom Bap y Trap.
- [ ] **Grabar los samples reales del pack trap** (140 BPM, 2 compases). Los nombres de los sonidos están en `scripts/placeholders/trapRecipes.ts`; para regenerar los placeholders hace falta `ffmpeg` en el `PATH`.
- [ ] **Animar los avatares de Trap en Rive** (o pedirle a Claude que lo haga con el CLI). Los de Boom Bap ya usan los streetwear.
- [x] **CLI de Rive en las dos PCs:** instalado y con sesión iniciada en ambas (PC2, cuenta Easy01v: 1.9.1, 2026-11-06). Instalación: `irm https://releases.rive.app/cli/install.ps1 | iex`; `rive login` funciona con un código que se aprueba en el navegador.
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

- **2026-11-06:** bases prearmadas. Cada pack trae 3 bases en el manifest (`bases`, validadas contra los sonidos del pack). Sobre el escenario aparece "Bases" con sus botones y "Desde cero". Elegir una cambia todos los personajes en el siguiente compás y respeta mute, solo y volumen. Decisión: el selector vive en el escenario, no en un paso previo, para no agregar una pantalla más al inicio.

- **2026-11-06:** identidad visual de los géneros nuevos. Los cuatro usan los personajes streetwear SVG con su paleta. Cada uno tiene su fondo: sol y palmeras, rayos de club, líneas de velocidad y tela kente. Los patrones viven en `src/visuals/patterns.ts` y los comparten el escenario y el generador de portadas. Las portadas se rasterizan con `sharp`: `npx tsx scripts/covers/build-covers.ts`.

- **2026-11-06:** cuatro géneros nuevos con 30 loops sintéticos cada uno: `reggaeton-01`, `house-01`, `dnb-01` y `afrobeat-01`. Se agregaron instrumentos nuevos (`tom`, `cowbell`, `pluck`, `chord`, `reese`) en `scripts/placeholders/instruments.ts`. El generador usa `ffmpeg-static` si `ffmpeg` no está en el `PATH`. Los personajes usan el SVG clásico con la paleta de cada género. Faltan las portadas.

- **2026-11-06:** Boom Bap pasó de Rive a SVG propio para quitar la marca de agua del plan gratuito. Mismos valores de movimiento que el rig (aplaste a la cadera, rebote, boca, brillo, parpadeo escalonado compartido en `BLINK`). Se quitaron los `.riv` de Boom Bap de `public/`; el generador de Rive queda para las vistas previas.

- **2026-11-06:** inicio sin perder el beat y "Continuar mi beat". Se corrigió además un error: si el escenario se montaba justo al empezar un compás, un personaje podía quedarse en "En espera" aunque ya sonaba (Tone.Draw descarta avisos con más de 0,25 s de retraso). Ahora el store se corrige solo en cada tiempo.

- **2026-11-06:** parpadeo escalonado en los seis personajes de Boom Bap (Rive). Cada uno parpadea a su ritmo; comprobado renderizando el cuadro a mitad del parpadeo. `.riv` republicados.

- **2026-11-06:** respaldo SVG streetwear para Boom Bap. El arte se movió a `src/visuals/streetwear/art.ts` y lo comparten el generador de Rive (las escenas salen idénticas) y la app. Comprobado en el navegador con los `.riv` bloqueados.

- **2026-11-05:** vistas previas de los avatares en el repo (`docs/design/characters-rive/`, galería con los personajes cantando y en reposo), generadas con `npm run rive:streetwear -- --previews`. La generación de escenas ahora es determinista.

- **2026-11-05:** escenario sin tarjetas: personajes de la cadera hacia arriba (rig de Rive recortado a 120 × 158), grandes y alineados sobre una franja de piso continua con nombres y controles. Probado en escritorio y celular, con Boom Bap y con Trap.

- **2026-11-05:** los personajes de Boom Bap ahora son los **streetwear** aprobados, en Rive: conversor SVG→RML con pruebas, generador `npm run rive:streetwear`, colores de rol de Boom Bap actualizados a los de los conceptos y 6 `.riv` publicados. Probados cantando en escritorio y celular: la boca y el brillo siguen al audio.

- **2026-11-05:** `feat/editorial-themes` fusionada en `main` (fast-forward, 10 commits). Pasaron el lint, 232 pruebas y el build. El trabajo nuevo sigue en `main`.

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
- **Ver los avatares sin instalar nada:** `docs/design/characters-rive/README.md` (en GitHub se ve como galería: cantando y en reposo). Los conceptos originales están en `docs/design/characters-v1/`.
- **Para editar los avatares en otra PC:** instalar el CLI de Rive. `npm run rive:streetwear -- --previews` regenera escenas e imágenes; con `--publish` (requiere `rive login`) también los `.riv` del juego.
