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

## Resultados registrados

| Fecha      | Fase | Navegador / dispositivo           | Resultado                                                                                                                                                  |
| ---------- | ---- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-03 | 1    | Chrome (panel de Claude), Windows | Pack carga sin avisos; entradas cuantizadas al compás; mute OK; `.ogg` y `.m4a` decodifican a 235 200 muestras exactas. Sin escucha (prueba automatizada). |
