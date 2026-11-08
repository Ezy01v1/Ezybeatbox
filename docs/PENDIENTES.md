# Pendientes de EzyBeatbox

> **Fuente de verdad de lo que falta.** Vive en el repo para que esté igual en cualquier PC o cuenta.
> Al terminar algo: márcalo `[x]`, muévelo a "Hecho recientemente" con la fecha y haz commit junto con el cambio.
>
> Última actualización: **2026-11-08**. Daniel dio su visto bueno al aspecto del piloto de Kick de Boom Bap.

## Estado en una línea

Las 6 fases del plan (0–5) y la PWA están terminadas. Hay seis géneros: Boom Bap 90, Trap 140, Reggaetón 95, House 124, Drum & Bass 174 y Afrobeat 105. Cada uno tiene:

- sus colores, su escenario con patrón que late al compás y su portada;
- tres bases prearmadas;
- 11 sonidos por sección (5 propios más swing, ½, dos remates, corte y ×2);
- su paleta sonora propia.

Cualquier personaje toca cualquier sonido, uno por personaje. Queda escuchar los loops y las funciones nuevas, ajustar los sonidos según esa revisión, publicar la app y hacer la QA en el celular.

---

## 1. Próximo paso de código (en este orden)

**Para retomar en la otra PC:** `git pull`, `npm install` (se agregaron `ffmpeg-static` y `sharp` como dependencias de desarrollo) y `npm run dev`.

1. [ ] **Ajustar los sonidos según lo que escuche Daniel.** Le gustaron en general (2026-11-06), pero falta su lista concreta.
   - Los sonidos de cada género están en `scripts/placeholders/palettes.ts`, los instrumentos en `voices.ts` e `instruments.ts`, y el color de mezcla en `finish.ts`.
   - Para regenerar un pack: `npx tsx scripts/generate-placeholders.ts --force --pack <id>`. Después, `git checkout` de los `.ogg`/`.m4a` de los packs que no se tocaron, porque `--force` vuelve a codificar todo y cambia los bytes.
2. [ ] **Más combinaciones por género:** ya hay 11 sonidos por sección (2026-11-06), con remates automáticos (ver "Hecho recientemente").
   - Falta que Daniel los escuche: si algún remate o "×2" suena mal, se cambia su fuente en `withFills` (`scripts/placeholders/packs.ts`) o se reemplaza con `overrideSounds` por uno escrito a mano.
   - Queda **1 lugar libre por sección** (el máximo del manifest es 12). Agregar ids nuevos solo al final, para no romper las mezclas guardadas.
3. [ ] **Funcionalidades** (recomendado en este orden):
   - [x] **"Sorpréndeme"** (2026-11-06): botón junto a las bases. Falta que Daniel lo pruebe varias veces y diga si las mezclas le suenan bien.
   - [x] **Drops** (2026-11-06): botón "Drop" junto a las bases. Falta que Daniel lo escuche. Si gusta, se podría agregar un atajo de teclado o un drop de dos compases.
   - [x] **BPM en vivo** (2026-11-06): control − / BPM / + en la barra superior. Pendiente:
     - Que Daniel lo escuche. Al cambiar de tempo, el último instante antes del compás puede sonar con el tono nuevo, porque Tone aplica el `playbackRate` con anticipación.
     - Decidir si el rango de ±15 % alcanza o si quiere conservar el tono. Eso requeriría `GrainPlayer`, que en baterías suena peor.
4. [x] **Nombres de los personajes** (2026-11-06): nombres al azar y neutros, un elenco distinto por género. Si alguno no le gusta a Daniel, se cambia en `scripts/placeholders/names.ts`.
5. [x] **Teclado** (2026-11-06): con un sonido enfocado, las teclas 1–6 eligen el personaje que lo toca.
6. [x] **Ropa o accesorios por género** (2026-11-08). Los seis géneros tienen un parche propio sobre la ropa streetwear.
7. [ ] **Golpes CC0 o grabados por Daniel** para las voces y los FX (como beatboxer), y algunos golpes de batería. Solo con licencia CC0 (por ejemplo, Freesound filtrado por "Creative Commons 0"), porque la app redistribuye los sonidos. Los ritmos los compone Claude.

Foco de Daniel (2026-11-06): **diseño, animaciones, funcionalidades, variedad de ritmo y de géneros**.

