# Brief de diseño: rediseño visual de EzyBeatbox

Flujo: **explorar en Google Stitch → diseño final en Figma → implementación** (yo leo el Figma y lo paso a código).

El rediseño solo cambia lo visual: estilos (Tailwind) y `src/visuals/` (personajes, íconos, colores). El motor de audio, el drag & drop, los links, la exportación y la accesibilidad se mantienen.

---

## 0. Dirección elegida (2026-11-05)

Se exploraron las 3 direcciones de la sección 1 (Street 90s, Neón, Casual). **Se descartaron las 3**: cada una traía su propio estilo de personajes (neón pintado, bolitas con cara, figuras 3D), que no combina con los personajes ilustrados de hip hop y trap.

**Se eligió la pantalla "Inicio neutro" como base**: interfaz editorial clara, común a todas las temáticas. Solo el escenario cambia por temática. Proyecto de Stitch: "EzyBeatbox Web App"; design system "EzyBeatbox Editorial · Shell común".

### Interfaz común

| Token         | Valor                                                 |
| ------------- | ----------------------------------------------------- |
| `ui/bg`       | `#f5f3ee` (marfil)                                    |
| `ui/card`     | `#fbfaf7`                                             |
| `ui/text`     | `#202124`                                             |
| `ui/text-sub` | `#5f6368`                                             |
| `ui/border`   | `#e2ded5`                                             |
| `ui/accent`   | `#1a56db` (cobalto; hover `#1545b3`), también el foco |
| Tipografía    | Plus Jakarta Sans                                     |
| Radios        | tarjetas 16 px, botones 12 px, chips redondos         |

### Arte de personajes

Ilustración vectorial plana con contorno oscuro grueso, estilo novela gráfica indie. Personas de la cintura para arriba haciendo beatbox. **Nada** de 3D, neón pintado, robots, aliens ni emojis. Los personajes se terminan en **Rive** (contrato de inputs en la sección de Rive, cuando se agregue).

### Temáticas

| Token         | `hip-hop` (90 BPM)                                 | `trap` (140 BPM)                                      |
| ------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `stage/bg`    | `#e8a588` terracota + vinilos                      | `#2b303a` pizarra liso                                |
| `stage/panel` | `#f3e6d3` crema, contorno `#2a3550`                | `#1c1f24`, contorno `#3d4350`                         |
| `stage/ink`   | `#2a3550` (texto sobre escenario y tarjetas)       | `#ffffff`                                             |
| `stage/glow`  | `#fbf1e4` crema (anillos del beat)                 | `#a8f04a` lima                                        |
| `role/kick`   | `#e8702a` naranja · bomber + snapback              | `#7a2e63` ciruela · hoodie + cadenas                  |
| `role/snare`  | `#2a9a8f` verde azulado · windbreaker + bucket hat | `#b49be0` lavanda · puffer vest + gorra               |
| `role/hihat`  | `#f0b93a` mostaza · varsity + audífonos            | `#a8f04a` lima · techwear + beanie + lentes           |
| `role/bass`   | `#2a3550` azul marino · hoodie + durag             | `#5b3fa8` violeta · chaqueta acolchada + pasamontañas |
| `role/voice`  | `#b03a7a` magenta · chaleco utilitario + rastas    | `#cfd6e0` plata · windbreaker + trenzas               |
| `role/fx`     | `#5b8fb9` azul vinilo · track jacket + disco       | `#ff5fa2` rosa · chaqueta corta + lentes shield       |

Los colores se sacaron a ojo de las ilustraciones; se ajustan al pasar a Figma o Rive. Hip hop ya está en `public/packs/boom-bap-01/manifest.json` (campo `theme`); trap entra con su pack de prueba. El contorno de trap pasó de `#0f1114` a `#3d4350` porque el primero no se distinguía del panel.

Hojas de personajes en Stitch: "6 personajes hip hop" (la versión con etiquetas) y "6 personajes trap" (ignorar la copia repetida del de FX). Son la referencia para Rive.

---

## 1. Prompts para Stitch

Copia el bloque **Base** y agrega **una** de las direcciones de estilo. Genera las 3 para comparar.

### Base (siempre)

