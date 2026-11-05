import type { CharacterRenderer } from './CharacterRenderer'
import { SvgCharacter } from './svg/SvgCharacter'

export type { CharacterRenderProps, CharacterRenderer } from './CharacterRenderer'
export { RoleGlyph } from './svg/RoleGlyph'
export { StagePattern } from './svg/StagePattern'
export { DEFAULT_THEME, IDLE_COLOR, readableInk, resolveTheme } from './theme'

/** The renderer the stage uses. Swap this line to change the art (e.g. a Rive renderer). */
export const ActiveCharacterRenderer: CharacterRenderer = SvgCharacter
