# Formato de packs y samples

Esta guía es para grabar y reemplazar los sonidos de un pack. Si la sigues, el motor mantiene todo sincronizado sin tocar código.

## Estructura de un pack

```
public/packs/<packId>/
  manifest.json
  <characterId>/<soundId>.ogg     ← formato principal
  <characterId>/<soundId>.m4a     ← respaldo (Safari antiguo)
```

`manifest.json` se valida con Zod al cargar ([`src/core/packs/schema.ts`](../src/core/packs/schema.ts)). Si algo no cumple, la app muestra el error con la ruta exacta del campo.

```jsonc
{
  "id": "boom-bap-01", // kebab-case, único
  "name": "Boom Bap", // texto o { "es": "...", "en": "..." }
  "version": 1, // súbelo si cambias sonidos de forma incompatible
  "bpm": 90, // 40–240, en negras por minuto
  "timeSignature": [4, 4], // [tiempos por compás, figura: 2 | 4 | 8 | 16]
  "loopBars": 2, // compases que dura CADA loop
  "characters": [
    // exactamente 6
    {
      "id": "kick",
      "role": "kick", // kick | snare | hihat | bass | voice | fx
      "label": "Kick",
      "sounds": [
        {
          "id": "kick-1",
          "label": "Clásico",
          "file": "kick/kick-1.ogg",
          "fallback": "kick/kick-1.m4a",
        },
      ],
    },
  ],
}
```

Reglas del manifest:

- Los `id` de personaje y de sonido son **kebab-case** y los de sonido son **únicos en todo el pack** (un mix los referencia sin ambigüedad).
- `file` y `fallback` son rutas **relativas dentro del pack** (sin `..`, sin `/` inicial, sin URLs) con extensión `.ogg`, `.m4a`, `.mp3`, `.wav` o `.webm`.
- Entre 1 y 12 sonidos por personaje (el pack inicial usa 5).

## Reglas de los archivos de audio

| Regla     | Valor                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------- |
| Duración  | **Exactamente** `loopBars` compases al BPM del pack. Sin silencio de relleno al inicio ni al final. |
| Muestreo  | 44.1 kHz                                                                                            |
| Canales   | Mono o estéreo                                                                                      |
| Principal | `.ogg` (Vorbis, calidad ~5)                                                                         |
| Respaldo  | `.m4a` (AAC ~128 kbps)                                                                              |
| Loudness  | ≈ **−18 LUFS** integrado por loop, **true peak ≤ −1 dBTP**                                          |

### Duración exacta

`duración (s) = loopBars × tiemposPorCompás × (4 / figura) × 60 / bpm`

| Pack                  | Cálculo            | Duración   | Muestras a 44.1 kHz |
| --------------------- | ------------------ | ---------- | ------------------- |
| 90 BPM, 4/4, 2 comp.  | 2 × 4 × 1 × 60/90  | 5.333333 s | **235 200**         |
| 120 BPM, 4/4, 1 comp. | 1 × 4 × 1 × 60/120 | 2 s        | 88 200              |

El motor siempre fija el loop en esa duración (`loopEnd`), **no** en la del archivo. Si el archivo es más largo, lo que sobra nunca suena; si es más corto, habrá un hueco. Al cargar el pack, el motor avisa de cualquier sample que difiera más de 10 ms.

### Cómo grabar un loop que cierre bien

1. Graba a 90 BPM con metrónomo y un compás de entrada.
2. Recorta en el DAW **exactamente** en el inicio del compás 1 y el fin del compás 2 (usa el grid, no el oído).
3. Las colas (reverb, el final de una nota) que pasen del final se deben **sumar al inicio** del loop (en el DAW: "render with tail" + pegar la cola al principio). Así el loop cierra sin clic. Los placeholders lo hacen automáticamente.
4. Normaliza a ≈ −18 LUFS y limita el pico a −1 dBTP.
5. Exporta a WAV 44.1 kHz y convierte:

```bash
ffmpeg -i kick-1.wav -c:a libvorbis -q:a 5 kick-1.ogg
```

```bash
ffmpeg -i kick-1.wav -c:a aac -b:a 128k kick-1.m4a
```

### Por qué `.m4a` y no `.mp3` como respaldo

Los encoders MP3 agregan silencio al inicio del archivo (~25 ms) y la mayoría de los navegadores no lo recortan al decodificar. Eso adelanta o atrasa el loop y se escucha. El AAC dentro de `.m4a` guarda ese retraso en una _edit list_ que los navegadores sí respetan. Verificado en Chrome: el `.ogg` y el `.m4a` decodifican a exactamente 235 200 muestras. Safari queda pendiente de verificar en un dispositivo (ver [`QA.md`](QA.md)).

## Placeholders

`npm run generate:placeholders` sintetiza los 30 loops del pack `boom-bap-01` (necesita `ffmpeg` en el `PATH`; con `--wav` escribe `.wav` sin convertir).

- **No sobrescribe** archivos que ya existen, así que puedes reemplazar placeholders por grabaciones de a uno. Para regenerar todo: `npm run generate:placeholders -- --force`.
- El `manifest.json` solo se escribe si no existe (o con `--force`). Después de grabar los tuyos, edita el manifest a mano (etiquetas, cantidad de sonidos).
- Los placeholders son deterministas (ruido con semilla): regenerarlos produce archivos idénticos.
- Su nivel es aproximado: RMS ≈ −18 dBFS con pico máximo de −2 dBFS (hay margen para el sobrepico de los códecs).
