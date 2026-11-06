/**
 * Streetwear hip hop characters (approved concepts: docs/design/characters-v1), as plain SVG
 * markup. Shared by the Rive generator (scripts/rive/build-streetwear.ts) and the in-app SVG
 * fallback (StreetwearCharacter.tsx). Coordinates use the original 120 × 226 rig (viewBox
 * `0 -6 120 226`); feet rest at y ≈ 209.
 *
 * Every role-specific accent comes from `palette`, so a theme can re-skin the same rig.
 */
import type { CharacterRole } from '../../core/packs/schema'

export interface RolePalette {
  /** Main outfit color (the role color). */
  accent: string
  /** Darker shade: seams, cuffs, collars, secondary panels. */
  dark: string
  /** Even darker shade, for the few parts that sit on top of `dark`. */
  deeper: string
  /** Very light tint: piping and small highlights. */
  light: string
  /** Soft tint, between `accent` and `light`. */
  soft: string
}

/** Blends `hex` toward `target` by `amount` (0–1). */
function mix(hex: string, target: string, amount: number): string {
  const channel = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(channel(hex, i) + (channel(target, i) - channel(hex, i)) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

/** Derives the outfit shades from a role color. */
export function paletteFor(accent: string): RolePalette {
  return {
    accent,
    dark: mix(accent, '#000000', 0.22),
    deeper: mix(accent, '#000000', 0.38),
    light: mix(accent, '#ffffff', 0.78),
    soft: mix(accent, '#ffffff', 0.55),
  }
}

export const INK = '#15151e'
const DARK = '#2c2b37'
const LIGHT = '#f2e5ca'

export const SKINS: Record<CharacterRole, { skin: string; shadow: string; hair: string }> = {
  kick: { skin: '#c78656', shadow: '#a66240', hair: '#25232b' },
  snare: { skin: '#a76b49', shadow: '#835037', hair: '#292631' },
  hihat: { skin: '#d89b68', shadow: '#b77a4d', hair: '#292631' },
  bass: { skin: '#87583e', shadow: '#66402f', hair: '#24232b' },
  voice: { skin: '#bc8055', shadow: '#985d3e', hair: '#382a2b' },
  fx: { skin: '#edb78c', shadow: '#ca926e', hair: '#262b36' },
}

/** Base stroke style shared by head and body (thick ink outline, rounded). */
const OUTLINE = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`

function outfit(role: CharacterRole, c: RolePalette): string {
  switch (role) {
    case 'kick':
      return `
        <path d="M37 79 23 86 16 122 26 128 37 105M83 79 97 86 104 122 94 128 83 105" fill="${c.accent}"/>
        <path d="m17 116 11 3-2 9-11-3m88-9-11 3 2 9 11-3" fill="${DARK}"/>
        <path d="M36 78 48 75h24l12 3 4 57-23 3-5-56-5 56-23-3Z" fill="${c.accent}"/>
        <path d="m42 80 10 12 8-10 8 10 10-12-7-6H49Z" fill="${DARK}"/>
        <path d="m44 103-5 19m37-19 5 19M56 89l-2 44m10-44 2 44" fill="none" stroke-width="1.5"/>
        <path d="M48 83q12 27 24 0" fill="none" stroke="#d7d5dc" stroke-width="2.5"/>
        <rect x="87" y="94" width="8" height="14" rx="2" fill="${c.dark}"/>
        <path d="M90 97v8" stroke="${LIGHT}" stroke-width="1"/>`
    case 'snare':
      return `
        <path d="m38 81-13 6-7 36 10 4 10-27m44-19 13 6 7 36-10 4-10-27" fill="${DARK}"/>
        <path d="M38 77 49 75h22l11 2 5 59-22 2-5-51-5 51-22-2Z" fill="${c.accent}"/>
        <path d="m38 77 9-6 13 13-12 11Zm44 0-9-6-13 13 12 11Z" fill="${c.dark}"/>
        <path d="M37 98h15v14H36Zm31 0h15l1 14H68ZM35 119h17v12H34Zm33 0h17l1 12H68Z" fill="${INK}"/>
        <path d="M37 98h15v5H37Zm31 0h15v5H68Z" fill="${c.light}" stroke-width="1"/>
        <path d="M42 114v5m34-5v5" stroke="${c.soft}" stroke-width="1"/>
        <rect x="40" y="135" width="40" height="5" rx="1" fill="${INK}"/>
        <rect x="55" y="133" width="10" height="8" rx="1" fill="#c6c2cf"/>
        <path d="M58 135h4v4h-4Z" fill="${INK}" stroke="none"/>`
    case 'hihat':
      return `
        <path d="m37 80-13 7-7 36 11 4 10-25m45-22 13 7 7 36-11 4-10-25" fill="${DARK}"/>
        <path d="M37 78 49 75h22l12 3 3 59H34Z" fill="${DARK}"/>
        <path d="m35 105 25-10 25 10 1 27H34Z" fill="${c.accent}"/>
        <path d="m20 107 10 5-3 14-11-3m84-16-10 5 3 14 11-3" fill="${c.accent}"/>
        <path d="m36 103 24-10 24 10M60 82v49" fill="none" stroke="${LIGHT}" stroke-width="1.6"/>
        <path d="m47 77 13 10 13-10-3-6H50Z" fill="${DARK}"/>
        <path d="m77 79-28 51" stroke="${INK}" stroke-width="7"/>
        <path d="m77 79-28 51" stroke="#51515f" stroke-width="3"/>
        <rect x="47" y="108" width="29" height="18" rx="6" transform="rotate(-22 60 117)" fill="${INK}"/>
        <path d="m52 114 17-7" stroke="${c.accent}" stroke-width="2"/>
        <path d="M34 133h52v6H34Z" fill="${LIGHT}"/>`
    case 'bass':
      return `
        <path d="m36 79-14 8-8 37 13 5 12-27m45-23 14 8 8 37-13 5-12-27" fill="${c.accent}"/>
        <path d="m15 117 14 4-3 9-13-5m92-8-14 4 3 9 13-5" fill="${c.dark}"/>
        <path d="M35 78 48 74h24l13 4 4 63H31Z" fill="${c.accent}"/>
        <path d="m45 74 15 15 15-15-6-5H51Z" fill="${c.deeper}"/>
        <path d="M35 78 46 75l8 14-1 54-22-2Zm50 0-11-3-8 14 1 54 22-2Z" fill="${DARK}"/>
        <path d="m34 95 18 2m-19 13 19 2m-20 13 20 2m16-30 18-2m-18 17 19-2m-19 17 20-2" fill="none"/>
        <path d="M57 91v19m6-19v19" fill="none" stroke="${LIGHT}" stroke-width="1.4"/>`
    case 'voice':
      return `
        <path d="m37 79-13 8-7 36 11 5 11-27m44-22 13 8 7 36-11 5-11-27" fill="${LIGHT}"/>
        <path d="m17 117 13 4-3 9-12-5m88-8-13 4 3 9 12-5" fill="${c.accent}"/>
        <path d="M37 78 49 74h22l12 4 4 58-21 3-6-53-6 53-21-3Z" fill="${c.dark}"/>
        <path d="m46 76 14 11 14-11-3-5H49Z" fill="${LIGHT}"/>
        <path d="m48 77 12 9 12-9" fill="none" stroke="${c.dark}" stroke-width="2"/>
        <path d="m41 108-4 14m42-14 4 14" fill="none" stroke="${LIGHT}" stroke-width="1.5"/>
        <path d="M34 130h20v6H34Zm32 0h20v6H66Z" fill="${LIGHT}"/>
        <g fill="${LIGHT}" stroke-width="0.8">
          <circle cx="66" cy="93" r="1.8"/>
          <circle cx="67" cy="105" r="1.8"/>
          <circle cx="68" cy="117" r="1.8"/>
        </g>`
    case 'fx':
      return `
        <path d="m37 79-13 8-7 36 11 4 11-25m44-23 13 8 7 36-11 4-11-25" fill="${c.accent}"/>
        <path d="m21 97 10 5-3 8-10-5m81-8-10 5 3 8 10-5" fill="${DARK}"/>
        <path d="M37 78 49 73h22l12 5 4 59H33Z" fill="${c.accent}"/>
        <path d="M38 78 48 74l6 23-18-6Zm44 0-10-4-6 23 18-6Z" fill="${DARK}"/>
        <path d="M57 77h6v26h-6Z" fill="${DARK}"/>
        <rect x="44" y="109" width="32" height="17" rx="2" fill="${c.dark}"/>
        <path d="M44 109h32v5H44Z" fill="${DARK}"/>
        <path d="M48 117v13m24-13v13" stroke="${DARK}" stroke-width="3"/>
        <path d="M43 76q17 13 34 0" fill="none" stroke="${INK}" stroke-width="5"/>
        <rect x="39" y="75" width="10" height="16" rx="4" fill="${DARK}"/>
        <rect x="71" y="75" width="10" height="16" rx="4" fill="${DARK}"/>
        <path d="M43 79v8m34-8v8" stroke="${c.accent}" stroke-width="2"/>
        <path d="M34 132h52v6H34Z" fill="${DARK}"/>`
  }
}

/** Legs, shoes, neck, torso, outfit and hands. Scales with the "compression" pivot. */
export function bodySvg(role: CharacterRole, c: RolePalette): string {
  const { skin, shadow } = SKINS[role]
  const cargoPockets =
    role === 'kick' || role === 'fx'
      ? `<g fill="${role === 'fx' ? c.accent : '#3b3945'}">
          <path d="m36 148 17 2-1 16-15-2Zm48 0-17 2 1 16 15-2Z"/>
          <path d="m36 148 17 2-1 5-15-2Zm48 0-17 2 1 5 15-2Z"/>
        </g>`
      : ''
  const piping =
    role === 'snare' || role === 'hihat'
      ? `<path d="m39 135 1 25 7 27m34-52-1 25-7 27" fill="none" stroke="${c.accent}" stroke-width="2.5"/>`
      : ''
  return `<g ${OUTLINE}>
    <path d="M37 126h46l2 29-9 37H62l-2-46-2 46H44l-9-37Z" fill="${DARK}"/>
    <path d="m39 139 3 23 5 23m34-46-3 23-5 23M60 137v10" fill="none" stroke="#55515f" stroke-width="1.3"/>
    ${cargoPockets}
    ${piping}
    <path d="m43 188-4 8-8 4v8h27v-17Zm34 0 4 8 8 4v8H62v-17Z" fill="${c.accent}"/>
    <path d="m41 195 12 3-4 6H32v-4Zm38 0-12 3 4 6h17v-4Z" fill="${LIGHT}"/>
    <path d="M31 204h27v5H31Zm31 0h27v5H62Z" fill="${LIGHT}"/>
    <path d="m43 192 10 2m-12 1 10 2m26-5-10 2m12 1-10 2" stroke="${LIGHT}" stroke-width="1.3"/>
    <path d="M49 67h22v20H49Z" fill="${skin}"/>
    <path d="M49 68h22v9q-11 6-22 0Z" fill="${shadow}" stroke="none"/>
    <path d="M42 79h36v56H42Z" fill="${INK}"/>
    ${outfit(role, c)}
    <path d="m17 124-3 10 1 12 4 3 2-2-1-8 3 5 3-2-1-13Zm86 0 3 10-1 12-4 3-2-2 1-8-3 5-3-2 1-13Z" fill="${skin}"/>
    <path d="m17 132 4 2m82-2-4 2" stroke="${shadow}" stroke-width="1.3"/>
  </g>`
}

function hairAndHat(role: CharacterRole, c: RolePalette, hair: string): string {
  switch (role) {
    case 'kick':
      return `
        <path d="M34 33 30 27l7-10 9 3 8-10 7 9 13-5-2 9 13 4-2 10-11-8-12 5-12-5Z" fill="${hair}"/>
        <path d="M30 29C23 9 43 4 61 6c20 0 29 10 27 26l-12-6q-16-7-34 0Z" fill="${c.accent}"/>
        <path d="M43 23q17-7 34 1v7q-18-7-34-1Z" fill="${c.dark}"/>
        <path d="m30 25-12 8q-6 5 9 6l14-9" fill="${c.accent}"/>
        <path d="M56 25h14" fill="none" stroke="${INK}" stroke-width="2.5" stroke-dasharray="1 4"/>
        <path d="m40 58 8 7 5-2 7 5 7-5 5 2 8-7-4 10-16 8-16-8Z" fill="${hair}" stroke-width="1.3"/>`
    case 'snare':
      return `
        <path d="m33 47-5-16-6-1 9-8-4-10 19 1 8-8 17 5 12 9 6 17-8-4-8-14-10 15-10-4-17 15 4-16Z" fill="${hair}"/>
        <path d="m36 20 17-8 12 1-17 14m30 0 6 3m-6 3 6 3" fill="none" stroke="#56505e" stroke-width="1.5"/>`
    case 'hihat':
      return `
        <path d="M34 37q-7-18 8-20 6-12 19-4 20-7 23 9l2 16-9-5-4 4-7-8-8 8-6-5-8 6-3-7Z" fill="${hair}"/>
        <path d="m34 21 5-15q21-9 42 0l5 18-11 7H44Z" fill="${c.accent}"/>
        <path d="M33 20q27-8 54 1l7 14q-10 4-17-5-16-7-34 1-12 9-18 4Z" fill="${c.accent}"/>
        <path d="M41 15q19-6 38 0" fill="none" stroke="${c.dark}" stroke-width="1.5"/>`
    case 'bass':
      return `
        <path d="m36 32-3-12q2-20 27-20t27 20l-3 12-11-7H47Z" fill="${c.accent}"/>
        <path d="M33 22q27-7 54 0v12q-27-7-54 0Z" fill="${c.dark}"/>
        <path d="M43 7v13m11-15v13m12-13v13M77 7v13m-38 5v5m10-7v5m11-5v4m11-4v5m10-3v5" fill="none" stroke="${c.deeper}" stroke-width="1"/>
        <path d="m38 52 9 9 7-2 6 4 6-4 7 2 9-9-3 15-19 10-19-10Z" fill="${hair}"/>`
    case 'voice':
      return `
        <path d="M34 43q-10-22 4-28 7-13 22-5 15-8 22 5 14 6 4 28l-7-14-9-10-10 5-10-5-9 10Z" fill="${hair}"/>
        <path d="M50 18q-10 9-9 19m29-19q10 9 9 19M49 13l-7 5m29-5 7 5" fill="none" stroke="#604347" stroke-width="1.5"/>
        <path d="M37 32q-7 9-2 20m48-20q7 9 2 20" fill="none" stroke="${hair}" stroke-width="3"/>`
    case 'fx':
      return `
        <path d="m33 47-6-14-7-3 10-11-7-9 20 2L56 1l10 9L80 6l9 13-6 18-9-10-8-9-10 16-9-2Z" fill="${hair}"/>
        <path d="m34 38 7-19 16-8-7 14-8 1-9 21Z" fill="${c.accent}" stroke-width="1.2"/>
        <path d="m81 34 6 1m-5 3 5 1" fill="none" stroke="#c8c2d5" stroke-width="1.3"/>`
  }
}

/**
 * Head without the animated expression. `expression` is inserted where the original rig put
 * its children (above the face and hair, below earrings).
 */
export function headSvg(role: CharacterRole, c: RolePalette, expression: string): string {
  const { skin, shadow, hair } = SKINS[role]
  const voicePuffs =
    role === 'voice'
      ? `<g fill="${hair}">
          <path d="M38 29C9 35 12 12 22 14 17 3 31 3 33 9 44 1 53 14 43 21Z"/>
          <path d="M82 29c29 6 26-17 16-15 5-11-9-11-11-5-11-8-20 5-10 12Z"/>
          <path d="M24 17q-5 9 4 11m7-14q8-3 10 2M96 17q5 9-4 11m-7-14q-8-3-10 2" fill="none" stroke="#564044" stroke-width="1.4"/>
        </g>`
      : ''
  const earrings =
    role === 'snare' || role === 'hihat' || role === 'bass' || role === 'fx'
      ? `<g fill="none" stroke="#d5cedc" stroke-width="2"><path d="M32 48c-7 8 6 12 6 4m50-4c7 8-6 12-6 4"/></g>`
      : role === 'voice'
        ? `<g fill="${LIGHT}" stroke-width="1"><circle cx="33" cy="51" r="2.5"/><circle cx="87" cy="51" r="2.5"/></g>`
        : ''
  return `<g ${OUTLINE}>
    ${voicePuffs}
    <path d="M36 36c-10-8-14 13 1 17m47-17c10-8 14 13-1 17" fill="${skin}"/>
    <path d="m31 41 4 5m54-5-4 5" fill="none" stroke="${shadow}" stroke-width="1.5"/>
    <path d="M35 32q0-21 25-21t25 21l-2 22q-3 17-23 20-20-3-23-20Z" fill="${skin}"/>
    <path d="m39 49 3 12 18 10 18-10 3-12-2 15-19 11-19-11Z" fill="${shadow}" stroke="none"/>
    ${hairAndHat(role, c, hair)}
    <path d="m57 45-2 9 7 1" fill="none" stroke="${shadow}" stroke-width="1.6"/>
    ${expression}
    ${earrings}
  </g>`
}

/** Brows and lid creases: always visible. */
export const BROWS_SVG = `
  <path d="m43 36 10-2m14 0 10 2" fill="none" stroke="#25212b" stroke-width="2.6"/>
  <g stroke="#352735" stroke-width="1.8" fill="none"><path d="M43 43q5 4 10 0m14 0q5 4 10 0"/></g>`

/** Open eyes (hidden while resting). */
export const EYES_SVG = `
  <path d="M42 40q6-5 13 0-3 8-10 4Zm23 0q7-5 13 0l-3 4q-7 4-10-4Z" fill="#fff4e4" stroke="#352735" stroke-width="1.2"/>
  <path d="M48 38v5m24-5v5" fill="none" stroke="#25212b" stroke-width="4"/>`

/** Resting smile, queued "o" and the singing mouth (opened by the audio level in Rive). */
export const SMILE_SVG = `<path d="M54 60q6 3 12-1" fill="none" stroke="#432a2c" stroke-width="1.8"/>`
export const QUEUED_MOUTH_SVG = `<circle cx="60" cy="60" r="2.5" fill="#211722" stroke="none"/>`
export const SINGING_MOUTH_SVG = `<ellipse cx="60" cy="60" rx="4" ry="0.8" fill="#211722" stroke="#5e3433" stroke-width="1"/>`

/**
 * Staggered blinking: each role loops on its own period (frames at 60 fps) and blinks at its own
 * offset, so the band never blinks in unison. Only visible while the eyes are open.
 */
export const BLINK: Record<CharacterRole, { period: number; at: number }> = {
  kick: { period: 252, at: 40 },
  snare: { period: 300, at: 150 },
  hihat: { period: 228, at: 95 },
  bass: { period: 336, at: 210 },
  voice: { period: 276, at: 15 },
  fx: { period: 312, at: 120 },
}
/** Vertical center of the eyes in artwork space: the squash keeps it fixed. */
export const EYES_CENTER_Y = 41
export const BLINK_SQUASH = 0.1

/** Eye scaleY (1 = open) at `seconds`: closes over 3 frames, reopens over 4, as in the Rive rig. */
export function blinkScale(role: CharacterRole, seconds: number): number {
  const { period, at } = BLINK[role]
  const frame = (seconds * 60) % period
  if (frame <= at || frame >= at + 7) return 1
  if (frame <= at + 3) return 1 - ((frame - at) / 3) * (1 - BLINK_SQUASH)
  return BLINK_SQUASH + ((frame - at - 3) / 4) * (1 - BLINK_SQUASH)
}
