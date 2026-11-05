# Brief de diseño: rediseño visual de EzyBeatbox

Flujo: **explorar en Google Stitch → diseño final en Figma → implementación** (yo leo el Figma y lo paso a código).

El rediseño solo cambia lo visual: estilos (Tailwind) y `src/visuals/` (personajes, íconos, colores). El motor de audio, el drag & drop, los links, la exportación y la accesibilidad se mantienen.

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

## 3. Qué no hace falta diseñar

Ya funcionan y se adaptan solos al nuevo estilo: la lógica de arrastre, la cuantización al compás, los textos (vienen de i18n), el foco del teclado y el modo de movimiento reducido. Si un diseño necesita un texto nuevo, se agrega a `src/i18n/locales/es/common.json`.
