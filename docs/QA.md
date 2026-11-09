# Pruebas manuales (QA)

El audio real no se puede validar con pruebas unitarias. Esta lista se recorre antes de cerrar cada fase que toque audio. Marca cada prueba con el navegador y el dispositivo en los que la hiciste.

## Banco de pruebas del motor (Fase 1)

`npm run dev` y abre `/harness.html` (por ejemplo http://localhost:5173/harness.html). En el celular: `npm run dev -- --host` y abre la IP que imprime Vite.

### Sincronía

- [ ] Con 2–3 sonidos elegidos **antes** de reproducir, todos entran juntos en el compás 1.
- [ ] Elegir un sonido a mitad de compás: queda en `queued` y entra **exactamente** en el siguiente compás, alineado con los demás.
- [ ] Reemplazar un sonido que suena (ej. Kick Clásico → Pesado): el cambio ocurre en el siguiente compás, sin hueco ni doble golpe.
- [ ] "Quitar": el sonido sigue hasta el final del compás y luego se calla (`stopping` → `empty`).
- [ ] Soltar un loop de 2 compases en un compás **par** (2, 4…): debe entrar en su segunda mitad, alineado con los demás (no empezar desde su compás 1).
- [ ] "Aleatorio" varias veces seguidas: los 6 cambian a la vez en el siguiente compás.
- [x] Reproducción prolongada en Trap: seis capas durante 5 min 40 s hasta el compás 198. Daniel confirmó que se escuchó bien todo el rato con audífonos de cable, sin desfase perceptible.
- [x] Escucha de loops con audífonos de cable: Daniel confirmó que se escuchan bien.

### Mezcla

- [ ] Mute (M) calla al personaje al instante y su medidor baja a cero.
- [ ] Solo (S) en uno calla a los demás; solo en dos deja sonar a ambos.
- [ ] Volumen por personaje y master sin saltos ni ruido al mover el slider.
- [ ] Los 6 al máximo con el master en +6 dB: el limitador evita la distorsión digital.

### Ciclo de vida y navegador

- [ ] Detener y volver a reproducir: los sonidos elegidos vuelven a entrar en el compás 1.
- [ ] **Cambio de pestaña** 30 s y volver: la reproducción siguió y sigue en sincronía.
- [ ] Minimizar la ventana o bloquear la pantalla del celular y volver: el audio se recupera (o el `AudioContext` muestra `suspended`/`interrupted` sin romperse).
- [ ] Recargar la página a mitad de reproducción: sin errores en la consola.

### Plataformas

| Prueba                                                        | Chrome escritorio | Firefox | Safari macOS | Safari iOS | Chrome Android |
| ------------------------------------------------------------- | ----------------- | ------- | ------------ | ---------- | -------------- |
| El pack carga (sin avisos de duración)                        |                   |         |              |            |                |
| Desbloqueo de audio con un toque                              |                   |         |              |            |                |
| Se usa el formato esperado (`.ogg`, o `.m4a` en Safari viejo) |                   |         |              |            |                |
| Sincronía (lista de arriba)                                   |                   |         |              |            |                |
| iOS con el switch de silencio activado                        | n/a               | n/a     | n/a          |            | n/a            |

### Salida de audio

- [ ] Audífonos con cable: sin latencia perceptible entre tocar y la respuesta visual.
- [ ] Bluetooth: la latencia es mayor (esperado). Anotar si visual y audio se ven desfasados; se compensa en la Fase 3.
- [ ] Parlantes del celular: el bajo de los placeholders se sigue percibiendo.

## Escena y drag & drop (Fase 2)

`npm run dev` y abre la raíz (`/`). En el celular: `npm run dev -- --host`.

- [ ] "Toca para empezar" desbloquea el audio y muestra el progreso de carga.
- [x] Un archivo de audio falla y «Detalles técnicos» muestra su ruta. Al restaurarlo, «Reintentar» abre el género. Si el fallo persiste al abrir un mix compartido, «Cambiar estilo» vuelve al selector y permite reproducir otro género. Verificado en Chromium con un HTTP 503 simulado para el bombo de Trap.
- [ ] **Touch real:** arrastrar un sonido hacia arriba hasta su personaje lo asigna. Deslizar en horizontal sobre la paleta hace scroll y **no** arrastra.
- [ ] Mientras arrastras: el personaje correcto muestra "Suelta aquí" y los demás se atenúan. Soltar en otro personaje o en el vacío no hace nada.
- [ ] Tocar un sonido sin arrastrar lo asigna (lo mismo que hace un clic).
- [ ] Arrastrar desde un personaje que suena hasta fuera de él: "Se calla en el próximo compás" y luego "En silencio". Soltarlo sobre el mismo personaje no lo quita.
- [ ] El botón ✕ quita el sonido. M y S funcionan y muestran su estado.
- [ ] **Teclado:** Tab recorre la paleta y los controles con foco visible, y Enter/Espacio sobre un sonido lo asigna.
- [ ] Lector de pantalla: cada personaje anuncia nombre, sonido y estado ("Kick: Doble, En espera").
- [x] Con «Reducir movimiento» activo, el anillo de «En espera» permanece estático. Verificado en Chromium con la preferencia emulada.
- [ ] El indicador de compás/tiempo avanza en sincronía con lo que suena.
- [ ] Bloquear y desbloquear el celular con el audio sonando: aparece "Toca para reanudar" y funciona.
- [ ] En el celular, la escena entra en pantalla sin scroll vertical (probar 375×667 y 390×844).

## Visual reactivo (Fase 3)

- [ ] Cada personaje mueve la boca con **su propio** sonido (mutear uno lo deja con la boca quieta).
- [ ] El rebote de la cabeza cae en cada tiempo, al mismo tiempo que el golpe que se escucha (no antes).
- [ ] Con **Bluetooth**: los visuales siguen alineados con lo que se escucha (en Chrome/Android; Safari no informa la latencia).
- [ ] Los anillos del fondo salen en cada tiempo, más fuertes en el tiempo 1. El brillo crece con el volumen general.
- [ ] Los personajes en silencio "respiran" suavemente.
- [x] Con «Reducir movimiento» activo, el cuerpo y la cabeza quedan quietos, los ojos no parpadean y desaparecen los anillos del fondo. La boca y el brillo siguen el nivel. Verificado en Chromium al activar y desactivar la preferencia mientras sonaba Boom Bap.
- [ ] **Rendimiento en un celular de gama media:** Chrome DevTools remoto → Performance, 10 s con los 6 sonando. Objetivo: ~60 fps y ningún frame largo.
- [x] Al cambiar a otra pestaña en Chromium, el escenario dejó de dibujar cuadros durante 2,1 s con las seis capas de Boom Bap sonando. El reloj de audio siguió avanzando y el dibujo se reanudó al volver.

## Guardar, compartir y exportar (Fase 4)

- [x] Mis mixes en Trap: guardé seis capas, quité FX del escenario y cargué el mix guardado. Las seis capas se restauraron, incluido Riser. También cargué ese mix desde Boom Bap: la app cambió a Trap y restauró los seis sonidos.

- [x] **Link en otro navegador** (2026-11-08). Un mix de Trap creado en Chrome se abrió en un perfil nuevo de Edge. Volver a compartirlo reprodujo el mismo link con seis sonidos, caja silenciada, bombo y bajo en Solo, volumen general de −7 dB y tempo de 146 BPM. Las dos exportaciones WebM/Opus duraron 6,54 s frente a los 6,58 s teóricos. Tras alinearlas, la correlación de las señales decodificadas fue de 0,9991.
- [x] Al abrir el link en Edge apareció «Vas a escuchar un mix que te compartieron». Después de cargar, la app quitó el fragmento `#…` de la barra de direcciones.
- [x] Pegar un link en una pestaña con el mismo pack sonando aplica los cambios de sonido en el siguiente compás. Verificado en Chromium con Boom Bap. También se retuvo la solicitud del manifest de Trap y se pegó un link de House. La app abrió House y solo llegó a solicitar el manifest de Trap.
- [x] Un enlace roto muestra «El enlace del mix no es válido» al entrar. En Chromium se comprobó que el selector sigue disponible y que, con un beat sonando, el aviso aparece sin interrumpirlo.
- [x] Un enlace con `v=9` muestra el aviso de versión más nueva antes de elegir un género. En Chromium se comprobó que luego se puede abrir Boom Bap con el escenario vacío.
- [ ] En el celular aparece "Compartir…" (menú nativo) y funciona.
- [ ] **Mis mixes:** guardar, recargar la página, cargar → mismo mix. Eliminar pide confirmación ("¿Seguro?").
- [x] Almacenamiento bloqueado simulado en Chromium. Al bloquear la escritura, «Mis mixes» muestra el aviso dentro del diálogo y conserva el nombre y el beat. Al desbloquearla, se puede reintentar. Con la lectura bloqueada, Inicio sigue disponible y muestra el aviso al intentar abrir la biblioteca.
- [x] Un mix válido con una fecha dañada sigue disponible para cargar. La biblioteca omite esa fecha. Verificado en Chromium después de recargar.
- [ ] **Exportar audio:** el archivo dura ~10,7 s (2 loops a 90 BPM), empieza en el compás 1 del loop y suena igual que la app (incluyendo mute/solo y volumen general).
- [x] Trap con seis capas en el navegador integrado: la app completó la grabación de cuatro compases y mostró «Audio exportado». La duración y la señal de las exportaciones de Trap se comprobaron después en Chrome y Edge, con Solo activo.
- [x] **Exportar con Solo activo** (2026-11-08). La grabación de Trap con seis sonidos cargados y Solo en bombo y bajo coincide con la referencia que solo tenía esas dos capas cargadas. La correlación tras alinear las grabaciones fue de 0,9992.
- [x] Pausar durante la exportación en Trap: la app mostró el aviso de cancelación y habilitó de nuevo el botón. La prueba automatizada confirma que la cancelación no devuelve audio.
- [ ] Safari: la exportación descarga `.m4a`/MP4 y se reproduce. Si Safari no soporta MediaRecorder, aparece el aviso de "no permite grabar".
- [x] Los diálogos se abren con Enter, conservan el foco al recorrerlos con Tab o Mayús+Tab y devuelven el foco al botón de apertura al cerrarlos con Escape. Verificado en Chromium con «Compartir», «Mis mixes» en el escenario y la biblioteca vacía de Inicio. Al borrar el mix enfocado, el foco regresó al campo de nombre.

## PWA

Con `npm run build` y luego `npm run preview` (el service worker no existe en `dev`). Para el celular: `npm run preview -- --host`. Ojo: fuera de `localhost`, el service worker necesita HTTPS, así que en el celular pruébalo con el deploy o con un túnel HTTPS.

- [ ] Chrome escritorio: aparece el ícono de "Instalar" en la barra de direcciones; la app instalada abre en ventana propia con el ícono correcto.
- [ ] Android: "Agregar a la pantalla de inicio" muestra el ícono adaptable (maskable) sin recortes raros.
- [ ] iOS: "Compartir → Agregar a inicio" usa el apple-touch-icon y abre a pantalla completa.
- [x] Primera visita en Chromium de escritorio con un perfil limpio: aparece «EzyBeatbox ya funciona sin conexión» y se cierra solo.
- [x] Con el servidor local apagado, Chromium de escritorio volvió a abrir la app desde la caché. El selector mostró las seis portadas. Cada género decodificó sus 66 archivos `.ogg`, inició la reproducción de una base y avanzó al segundo tiempo del compás.
- [ ] **Offline:** modo avión, abrir la app instalada → "Toca para empezar" → el pack carga y suena.
- [ ] **Actualización:** con la app abierta, publicar un build nuevo y recargar → "Hay una versión nueva…". "Después" la cierra; "Actualizar" recarga con la nueva versión.
- [ ] **iOS, switch de silencio activado:** la música se escucha (Safari 17+).

## Resultados registrados

| Fecha      | Fase | Navegador / dispositivo                                         | Resultado                                                                                                                                                                                                                                                                                                              |
| ---------- | ---- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-03 | 1    | Chrome (panel de Claude), Windows                               | Pack carga sin avisos; entradas cuantizadas al compás; mute OK; `.ogg` y `.m4a` decodifican a 235 200 muestras exactas. Sin escucha (prueba automatizada).                                                                                                                                                             |
| 2026-11-04 | 2    | Chrome (panel de Claude), escritorio y emulación 375×812        | Arrastre real paleta → personaje OK; soltar en otro personaje se ignora; tap asigna; arrastrar fuera quita; play/pausa e indicador OK; foco visible; sin errores en consola. El touch real no se probó (el panel envía eventos de mouse).                                                                              |
| 2026-11-04 | 3    | Chrome (panel de Claude), escritorio Windows, pantalla de 75 Hz | 6 personajes + fondo: 75 fps estables, p99 13,5 ms, peor frame 13,6 ms, 0 frames > 20 ms. Las bocas siguen el nivel de su canal. Falta probar en un celular real.                                                                                                                                                      |
| 2026-11-04 | 4    | Chrome (panel de Claude), escritorio, dos pestañas              | El link reconstruyó el mix exacto (3 sonidos, mute, solo) en una pestaña nueva. Exportación: `.webm` de 10,62 s (esperado 10,67 s), con audio. Encontrados y corregidos: **el solo silenciaba todo** (master como `Tone.Channel`) y **un canal en mute rompía el link** (`-Infinity`). Mis mixes: guardar y listar OK. |
| 2026-11-04 | PWA  | Chrome (panel de Claude), build + `vite preview`                | SW activo; manifest con 4 íconos; precache con la app, el manifest del pack y los 30 `.ogg`. **Con el servidor detenido:** la app cargó, el pack se decodificó desde el caché y Kick sonó (boca hasta 7,5). Aviso de actualización probado solo en tests (requiere un segundo deploy).                                 |

## Selector de packs y temáticas (2026-11-05)

- [x] En Chromium de escritorio, la portada muestra los seis géneros con su ilustración. La prueba sin conexión también cargó las seis portadas.
- [ ] En un celular real, las tarjetas muestran su ilustración, BPM y descripción, y se apilan.
- [ ] Tocar una tarjeta (o su botón "Explorar…") desbloquea el audio y abre ese pack. En iOS, comprobar que suena después de ese primer toque.
- [ ] El chip del pack vuelve al selector, con «Estilo actual» en el pack cargado. El beat sigue sonando al volver a Inicio y se detiene al cargar otro género.
- [ ] "Volver al escenario" conserva el mix; elegir el otro pack lo abre con el escenario vacío.
- [ ] Trap: el escenario es gris pizarra con anillos lima, y los sonidos van a 140 BPM sin desfase con el compás.
- [ ] Abrir un link compartido de Trap con la app en Boom Bap: cambia de pack solo y suena el mix.
- [x] Cargar desde "Mis mixes" un mix guardado en el otro pack: Boom Bap cambió a Trap y restauró las seis capas.
- [ ] Modo avión en un celular después de haber abierto la app una vez: el selector muestra las seis portadas y se puede reproducir una base de cada género.