### Hecho en la sesión del 2026-11-06 (PC2)

- [x] Cuatro géneros nuevos: Reggaetón/Dembow, House, Drum & Bass y Afrobeat.
- [x] Portadas y escenarios propios (`sun`, `lights`, `speed`, `kente`), personajes streetwear SVG en todos los packs (Rive desactivado, sin marca de agua).
- [x] Bases por género (3 + "Desde cero"), con el campo `bases` del manifest.
- [x] Variaciones swing y ½ (7 sonidos por sección).
- [x] Animaciones al compás: salto al entrar, hundimiento al salir, fondo que late con el beat.
- [x] Cualquier sonido en cualquier personaje, uno por personaje. El color viene del sonido; el aspecto es el del personaje.
- [x] Paleta sonora propia en los seis géneros: voces con formantes, talkbox, 808, 909, caja de break, scratch, rewind, tape stop, bocina, shekere, log drum y color de mezcla por género.

- [ ] **Loop Station** (contratos en `src/extensions/loopStation.ts` y `userSounds.ts`, diseño en `docs/EXTENSIONS.md`). Conviene hacerla con la app ya publicada, para probar el micrófono en el celular.

### Ideas rescatadas de la PC1 (sesión del 2026-11-04, sin implementar todavía)

Esa sesión hizo una portada neutra y personajes SVG streetwear **que nunca se subieron**. La interfaz actual los reemplazó con el selector de packs y Rive. Las referencias visuales están ahora en `docs/design/` (`characters-v1/` y `home-neutral-v1/`). El código completo quedó solo en la rama local `respaldo/portada-neutra-pc1` de la PC1 (no está en GitHub). Ideas que valen la pena evaluar:

- [x] **Inicio sin perder el beat** (2026-11-06): el logo del escenario es "Ir al inicio"; el beat sigue sonando en la portada, con una franja para pausarlo o reanudarlo y **"Continuar mi beat"**. "Cambiar estilo" también deja de detenerlo; solo se detiene al abrir otro pack.
- [x] **«Mis mixes» desde la portada** (2026-11-08). La biblioteca permite cargar un mix antes de elegir pack.
- [x] **Bases por temática:** hecho el 2026-11-06, en el escenario y no en un paso aparte. Detalle original: después de elegir el género, elegir una base (se propusieron **tres por temática**) o **"Crear desde cero"**. Las bases deben sonar bien juntas y compartir tempo y duración.
- [x] **Personaje piloto** (2026-11-08). Se pulió Kick de Boom Bap con el concepto de referencia y se comparó en escritorio y móvil.
- [x] **Revisión visual del piloto** (2026-11-08). A Daniel le gustó el nuevo aspecto de Kick y le pareció una mejora clara.
- [ ] **Pulir el resto del elenco de Boom Bap** usando el piloto de Kick y el concepto aprobado de cada personaje como referencias.
- [x] **Pulso del cuerpo con el audio:** cubierto por el rig de Rive. El parpadeo escalonado quedó como pendiente en la sección de Rive.
- [x] **Robustez de carga** (2026-11-08). Se bloquean cargas simultáneas y «Reintentar» vuelve a abrir el pack pedido.
- [x] **Controles en móvil** (2026-11-08). M/S/✕ están debajo del personaje y fuera del área de arrastre. La fila se ajusta al ancho de su columna.

## 2. Tareas de Daniel (no son código)

- [x] **Diseño en Stitch:** dirección elegida y 6 personajes por temática (2026-11-05). Stitch está conectado por MCP en la configuración de usuario de esta PC (en la otra PC hay que agregarlo de nuevo con `claude mcp add stitch …`).
- [ ] **Rotar la API key de Stitch**: quedó escrita en una conversación.
- [ ] **Seguir revisando la interfaz nueva** con `npm run dev` (selector, escenario hip hop y trap, "Cambiar estilo"). Aprobada y fusionada en `main` el 2026-11-05; anotar aquí los ajustes que aparezcan.
- [ ] **Generar más ritmos sintéticos** para ampliar la variedad de loops de prueba de Boom Bap y Trap.
- [ ] **Grabar los samples reales del pack trap** (140 BPM, 2 compases). Los nombres de los sonidos están en `scripts/placeholders/trapRecipes.ts`; para regenerar los placeholders hace falta `ffmpeg` en el `PATH`.
- [x] ~~Animar los avatares de Trap en Rive~~: Trap pasó a SVG streetwear el 2026-11-06. Rive queda para el día que haya plan de pago.
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
- [ ] **¿2D o 3D para los personajes?** Daniel tiene cuenta de Meshy y preguntó por 3D. Recomendación: mantener 2D en SVG propio (desde el 2026-11-06 ya no se usa Rive). El 3D sumaría peso y otro pipeline de animación.
- [ ] **¿Borrar la rama local `respaldo/portada-neutra-pc1`** de la PC1, una vez que esté claro que no se necesita más su código?

