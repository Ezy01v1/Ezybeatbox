import type { CharacterRole } from '@/core/packs/schema'
import { INK, SKINS, type RolePalette } from './art'

type CastRole = Exclude<CharacterRole, 'kick'>

const outline = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`
const charcoal = '#282630'
const seam = '#4c4854'
const metal = '#e0d7d8'
const cream = '#f3e5c8'

export const BOOM_BAP_EYES = `
  <path d="M42 40q5-5 13 0-3 6-8 5-3-1-5-5Zm23 0q8-5 13 0-2 4-5 5-5 1-8-5Z"
    fill="#fff3df" stroke="#432a2c" stroke-width="1.15"/>
  <path d="M49 39v4m22-4v4" fill="none" stroke="${INK}" stroke-width="3.7"/>
  <path d="M48.6 40h.2m22 0h.2" fill="none" stroke="#fff3df" stroke-width="1.2"/>`

const brows: Record<CastRole, string> = {
  snare: 'M42 35q5-4 12-1m12 0q7-3 12 1',
  hihat: 'M43 35q5-3 11-1m12 0q6-2 11 1',
  bass: 'm42 35 12-2m12 0 12 2',
  voice: 'M42 35q5-5 12-1m12 0q7-4 12 1',
  fx: 'm42 34 12 1m12 0 12-1',
}

export function boomBapBrows(role: CastRole): string {
  return `<path d="${brows[role]}" fill="none" stroke="${SKINS[role].hair}" stroke-width="2.3"/>`
}

export const boomBapPatchTransform: Record<CastRole, string> = {
  snare: 'translate(74 95) rotate(6) scale(.61)',
  hihat: 'translate(43 94) rotate(-7) scale(.63)',
  bass: 'translate(79 103) rotate(7) scale(.67)',
  voice: 'translate(74 98) rotate(7) scale(.67)',
  fx: 'translate(75 103) rotate(5) scale(.62)',
}

function hairstyle(role: CastRole, c: RolePalette, hair: string): string {
  switch (role) {
    case 'snare':
      return `
        <path d="M34 51 31 37l-7 5 1-12-7 3 9-13-7-2 12-4-3-5 16 1 9-6 15 4 9 6 8 2 4 11-5 17-5-15-8-6-9 3-8 8 1-7-12 14 2-9-9 15Z" fill="${hair}"/>
        <path d="m26 29 14-13 14-3m-18 16 15-11 12-2m10 0 8 7m-2 2 5 4" fill="none" stroke="${seam}" stroke-width="1.6"/>
        <path d="M32 49q-4 5 1 8 4 1 5-3m50-5q4 5-1 8-4 1-5-3" fill="none" stroke="${metal}" stroke-width="1.8"/>`
    case 'hihat':
      return `
        <path d="M30 37q0-18 15-18l6 6 9-7 8 7 8-5q14 3 13 19l-6 8-4-12-6-6-6 5-7-5-6 4-5-4-8 8-5 11Z" fill="${hair}"/>
        <path d="M33 23 38 9q19-12 43-3l7 17-11 5H44Z" fill="${c.accent}"/>
        <path d="M34 22q23-9 52-1l2 5q-30-7-56 2Z" fill="${c.dark}" stroke="none"/>
        <path d="M33 22q27-8 55 0l10 16-11 4-9-9q-19-9-38 1l-8 8-10-4Z" fill="${c.accent}"/>
        <path d="M27 36q31-20 65 0M42 11q13-6 28-4" fill="none" stroke="${c.soft}" stroke-width="1.4" stroke-dasharray="2 2"/>
        <path d="M33 50q-4 5 1 8 4 1 5-3m48-5q4 5-1 8-4 1-5-3" fill="none" stroke="${metal}" stroke-width="1.7"/>`
    case 'bass':
      return `
        <path d="M35 38 32 24C33 10 45 3 59 3s27 7 29 21l-3 15-9-10H44Z" fill="${c.accent}"/>
        <path d="M37 25q23-10 48 0l1 10q-25-8-52 0Z" fill="${c.dark}"/>
        <path d="m43 14-2 8m8-13-2 11m9-13-1 10m9-10 1 10m8-8 2 10m7-5 1 7M41 26l-1 5m9-7-1 5m9-6v5m8-5v5m8-4 1 5m7-3 1 5" fill="none" stroke="${c.deeper}" stroke-width="1.25"/>
        <path d="M35 52q4 9 13 12l4-2 3 5 5-3 5 3 3-5 4 2q9-3 13-12l-2 11q-5 9-23 12-18-3-23-12Z" fill="${hair}"/>
        <path d="M44 66q6 5 12 5m8 0q6 0 12-5" fill="none" stroke="${seam}" stroke-width="1.35"/>`
    case 'voice':
      return `
        <path d="M39 29c-7 2-9 11-12 14l1-8c-4 2-7 0-8-2-6 0-9-3-8-8-4-2-3-8 1-9-2-5 3-9 7-7 1-5 7-6 10-3 3-2 8-1 9 4 5 0 8 3 7 8Zm42 0c7 2 9 11 12 14l-1-8c4 2 7 0 8-2 6 0 9-3 8-8 4-2 3-8-1-9 2-5-3-9-7-7-1-5-7-6-10-3-3-2-8-1-9 4-5 0-8 3-7 8Z" fill="${hair}"/>
        <path d="M34 44q-6-9 0-18-2-7 6-9 2-7 10-6 4-6 10-3 6-3 10 3 8-1 10 6 8 2 6 9 6 9 0 18l-6-11-5 2-5-9-6 1-4-6-4 6-6-1-5 9-5-2Z" fill="${hair}"/>
        <path d="M19 17q-6 5 0 10m5-16q7 0 6 5m3 5q-7 0-6 7m74-11q6 5 0 10m-5-16q-7 0-6 5m-3 5q7 0 6 7M42 22q-6 3-4 8m11-13q-3 2-4 6m33-1q6 3 4 8m-11-13q3 2 4 6" fill="none" stroke="#694748" stroke-width="1.4"/>
        <path d="M34 39q-4 9 0 13m52-13q4 9 0 13" fill="none" stroke="${hair}" stroke-width="2.5"/>
        <circle cx="34" cy="54" r="2.4" fill="#f4cf82" stroke-width="1"/>
        <circle cx="86" cy="54" r="2.4" fill="#f4cf82" stroke-width="1"/>`
    case 'fx':
      return `
        <path d="M33 48 28 36l-7 2 3-11-7-2 13-9-5-6 15 1L51 3l13 6 9-5 10 6 6 11-3 22-5-8-4-14-12 8 2-9-11 12-7 2-7 11-2-8Z" fill="${hair}"/>
        <path d="M30 38q0-11 11-18l18-9q-5 8-12 13l-4 12-8 10 1-9Z" fill="${c.accent}" stroke-width="1.25"/>
        <path d="M33 34q4-10 15-16m17-4 9-5 8 8" fill="none" stroke="${c.soft}" stroke-width="1.3"/>
        <path d="m84 39 5 2m-5 2 5 2m-5 2 4 2" fill="none" stroke="${metal}" stroke-width="1.35"/>`
  }
}

export function boomBapHead(role: CastRole, c: RolePalette, expression: string): string {
  const { skin, shadow, hair } = SKINS[role]
  return `<g ${outline}>
    <path d="M37 39c-10-5-12 9-5 15l7 2m44-17c10-5 12 9 5 15l-7 2" fill="${skin}"/>
    <path d="m31 45 5 4m53-4-5 4" fill="none" stroke="${shadow}" stroke-width="1.5"/>
    <path d="M35 35c1-15 11-22 25-22s24 7 25 22l-2 22q-3 14-23 18-20-4-23-18Z" fill="${skin}"/>
    <path d="M36 38q4-10 8-11l-3 16 2 17q3 6 13 12-15-4-19-15Zm45-8 4 7-2 20q-2 8-10 12l5-10Z" fill="${shadow}" stroke="none"/>
    <path d="M56 50q4-4 8 0l1 3q-5 3-10 0Z" fill="${shadow}" stroke="none"/>
    ${hairstyle(role, c, hair)}
    ${expression}
  </g>`
}

function outfit(role: CastRole, c: RolePalette): string {
  switch (role) {
    case 'snare':
      return `
        <path d="M40 77q-14 2-18 13l-7 31 15 4 9-25m41-23q14 2 18 13l7 31-15 4-9-25" fill="${charcoal}"/>
        <path d="m23 94 5 11-8-4 5 10-7 6m79-23-5 11 8-4-5 10 7 6" fill="none" stroke="${seam}" stroke-width="1.65"/>
        <path d="M43 77l8-3 9 9 9-9 8 3 7 60-24 3-24-3Z" fill="${charcoal}"/>
        <path d="m40 76 9-3 5 13-1 51-16 5-5-9Zm40 0-9-3-5 13 1 51 16 5 5-9Z" fill="${c.accent}"/>
        <path d="m40 77 9-4 5 13-10 7-8-7m44-9-9-4-5 13 10 7 8-7" fill="${c.dark}"/>
        <path d="m36 99 14-3v12l-15 3Zm-2 18 16-4v15l-17 4Zm50-18-14-3v12l15 3Zm2 18-16-4v15l17 4Z" fill="${c.deeper}" stroke-width="1.5"/>
        <path d="m36 100 14-3m-16 21 16-4m34-14-14-3m16 21-16-4" fill="none" stroke="${c.soft}" stroke-width="1.7"/>
        <path d="M54 133h12v6H54Z" fill="${seam}"/>
        <rect x="57" y="132" width="6" height="7" rx="1" fill="${metal}" stroke-width="1"/>
        <path d="M37 142l-2 10m48-10 2 10" fill="none" stroke="${c.accent}" stroke-width="2.2"/>`
    case 'hihat':
      return `
        <path d="M44 76q-13-1-22 12l-7 34 15 6 8-26m38-26q13-1 22 12l7 34-15 6-8-26" fill="${charcoal}"/>
        <path d="m21 94 14 9-4 13-14-8m82-14-14 9 4 13 14-8" fill="${c.accent}"/>
        <path d="M38 81 49 73h22l11 8 5 54q-27 8-54 0Z" fill="${charcoal}"/>
        <path d="M35 106q12-7 25-7t25 7l2 29q-27 8-54 0Z" fill="${c.accent}"/>
        <path d="m38 121 12-5-6 14-9 2m47-11-12-5 6 14 9 2" fill="${c.dark}" stroke="none"/>
        <path d="M45 76q-3-7 3-9l12 9 12-9q6 2 3 9l-6 9-9-4-9 4Z" fill="${seam}"/>
        <path d="M60 82v56m-23-4q23 7 46 0" fill="none" stroke="${metal}" stroke-width="1.4"/>
        <path d="m76 79-25 49" fill="none" stroke="${INK}" stroke-width="7"/>
        <path d="m76 79-25 49" fill="none" stroke="${seam}" stroke-width="3"/>
        <path d="m70 89 6 3-2 5-6-3Z" fill="${metal}" stroke-width="1"/>
        <rect x="46" y="108" width="29" height="17" rx="6" transform="rotate(-24 60 117)" fill="#292830"/>
        <path d="m50 116 20-9m-17 14 7-3" fill="none" stroke="${c.accent}" stroke-width="1.6"/>`
    case 'bass':
      return `
        <path d="M38 77q-14 2-20 14l-9 29 4 10 15 1 11-22m43-32q14 2 20 14l9 29-4 10-15 1-11-22" fill="${c.accent}"/>
        <path d="m22 91 7 18-10-9 6 13-12 6 15-2 8-10m62-16-7 18 10-9-6 13 12 6-15-2-8-10" fill="${c.dark}" stroke="none"/>
        <path d="M47 73q-12-6-9-1l6 11 16 8 16-8 6-11q3-5-9 1l-13 4Z" fill="${c.accent}"/>
        <path d="M40 80q8 0 20 9 12-9 20-9l7 57q-27 9-54 0Z" fill="${c.accent}"/>
        <path d="m47 115 13 3 13-3 3 15-16 4-16-4Z" fill="${c.dark}" stroke-width="1.4"/>
        <path d="M36 79q8-5 14 4l-2 15-2 42-15-3q-3-5-2-12l3-29Zm48 0q-8-5-14 4l2 15 2 42 15-3q3-5 2-12l-3-29Z" fill="${charcoal}"/>
        <path d="M33 95q8-3 15 1m-17 13q8-3 17 1m-18 13q8-3 17 1m40-29q-8-3-15 1m17 13q-8-3-17 1m18 13q-8-3-17 1" fill="none" stroke="${seam}" stroke-width="2"/>
        <path d="m34 86 9-4m34 0 9 4m-47 49 4-9m38 9-4-9" fill="none" stroke="${seam}" stroke-width="1.4"/>
        <path d="M56 88v15m8-15v15" fill="none" stroke="${cream}" stroke-width="1.4"/>
        <path d="m12 121 15 2-1 8-14-1m96-9-15 2 1 8 14-1" fill="${c.dark}" stroke-width="1.5"/>`
    case 'voice':
      return `
        <path d="M40 77q-15 1-22 16l-6 24 4 13 15-1 8-25m41-27q15 1 22 16l6 24-4 13-15-1-8-25" fill="${cream}"/>
        <path d="m19 94 8 13-9-4 5 10-8 5 15-1 6-10m65-13-8 13 9-4-5 10 8 5-15-1-6-10" fill="#c6ad92" stroke="none"/>
        <path d="M41 79 52 74q8 11 16 0l11 5 6 54q-24 9-50 0Z" fill="${charcoal}"/>
        <path d="M39 77 50 73l5 12-5 48-15 5-5-8 4-19Zm42 0-11-4-5 12 5 48 15 5 5-8-4-19Z" fill="${c.dark}"/>
        <path d="m38 89 7-5-5 13-3 17 6-7-3 21-7 4Zm44 0-7-5 5 13 3 17-6-7 3 21 7 4Z" fill="${c.deeper}" stroke="none"/>
        <path d="M47 74q-2 10 8 14m18-14q2 10-8 14m-24 22-5 8m43-8 5 8m-70 6 15-1m77 1-15-1m-56 9 15-3m35 3-15-3" fill="none" stroke="${cream}" stroke-width="2.25"/>
        <path d="M68 108h.2m.6 8h.2m.6 8h.2" fill="none" stroke="${metal}" stroke-width="2.8"/>
        <path d="M53 134h14v6H53Z" fill="${INK}"/>
        <rect x="57" y="132" width="6" height="7" rx="1" fill="${metal}" stroke-width="1"/>`
    case 'fx':
      return `
        <path d="M39 77q-14 0-21 14l-9 27 5 12 15 1 9-24m43-30q14 0 21 14l9 27-5 12-15 1-9-24" fill="${c.accent}"/>
        <path d="m21 90 14 13-4 8-15-10m83-11-14 13 4 8 15-10m-91 14 14 2-1 7-14-2m95-7-14 2 1 7 14-2" fill="${charcoal}"/>
        <path d="M39 78 51 72h18l12 6 8 56q-29 10-58 0Z" fill="${c.accent}"/>
        <path d="M35 115l13 14-10-4 5 10-11-3m53-17-13 14 10-4-5 10 11-3" fill="${c.dark}" stroke="none"/>
        <path d="m39 78 10-7 11 10 11-10 10 7-10 14-11-6-11 6Z" fill="${c.deeper}"/>
        <path d="M46 85q14 15 28 0" fill="none" stroke="${INK}" stroke-width="4"/>
        <rect x="42" y="76" width="10" height="15" rx="4" fill="${charcoal}" transform="rotate(-18 47 83)"/>
        <rect x="68" y="76" width="10" height="15" rx="4" fill="${charcoal}" transform="rotate(18 73 83)"/>
        <path d="M46 80l2 7m26-7-2 7m-13 5v11" fill="none" stroke="${c.soft}" stroke-width="1.6"/>
        <path d="M43 108q17-4 34 0l2 18q-19 5-38 0Z" fill="${c.dark}"/>
        <path d="M43 109q17-4 34 0v5H43Z" fill="${charcoal}"/>
        <path d="M48 113v14m24-14v14" stroke="${charcoal}" stroke-width="3.8"/>
        <path d="M46 120h4m20 0h4" stroke="${metal}" stroke-width="1.7"/>`
  }
}

const wrist: Record<CastRole, number> = { snare: 4, hihat: 4, bass: 0, voice: 1, fx: 1 }

export function boomBapBody(role: CastRole, c: RolePalette): string {
  const { skin, shadow } = SKINS[role]
  const hand = `<g transform="translate(${wrist[role]} 0)">
    <path d="M13 123q7-3 15 2l-1 12q-1 3-4 1l-1-4-1 6 4 7q1 4-3 3-9-5-10-13Z" fill="${skin}"/>
    <path d="m15 137 3 7" fill="none" stroke="${shadow}" stroke-width="1.3"/>
  </g>`
  return `<g data-boom-bap-outfit="${role}" ${outline}>
    <path d="M36 128h48l5 26H31Z" fill="${charcoal}"/>
    <path d="m43 137-4 15m38-15 4 15m-21-13v13" fill="none" stroke="${seam}" stroke-width="1.5"/>
    <path d="M50 68q10 5 20 0l4 16-14 6-14-6Z" fill="${skin}"/>
    <path d="M51 69q9 4 18 0l-1 7q-8 3-16 0Z" fill="${shadow}" stroke="none"/>
    ${hand}<g transform="translate(120 0) scale(-1 1)">${hand}</g>
    ${outfit(role, c)}
  </g>`
}
