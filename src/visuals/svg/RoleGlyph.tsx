import type { CharacterRole } from '@/core/packs/schema'

/** Simple per-role pictogram (24×24 viewBox), drawn with `currentColor`. */
const GLYPHS: Record<CharacterRole, React.ReactNode> = {
  kick: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </>
  ),
  snare: (
    <>
      <ellipse cx="12" cy="8" rx="8" ry="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M8 10.5l1.5 7M16 10.5l-1.5 7" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
  hihat: (
    <>
      <path d="M3 9h18M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 6v15M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  bass: (
    <path
      d="M2 12c2.5-7 5-7 7.5 0s5 7 7.5 0 3-5 5-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  ),
  voice: (
    <>
      <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor" />
      <path
        d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  fx: (
    <path
      d="M12 2l2.4 6.6L21 9.5l-5.2 4.3 1.7 7L12 17l-5.5 3.8 1.7-7L3 9.5l6.6-.9z"
      fill="currentColor"
    />
  ),
}

/** Works standalone or nested inside another SVG (pass x/y/width/height). */
export function RoleGlyph({
  role,
  ...svgProps
}: { role: CharacterRole } & Omit<React.SVGProps<SVGSVGElement>, 'role'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" {...svgProps}>
      {GLYPHS[role]}
    </svg>
  )
}