## 5. Deuda técnica y mejoras menores

- [x] **Cargar Tone.js después del primer gesto** (2026-11-08). El JavaScript inicial pasó de unos 209 a 150 KB comprimidos con gzip.
- [ ] **Comodidad de los botones M/S/✕ en un celular real.** La altura se mantiene en 32 px en móvil, 36 px en `sm` y 44 px desde `lg`. El ancho se ajusta si la columna es estrecha.
- [ ] **Volver a TypeScript 7** cuando `typescript-eslint` lo soporte (hoy está fijado en 6.0 por eso).
- [ ] **Alertas moderadas de `npm audit`:** solo en herramientas de desarrollo (ESLint/minimatch, workbox-build). Revisar cuando salgan versiones arregladas, sin forzar un downgrade.
- [ ] **Safari no informa `outputLatency`:** ahí los visuales no compensan la latencia de Bluetooth.
- [ ] **El audio exportado dura ~47 ms menos** de lo esperado, porque MediaRecorder tarda en arrancar. Se decidió mantener `Tone.Recorder` (2026-11-04) en lugar del render offline a WAV.
- [x] **Inglés para la interfaz** (2026-11-08). El selector de Inicio recuerda el idioma.

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

- **2026-11-08.** Piloto SVG de Kick en Boom Bap, con gorra hacia atrás, bomber más ancha, cadena y sombreado del concepto aprobado. El personaje conserva la boca reactiva, el rebote y el parche de vinilo. Los ojos abiertos en reposo también usan el parpadeo del rig.

- **2026-11-08.** «Mis mixes» desde Inicio abre una biblioteca de solo carga. Elegir un mix restaura su género y su mezcla. Si el pack ya no existe, vuelve a Inicio con un aviso. Guardar y eliminar siguen disponibles en el escenario.

- **2026-11-08.** Tone.js se carga al abrir un pack. El primer toque reanuda el contexto nativo antes de esperar el módulo. Se verificó la reproducción en Chromium, incluso al recargar un mix compartido sin red con la caché de la PWA activa. Queda verificar el desbloqueo en Safari/iOS real.

- **2026-11-08.** Interfaz en inglés con selector en Inicio. La preferencia se guarda por navegador. Los textos de los packs conservan su idioma original cuando falta una traducción.

- **2026-11-08.** M/S/✕ caben en su columna sin invadir la de otro personaje. Si falta altura, el escenario se desplaza sobre la paleta para mantener accesibles ambas filas. Se comprobó en Chromium de 320 a 1280 px, incluido quitar un sonido con un toque emulado a 320 px.

- **2026-11-08.** Se bloquea una segunda carga desde el desbloqueo de audio. Si falla el desbloqueo o la red, «Reintentar» usa el pack elegido. Si el beat anterior sigue disponible, se puede volver a él con «Continuar mi beat». Un pack inexistente sigue devolviendo al escenario anterior con aviso.

- **2026-11-08.** Parche SVG por género en la ropa de los seis personajes. Vinilo en Boom Bap, rayo en Trap, sol en Reggaetón, bola facetada en House, flechas en Drum & Bass y rombos en Afrobeat. El parche se mueve con el torso y sigue al género aunque el personaje cambie de sonido.

- **2026-11-06 (PC1):** **teclado en la paleta**. Con un sonido enfocado, Enter lo pone donde decide `placeSound` (como antes) y las teclas 1–6 lo ponen en ese personaje, en el orden del escenario. Así se pueden poner dos bombos.
  - La pista con los números y los nombres ("1 Tali · 2 Luca…") aparece solo al navegar con el teclado. Los lectores de pantalla la leen siempre (`aria-describedby`, `aria-keyshortcuts`).
  - Probado en Boom Bap: Clásico en Uri (4) y Doble en Tali (1).

