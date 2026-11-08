import { INK, SKINS, type RolePalette } from './art'

// The Boom Bap pilot uses the stage's 120 × 158 framing and the shared eye and mouth pivots.
const outline = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`
const { skin, shadow, hair } = SKINS.kick
const ribbing = '#302d35'
const shirt = '#232129'
const metal = '#e4dce0'

export const KICK_PILOT_BROWS = `
  <path d="M41 35q5-7 14-2l-1 3q-7-3-13 0Zm38 0q-5-7-14-2l1 3q7-3 13 0Z"
    fill="${hair}" stroke="none"/>`

export const KICK_PILOT_EYES = `
  <path d="M41 40q6-4 14 0-3 6-8 5-4-1-6-5Zm24 0q8-4 14 0-2 4-6 5-5 1-8-5Z"
    fill="#fff3df" stroke="#432a2c" stroke-width="1.2"/>
  <path d="M49 39v4m22-4v4" fill="none" stroke="${hair}" stroke-width="4"/>
  <path d="M48.5 40h.2m22.3 0h.2" fill="none" stroke="#fff3df" stroke-width="1.2"/>`

export function kickPilotHead(c: RolePalette, expression: string): string {
  return `<g ${outline}>
    <path d="M36 31c-8 5-16 15-13 20 3 5 12 5 18 2l7-18Z" fill="${c.deeper}"/>
    <path d="M36 33C30 36 24 44 23 49" fill="none" stroke="${c.accent}" stroke-width="2.2"/>
    <path d="M36 40c-9-5-10 10-5 14q3 3 7 1m46-15c9-5 10 10 5 14q-3 3-7 1" fill="${skin}"/>
    <path d="m31 46 4 3m54-3-4 3" fill="none" stroke="${shadow}" stroke-width="1.6"/>
    <path d="M35 35c1-14 10-21 25-21s24 7 25 21l-2 23c-1 7-7 12-14 15q-9 3-18 0c-7-3-13-8-14-15Z"
      fill="${skin}"/>
    <path d="M37 34q7-9 13-11l-9 16 1 20q1 5 9 11-11-4-14-12Zm44-4 4 5-2 23q-1 9-12 14l6-8Z"
      fill="${shadow}" stroke="none"/>
    <path d="M38 60q4 5 10 7l1-2 4 5 4-3 3 2 3-3 5 3 4-4 1 2q5-2 9-7c-2 8-12 14-22 15-10-1-20-7-22-15Z"
      fill="${hair}" stroke-width="1.3"/>
    <path d="M32 36C29 21 35 9 49 5c8-3 16-3 24 0 14 5 19 16 15 31l-6-9c-12-7-29-6-42 1Z"
      fill="${c.accent}"/>
    <path d="M34 31c1-9 5-16 12-20m31 1q8 7 8 18" fill="none" stroke="${c.soft}" stroke-width="1.6"/>
    <path d="M47 25q-2-10 6-15l-1 4 10-7-2 5 9-3-2 5 6-1q5 4 3 12l-7 5-7-2-5 3-6-5Z"
      fill="${hair}" stroke-width="1.6"/>
    <path d="M49 21q11-5 23-1 4 2 1 6-12-4-24 1Z" fill="${c.accent}" stroke-width="1.4"/>
    <path d="M53 22.5h.2m5-1h.2m5 0h.2m5 1h.2" fill="none" stroke="${c.deeper}" stroke-width="1.5"/>
    <path d="M56 49q4-3 8 0l1 3q-5 3-10 0Z" fill="${shadow}" stroke="none"/>
    <path d="M57 52q3 2 6 0" fill="none" stroke="#754934" stroke-width="1.2"/>
    ${expression}
  </g>`
}

export function kickPilotBody(c: RolePalette): string {
  const hand = `
    <path d="M14 125q7-4 14 2l2 12q0 4-3 3l-3-6-1 6 4 6q1 4-3 3-10-5-11-12Z" fill="${skin}"/>
    <path d="m16 137 3 7" fill="none" stroke="${shadow}" stroke-width="1.4"/>`
  return `<g data-kick-pilot="" ${outline}>
    <path d="M36 129h48l5 26H31Z" fill="${ribbing}"/>
    <path d="m39 145 17 2-2 8-17-1Zm42 0-17 2 2 8 17-1Z" fill="#403c43" stroke-width="1.3"/>
    <path d="M50 69q10 4 20 0l3 16-13 6-13-6Z" fill="${skin}"/>
    <path d="M51 70q8 4 18 0l-1 7q-9 3-16 0Z" fill="${shadow}" stroke="none"/>
    <path d="M39 81q10-6 13-2 8 6 16 0 3-4 13 2l7 57q-30 9-56 0Z" fill="${shirt}"/>
    <path d="m66 104-7 15-10 9 16-7-6 9 15-7-5 9-26 7 37-5-4-27Z" fill="#18171e" stroke="none"/>
    <path d="M38 76c-10 3-17 9-20 17L9 113q-2 8 3 16l15 3 8-14 6-22Zm44 0c10 3 17 9 20 17l9 20q2 8-3 16l-15 3-8-14-6-22Z"
      fill="${c.accent}"/>
    <path d="M21 94q1 14 8 20l-12-6q-1 9 10 12l-9 7 11-2 8-19-7 6Zm78 0q-1 14-8 20l12-6q1 9-10 12l9 7-11-2-8-19 7 6Z"
      fill="${c.dark}" stroke="none"/>
    <path d="M39 76q4-3 10-3l5 13-7 51-16-1q-5-7 0-17l2-19Zm42 0q-4-3-10-3l-5 13 7 51 16-1q5-7 0-17l-2-19Z"
      fill="${c.accent}"/>
    <path d="m37 90 7 8-3-14Zm-4 28 8-10-3 11-8 9 14-6-5 11-8 3Zm50-28-7 8 3-14Zm4 28-8-10 3 11 8 9-14-6 5 11 8 3Z"
      fill="${c.dark}" stroke="none"/>
    <path d="m38 109 6 4-5 9-6 4m49-17-6 4 5 9 6 4" fill="none" stroke-width="1.5"/>
    <path d="M47 73q-10 1-9 7 3 6 15 9l2-5Zm26 0q10 1 9 7-3 6-15 9l-2-5Z" fill="${ribbing}"/>
    <path d="m41 77 9 9m29-9-9 9m-17 3-6 45m20-45 6 45" fill="none" stroke="${metal}" stroke-width="1.4"/>
    <path d="m53 89-6 45m20-45 6 45" fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray=".8 2.7"/>
    <rect x="71" y="132" width="3.5" height="6" rx="1" fill="${metal}" stroke-width="1"/>
    <path d="M51 87q9 21 18 0" fill="none" stroke-width="3.4"/>
    <path d="M51 87q9 21 18 0" fill="none" stroke="${metal}" stroke-width="1.8"/>
    <path d="m98 96 6-1 4 12-6 2Z" fill="${c.dark}" stroke-width="1.4"/>
    <path d="m101 97 3 8" fill="none" stroke="${metal}" stroke-width="1.5"/>
    ${hand}<g transform="translate(120 0) scale(-1 1)">${hand}</g>
    <path d="M12 125q8-5 16 1l-2 7q-6-4-13-1Zm96 0q-8-5-16 1l2 7q6-4 13-1Zm-77 6 15 2-1 5-13-1Zm58 0-15 2 1 5 13-1Z"
      fill="${ribbing}" stroke-width="1.5"/>
    <path d="m16 125 1 5m4-6 1 6m82-5-1 5m-4-6-1 6" fill="none" stroke="#53505a" stroke-width="1.2"/>
  </g>`
}