```
App web móvil-primero llamada "EzyBeatbox": un juego musical de beatbox donde armas un beat por capas.
Idioma de la interfaz: español.

Pantallas a diseñar (celular 375 px de ancho y escritorio 1280 px):

1. INICIO: logo "EzyBeatbox", frase "Arma tu beat, capa por capa.", botón grande "Toca para empezar",
   texto chico "Sube el volumen o ponte audífonos.". Variante de carga: barra de progreso
   "Cargando sonidos… 60 %".

2. ESCENARIO (pantalla principal):
   - Barra superior: logo, botón redondo de play/pausa, indicador de 4 tiempos (puntos) + "Compás 3",
     slider de volumen general, y 3 botones: "Mis mixes", "Compartir", "Exportar audio".
   - Centro: 6 personajes caricaturescos en fila (en celular, cuadrícula de 3×2). Cada uno representa
     un sonido de beatbox: Kick (bombo), Snare (caja), Hi-hat, Bass (bajo), Voice (voz), FX (efectos).
     Cada personaje tiene un color propio. Debajo de cada uno: su nombre, el estado
     ("En silencio", "En espera", "Cantando") y 3 botones chicos: M (mute), S (solo), ✕ (quitar).
   - Abajo: una barra-paleta con 30 íconos de sonido redondos agrupados por personaje
     (5 por personaje, con el color del personaje y una etiqueta corta: "Clásico", "Doble", "Rimshot"…).
     Los íconos se arrastran hacia los personajes.

3. Estados de un personaje: en silencio (gris, ojos cerrados), en espera (anillo punteado
   alrededor que pulsa), cantando (a color, boca abierta, brillo alrededor), silenciado (semitransparente).
   Estado al arrastrar: el personaje correcto muestra "Suelta aquí" resaltado y los demás se atenúan.

4. Diálogo "Mis mixes": campo "Nombre del mix", botón "Guardar mix actual", lista de mixes guardados
   con fecha y botones "Cargar" y "Eliminar".

5. Diálogo "Compartir mix": texto explicativo, campo con un link largo, botones "Copiar link"
   y "Compartir…".

6. Aviso flotante (toast): "Mix compartido cargado. Dale play para escucharlo." con botón ✕.

Requisitos: botones táctiles de al menos 44 px, buen contraste, foco visible para teclado,
todo cabe en la pantalla del celular sin scroll vertical en el escenario.
```

### Dirección A: "Street / hip hop 90s"

```
Estilo: cultura hip hop de los 90 y boom bap. Fondo oscuro tipo pared de ladrillo o concreto
sutil, acentos de graffiti y stickers, tipografía display gruesa y condensada, colores saturados
(naranja, magenta, amarillo, violeta, verde, cian) sobre negro. Personajes tipo mascotas de stickers
con contorno grueso.
```

### Dirección B: "Neón nocturno"

```
Estilo: club nocturno y sintetizadores. Fondo azul muy oscuro casi negro, brillos y glow de neón
en los colores de cada personaje, interfaz con vidrio esmerilado (glassmorphism) sutil, tipografía
geométrica redondeada. Personajes simples y redondos que "emiten luz" cuando cantan.
```

### Dirección C: "Juguete / casual colorido"

```
Estilo: juego casual amigable para todas las edades. Fondo claro o pastel, formas muy redondas,
sombras suaves, tipografía amigable y gruesa, colores alegres. Personajes tiernos tipo muñecos
de vinilo, expresivos, con proporciones de cabeza grande.
```

> Tip: si Stitch se va por un estilo genérico, pídele "más personalidad en los personajes" o "que el escenario se sienta como un show en vivo". Al elegir una dirección, exporta esa a Figma ("Copy to Figma").

---

## 2. Convenciones para el Figma final

Si sigues esto, puedo leer el archivo y convertirlo a código directamente.

### Páginas y frames

| Página       | Frames                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `Tokens`     | Colores, tipografías, radios, sombras (como **variables** y **estilos** de Figma)                     |
| `Personajes` | Un frame por personaje: `char/kick`, `char/snare`, `char/hihat`, `char/bass`, `char/voice`, `char/fx` |
| `Iconos`     | `icon/kick`, … (uno por rol) o `icon/kick-1` … `icon/fx-5` si cada sonido tiene el suyo               |
| `Pantallas`  | `mobile/inicio`, `mobile/escenario`, `mobile/mis-mixes`, `mobile/compartir`, `desktop/…`              |

### Personajes (lo más importante)

- **Mismo tamaño de frame para los 6** (por ejemplo 200 × 260), con el personaje apoyado en el borde de abajo.
- **Capas con nombre fijo**, que son las que voy a animar:

  ```
  char/kick
  ├── glow        (halo detrás; lo animo con el volumen)
  ├── body        (cuerpo; pulsa con el volumen)
  └── head        (cabeza; rebota en cada tiempo)
      ├── eyes-open
      ├── eyes-closed   (estado "en silencio")
      └── mouth         (elipse o forma simple; la abro con el volumen)
  ```

- **La boca como una forma simple y centrada** (por ejemplo, una elipse). Así puedo abrirla y cerrarla según el volumen. Si quieres una boca más dibujada, haz 3 versiones: `mouth-closed`, `mouth-mid` y `mouth-open`.
- **Estados como variantes** (component variants): `estado = silencio | espera | cantando | silenciado`.
- **Sin efectos que no exporten a SVG:** evita los blurs complejos y las imágenes de mapa de bits dentro del personaje. Las sombras simples sí sirven.
- **Color base del personaje como variable**, por ejemplo `char/kick/base`, para generar el estado gris o atenuado.

