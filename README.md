# EzyBeatbox

App web de música/beatbox: 6 personajes que "cantan" loops sincronizados al compás. Arrastras un sonido sobre un personaje y armas un beat por capas. Más adelante tendrá una _loop station_ y reconocimiento de beatbox.

> Estado: **Fase 4 — guardar, compartir y exportar.** Plan de fases en [`CLAUDE.md`](CLAUDE.md), arquitectura en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), formato de samples en [`docs/SAMPLES.md`](docs/SAMPLES.md) y pruebas manuales en [`docs/QA.md`](docs/QA.md).
>
> **Banco de pruebas del motor:** con `npm run dev`, abre `/harness.html`.

## Requisitos

- Node.js ≥ 22 (recomendado 24, ver `.nvmrc`)
- npm ≥ 10
- [ffmpeg](https://ffmpeg.org/) en el `PATH` (solo para `generate:placeholders`, Fase 1)

## Empezar

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (por defecto http://localhost:5173). Para probar en el celular dentro de la misma red: `npm run dev -- --host`.

## Scripts

| Script                          | Qué hace                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run dev`                   | Servidor de desarrollo con HMR                                                                    |
| `npm run build`                 | Typecheck (`tsc -b`) + build de producción en `dist/`                                             |
| `npm run preview`               | Sirve el build de producción                                                                      |
| `npm test`                      | Pruebas (Vitest + Testing Library), una vez                                                       |
| `npm run test:watch`            | Pruebas en modo watch                                                                             |
| `npm run lint`                  | ESLint, sin warnings permitidos                                                                   |
| `npm run typecheck`             | Solo verificación de tipos                                                                        |
| `npm run format`                | Formatea con Prettier                                                                             |
| `npm run generate:placeholders` | Genera los samples placeholder del pack `boom-bap-01` (`--force` sobrescribe, `--wav` sin ffmpeg) |

## Stack

Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · Tone.js · Zustand · Zod · react-i18next · Vitest · ESLint + Prettier.

## Contenidos

Todo el audio y arte del repo es original (generado por código o creado por el autor). No se aceptan samples ni imágenes con derechos de terceros.
