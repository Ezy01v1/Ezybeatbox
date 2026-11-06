import { lazy, Suspense, Component, type ReactNode } from 'react'
import type { CharacterRenderProps } from './CharacterRenderer'
import { characterArt, fallbackStyle } from './rive/characterArt'
import { StreetwearCharacter } from './streetwear/StreetwearCharacter'
import { SvgCharacter } from './svg/SvgCharacter'

const RiveCharacter = lazy(() => import('./rive/RiveCharacter'))

class RendererBoundary extends Component<{ fallback: ReactNode; children: ReactNode }> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function PackCharacter({
  packId,
  ...props
}: CharacterRenderProps & { packId: string | undefined }) {
  const src = characterArt(packId, props.role)
  const fallback =
    fallbackStyle(packId) === 'streetwear' ? (
      <StreetwearCharacter {...props} />
    ) : (
      <SvgCharacter {...props} />
    )
  if (!src) return fallback

  return (
    <RendererBoundary key={src} fallback={fallback}>
      <Suspense fallback={fallback}>
        <RiveCharacter src={src} fallback={fallback} {...props} />
      </Suspense>
    </RendererBoundary>
  )
}