### Tokens

- **Colores como variables:** `bg/base`, `bg/surface`, `text/primary`, `text/muted`, `accent`, `danger` y uno por rol (`role/kick`…). Si quieres modo claro y oscuro, usa dos modos.
- **Tipografía:** si usas Google Fonts, dime cuáles. Se cargan sin costo.
- **Radios y espaciados** en múltiplos de 4.

### Para pasármelo

1. Comparte el archivo con permiso de lectura y pásame el link (o el link a un frame concreto).
2. Autoriza la integración de Figma una vez, con `/mcp` en una terminal de `claude`.

---

## 3. Temáticas por género (skins sobre un mismo rig)

EzyBeatbox va a tener varias temáticas (hip hop, trap, pop, latino…). Como en Incredibox, **los personajes cambian de estilo en cada una, pero la base es la misma**.

### Rig base + skins

- **Rig base (se diseña una vez):** los 6 personajes neutrales, con las capas fijas de la sección 2 (`glow`, `body`, `head`, `eyes-*`, `mouth`). Define la silueta, las proporciones y dónde va la boca.
- **Skin (una por temática):** encima del rig agrega ropa, accesorios (gorras, cadenas, sombreros), su paleta, el fondo del escenario y los íconos de la paleta de sonidos. **No cambia los nombres ni la estructura de las capas**, así la animación funciona igual en todas las temáticas.
- **La interfaz de la app es común:** barra superior, diálogos, botones y avisos son iguales en todas las temáticas. Solo se "viste" el escenario: personajes, fondo y paleta de sonidos.

### En Figma

| Página           | Contenido                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `Rig`            | `rig/kick` … `rig/fx`: los personajes neutrales (componentes principales)                           |
| `Tema · hip-hop` | `hip-hop/char/kick` …: instancias del rig con su skin; `hip-hop/fondo`; `hip-hop/iconos`            |
| `Tema · trap`    | Igual, con el prefijo `trap/`                                                                       |
| `Tokens`         | Variables con **un modo por temática** (`hip-hop`, `trap`, …): `role/*`, `stage/bg`, `stage/accent` |

El nombre de la temática debe coincidir con el `id` del pack (o con el campo `theme` que se agregará al manifest), en kebab-case.

### Qué cambia por temática

| Elemento                     | ¿Cambia? | Notas                                                                     |
| ---------------------------- | -------- | ------------------------------------------------------------------------- |
| Personajes (skin)            | Sí       | Sobre el mismo rig                                                        |
| Colores de cada rol          | Sí       | Modo de variables por temática                                            |
| Fondo del escenario          | Sí       | Imagen o SVG; los anillos de beat se dibujan encima                       |
| Íconos de sonido             | Sí       | Uno por rol o por sonido                                                  |
| Nombres de personajes        | Sí       | Vienen del manifest (por ejemplo, en bachata: "Güira" en vez de "Hi-hat") |
| Interfaz (botones, diálogos) | No       | Común a toda la app                                                       |

### Orden recomendado

1. **Hip hop boom bap** (90 BPM): la temática base, terminada de punta a punta (samples reales y arte final). Con ella se define el rig.
2. **Trap** (~140 BPM): mismos roles (808, hi-hats rápidos). Sirve para probar el sistema de skins con poco riesgo.
3. **Pop:** más melódico; la voz y los coros ganan protagonismo.
4. **Latino / cultural** (por ejemplo bachata, ~130 BPM, loops de 4 compases): los roles se reinterpretan (hi-hat → güira, snare → bongó, FX → requinto). Todo hecho con la boca, que es la identidad de EzyBeatbox.

### Prompt extra para Stitch (por temática)

Agrégalo al bloque **Base** de la sección 1, cambiando el género:

```
Diseña la temática "Trap" de EzyBeatbox. Los 6 personajes mantienen la misma silueta y proporciones
que la versión hip hop, pero con ropa, accesorios y colores propios del trap (por ejemplo cadenas,
capuchas, gafas oscuras; morados y rojos profundos, brillos fríos). El fondo del escenario cambia a
una ambientación de trap. La barra superior, los botones y los diálogos de la app NO cambian.
```

### Lo que se agregará en código (al implementar el rediseño)

- Campo `theme` en el manifest del pack: skin de personajes, colores por rol y fondo.
- Pantalla para elegir pack o temática antes de "Toca para empezar".
- Cambiar de pack sin recargar la página.
- Cargar el arte de cada temática solo cuando se usa, para que la app no crezca con cada pack nuevo.

---

## 4. Qué no hace falta diseñar

Ya funcionan y se adaptan solos al nuevo estilo: la lógica de arrastre, la cuantización al compás, los textos (vienen de i18n), el foco del teclado y el modo de movimiento reducido. Si un diseño necesita un texto nuevo, se agrega a `src/i18n/locales/es/common.json`.