- **2026-11-06 (PC1):** **nombres propios** para los personajes. Se eligieron al azar de una lista de 40 nombres neutros (`scripts/placeholders/names.ts`), con una semilla fija: no cambian al regenerar y no se repiten entre géneros.
  - Boom Bap: Tali, Luca, Gabi, Uri, Nao, Isa. Trap: Mika, Vic, Sasha, Sol, Oli, Toni. Reggaetón: Jesse, Pau, Fran, Juni, Ilan, Jade. House: Eli, Sam, Coco, Max, Río, Ale. Drum & Bass: Andy, Lou, Ari, Cris, Mar, Alex. Afrobeat: Ren, Remy, Noa, Charlie, Robin, Zuri.
  - El manifest tiene el campo opcional `name` por personaje. El escenario muestra el nombre; la paleta sigue agrupando por sección (Kick, Snare…).
  - `generate-placeholders` reescribe un manifest cuando cambia cualquier parte de su contenido.

- **2026-11-06 (PC1):** **tempo en vivo**. En la barra superior hay − / BPM / + (de a 2 BPM, dentro de ±15 % del tempo del pack). Al tocar el número vuelve al tempo original.
  - Mientras suena, el cambio entra en el siguiente compás; mientras tanto el número se ve resaltado.
  - Decisión: se cambia la **velocidad** de los loops, como en un tocadiscos. Es exacta y sin artefactos, pero el tono sube o baja un poco; de ahí el rango corto. Se puede revertir.
  - Se guarda en las mezclas y en los links (`t=`). Los links viejos siguen funcionando, y las versiones viejas de la app ignoran el tempo.
  - El chip del pack ahora muestra solo el nombre, porque el tempo está en su propio control.
  - Probado en Boom Bap: de 90 a 100 BPM, los compases pasaron de 2,67 s a 2,40 s justo en el compás siguiente. El drop también dura un compás con el tempo nuevo.

- **2026-11-06 (PC1):** botón **"Drop"** en el escenario, junto a "Sorpréndeme". Solo funciona mientras suena el beat.
  - Desde el siguiente compás, durante un compás, solo suenan los personajes que tocan un bombo o un bajo, y luego vuelven todos.
  - El botón muestra el estado: "Drop en espera…", "¡Drop!" y "Drop".
  - Usa una ganancia propia por personaje programada con el Transport, así que no toca el mute, el solo ni el volumen. Al detener el beat se cancela.
  - Probado en Boom Bap: en espera en el compás 2, suena en el 3 y vuelve en el 4. Durante el drop solo brillan Kick y Bass.

- **2026-11-06 (PC1):** botón **"Sorpréndeme"** junto a las bases del escenario, con borde punteado para no confundirlo con una base elegida. Arma un beat al azar distinto del actual:
  - cada personaje toca un sonido de su propia sección;
  - kick, snare, hi-hat y bajo siempre suenan; la voz entra el 60 % de las veces y el FX el 50 %;
  - como máximo dos personajes tocan una variación (swing, ½, remate, corte o ×2).

  Lógica en `src/core/packs/surprise.ts`, con pruebas. Probado en Trap: el beat cambia en el siguiente compás y no hay errores en la consola.

- **2026-11-06 (PC1):** 144 loops nuevos, cuatro por personaje en los seis packs, así que cada sección pasa de 7 a 11 sonidos. Los genera `withFills` (`scripts/placeholders/recipes.ts`), también a partir de sonidos existentes:
  - **"+ remate"** (dos por sección): el último tiempo se reemplaza por los dos primeros tiempos del patrón al doble de velocidad, con la voz del mismo personaje y en la misma tonalidad.
  - **"con corte"**: el patrón se calla en la última mitad del compás 2.
  - **"×2"**: el loop entero al doble de velocidad, dos veces.
  - Donde la fuente por defecto sonaba igual o quedaba muda (sirena de Reggaetón, filtro de House, pad de DnB), se eligió otra fuente.
  - `generate-placeholders` ahora reescribe el manifest si cambian los ids o los nombres de los sonidos, sin necesidad de `--force`.
  - En la paleta, el nombre del sonido ocupa hasta dos líneas (antes se cortaba con "…", y "Clásico + remate" no se distinguía de "Clásico con corte").
  - La precarga de la PWA queda en 12 MB.

