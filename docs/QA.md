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
- [ ] Dejar sonando 5+ minutos con los 6 personajes: sin desfase acumulado.
- [ ] Sin clics en el punto donde el loop vuelve a empezar (escuchar con audífonos, en especial Voice "Coro", Bass "Sub" y FX "Vinilo").

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
- [ ] Sin red (o renombrando un `.ogg`): aparece el error con detalles y "Reintentar" funciona al restaurarlo.
- [ ] **Touch real:** arrastrar un sonido hacia arriba hasta su personaje lo asigna. Deslizar en horizontal sobre la paleta hace scroll y **no** arrastra.
- [ ] Mientras arrastras: el personaje correcto muestra "Suelta aquí" y los demás se atenúan. Soltar en otro personaje o en el vacío no hace nada.
- [ ] Tocar un sonido sin arrastrar lo asigna (lo mismo que hace un clic).
- [ ] Arrastrar desde un personaje que suena hasta fuera de él: "Se calla en el próximo compás" y luego "En silencio". Soltarlo sobre el mismo personaje no lo quita.
- [ ] El botón ✕ quita el sonido. M y S funcionan y muestran su estado.
- [ ] **Teclado:** Tab recorre la paleta y los controles con foco visible, y Enter/Espacio sobre un sonido lo asigna.
- [ ] Lector de pantalla: cada personaje anuncia nombre, sonido y estado ("Kick: Doble, En espera").
- [ ] Con "reducir movimiento" activado en el sistema, el anillo de "en espera" no pulsa.
- [ ] El indicador de compás/tiempo avanza en sincronía con lo que suena.
- [ ] Bloquear y desbloquear el celular con el audio sonando: aparece "Toca para reanudar" y funciona.
- [ ] En el celular, la escena entra en pantalla sin scroll vertical (probar 375×667 y 390×844).

## Visual reactivo (Fase 3)

- [ ] Cada personaje mueve la boca con **su propio** sonido (mutear uno lo deja con la boca quieta).
- [ ] El rebote de la cabeza cae en cada tiempo, al mismo tiempo que el golpe que se escucha (no antes).
- [ ] Con **Bluetooth**: los visuales siguen alineados con lo que se escucha (en Chrome/Android; Safari no informa la latencia).
- [ ] Los anillos del fondo salen en cada tiempo, más fuertes en el tiempo 1. El brillo crece con el volumen general.
- [ ] Los personajes en silencio "respiran" suavemente.
- [ ] Con "reducir movimiento": nada rebota ni respira y no hay anillos, pero la boca y el brillo siguen el nivel.
- [ ] **Rendimiento en un celular de gama media:** Chrome DevTools remoto → Performance, 10 s con los 6 sonando. Objetivo: ~60 fps y ningún frame largo.
- [ ] La pestaña en segundo plano no consume CPU por animación (rAF pausado).

## Resultados registrados

| Fecha      | Fase | Navegador / dispositivo                                         | Resultado                                                                                                                                                                                                                                 |
| ---------- | ---- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-03 | 1    | Chrome (panel de Claude), Windows                               | Pack carga sin avisos; entradas cuantizadas al compás; mute OK; `.ogg` y `.m4a` decodifican a 235 200 muestras exactas. Sin escucha (prueba automatizada).                                                                                |
| 2026-11-04 | 2    | Chrome (panel de Claude), escritorio y emulación 375×812        | Arrastre real paleta → personaje OK; soltar en otro personaje se ignora; tap asigna; arrastrar fuera quita; play/pausa e indicador OK; foco visible; sin errores en consola. El touch real no se probó (el panel envía eventos de mouse). |
| 2026-11-04 | 3    | Chrome (panel de Claude), escritorio Windows, pantalla de 75 Hz | 6 personajes + fondo: 75 fps estables, p99 13,5 ms, peor frame 13,6 ms, 0 frames > 20 ms. Las bocas siguen el nivel de su canal. Falta probar en un celular real.                                                                         |
