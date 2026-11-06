# Portada neutra: propuesta de Stitch

Creada el 2026-11-04 en la PC1 y aprobada por Daniel. **Es una referencia de diseño:** en la rama `feat/editorial-themes` la portada es el selector de packs (`src/features/start/PackPicker.tsx`). La implementación React de esta propuesta quedó solo en la rama local de respaldo `respaldo/portada-neutra-pc1`.

Proyecto Stitch: https://stitch.withgoogle.com/projects/180828266242422441

| Pantalla de Stitch                            | ID                                 |
| --------------------------------------------- | ---------------------------------- |
| Escritorio: "Inicio neutro · Elige tu sonido" | `fd93b97523c248ca92c977a9589c3663` |
| Móvil: "Inicio neutro · Móvil"                | `3e7104e2b7834db9a67fd66c7e33a2b3` |
| Arte de la tarjeta Hip hop                    | `cba89ee3ab3e44cca42d1fbab0829239` |
| Arte de la tarjeta Trap                       | `46f7b75d5e484b37856cee31f23fc8df` |

**Dirección:** fondo marfil, texto en tinta oscura, acentos cobalto, tarjetas blancas y personajes humanos de beatbox. Hip hop / Boom bap (90 BPM) y Trap (140 BPM) son las dos opciones. El género define solo el arte de cada tarjeta; la portada es neutra.

## Archivos

- `desktop.html` y `mobile.html`: exportaciones originales de Stitch (con imágenes, fuentes y Tailwind desde CDN). Son referencias visuales, no código de producción. La exportación móvil es una columna vertical dentro de un lienzo grande. Si se reutiliza, revisar: el header a 375 px, áreas táctiles de 44 px, foco visible, movimiento reducido y la capitalización del logo.
- `images/hip-hop.webp` y `images/trap.webp`: ilustraciones de las tarjetas usadas en esa portada. No están en `public/`: la rama usa su propio `cover.jpg` por pack.

Las ideas de interacción de esta portada que la rama todavía no tiene están anotadas en `docs/PENDIENTES.md`.
