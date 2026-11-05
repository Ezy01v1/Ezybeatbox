import type { CharacterRenderer } from './CharacterRenderer'
import { SvgCharacter } from './svg/SvgCharacter'

export type { CharacterRenderProps, CharacterRenderer } from './CharacterRenderer'
export { RoleGlyph } from './svg/RoleGlyph'
export { IDLE_COLOR, ROLE_COLORS } from './theme'

/** The renderer the stage uses. Swap this line to change the art (e.g. a Rive renderer). */
export const ActiveCharacterRenderer: CharacterRenderer = SvgCharacter