- **2026-11-06:** paleta sonora propia para Boom Bap, Drum & Bass y Afrobeat. Instrumentos nuevos: bombo polvoriento, caja de break, shekere y log drum.
  - **Boom Bap:** todo pasa por un "sampler viejo" (filtro y saturación). Tiene voces soul ("Yeah", "Coro soul", "Hook"), "Scratch baby", "Rewind" y "Tape stop".
  - **Drum & Bass:** caja de break con sala (también en "Amen"), ride metálico, MC, "Etéreo" a dos voces, "Talkbox", "Rewind" y "Sirena"; voces y FX en un hall.
  - **Afrobeat:** shekere, log drum de amapiano, coro "e-o", ad-lib, "Talking drum" y "Silbato" con trino.

- **2026-11-06:** paleta sonora propia para Trap, House y Reggaetón. Los ids no cambiaron, así que las mezclas, los links y las bases siguen funcionando.
  - **Instrumentos nuevos** (`scripts/placeholders/voices.ts`): voz con formantes que cambia de vocal, talkbox, hi-hat metálico 808, 808 con glide, bombo 909, clap grande, caja dembow, güiro, bocina, sirena, tape stop, rewind, barrido de filtro, silbato y talking drum.
  - **Color de mezcla por género** (`finish.ts`, aplicado al renderizar): saturación y sala en Trap, bombeo tipo sidechain y reverb en House, Reggaetón seco con la voz en sala.
  - Los reemplazos de cada género están en `palettes.ts` y se aplican con `overrideSounds`.
  - En `dsp.ts` se agregaron un biquad, una reverb Schroeder y `processLoop`, que procesa el loop sin cortes.

- **2026-11-06:** se dejaron los roles fijos: ahora cualquier personaje toca cualquier sonido del pack, un personaje por sonido.
  - **Motor:** los `Tone.Player` de cada canal se crean bajo demanda desde los buffers del pack, que se comparten entre canales.
  - **Store:** `setSound` mueve el sonido si otro personaje ya lo tenía.
  - **Tocar un sonido en la paleta:** `placeSound` (`core/packs/sounds.ts`) elige el personaje: su sección si está libre o toca algo de esa sección; si no, el primer libre.
  - **Arrastrar:** un sonido de la paleta se puede soltar en cualquier personaje, y uno ya asignado se puede arrastrar a otro para moverlo.
  - **Validación:** mezclas, links y bases se validan contra todo el pack y descartan repetidos.
  - **Aspecto:** cada personaje conserva el suyo y se pinta con el color de la sección del sonido.

- **2026-11-06:** 72 loops nuevos, dos por personaje en los seis packs, así que cada personaje pasa de 5 a 7 sonidos. Se derivan de los sonidos existentes con `withVariations` en `scripts/placeholders/recipes.ts`:
  - **"swing"** atrasa las semicorcheas y corcheas a contratiempo;
  - **"½"** estira la primera mitad del patrón al loop entero.

  Funciona porque `RenderContext.at` redefine dónde cae cada paso, y solo lo respetan `play` y `line`. Las fuentes que escriben directo al buffer se excluyen. Un test verifica que cada variación suena distinta de los demás sonidos de su personaje.

- **2026-11-06:** Trap pasó a los personajes streetwear SVG y se quitaron sus `.riv`. Ningún pack usa Rive (`RIVE_PACKS` vacío), así que no queda marca de agua y no se descarga el motor de Rive. `RiveCharacter` y `scripts/rive` se quedan por si se paga un plan.

- **2026-11-06:** animaciones al compás. Al entrar su sonido, el personaje da un salto con aplaste. Hace lo mismo cuando su sonido se cambia por otro y, cuando se queda en silencio, se hunde un poco. Se hace con la Web Animations API en el contenedor (`visuals/statusMotion.ts`, `features/stage/useStatusMotion.ts`), así que sirve para SVG y Rive. Además, el patrón del escenario late con cada tiempo (`features/stage/BeatPulse.tsx`). Todo se apaga con `prefers-reduced-motion`.

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
