import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRive, useStateMachineInput } from '@rive-app/react-canvas'
import { subscribeFrame } from '../animationLoop'
import type { CharacterRenderProps } from '../CharacterRenderer'
import { beatImpulse } from '../pose'
import { SvgCharacter } from '../svg/SvgCharacter'
import { followRiveLevel } from './motion'

const MACHINE = 'Performance'
const STATUS = { empty: 0, queued: 1, playing: 2, stopping: 3 } as const

export default function RiveCharacter(props: CharacterRenderProps & { src: string }) {
  const [failed, setFailed] = useState(false)
  const { rive, RiveComponent } = useRive({
    src: props.src,
    stateMachines: MACHINE,
    autoplay: true,
    shouldDisableRiveListeners: true,
    onLoadError: () => setFailed(true),
  })

  const level = useStateMachineInput(rive, MACHINE, 'level')
  const beat = useStateMachineInput(rive, MACHINE, 'beat')
  const status = useStateMachineInput(rive, MACHINE, 'status')
  const muted = useStateMachineInput(rive, MACHINE, 'muted')
  const ready = Boolean(level && beat && status && muted)

  const live = useRef(props)
  useLayoutEffect(() => {
    live.current = props
  })

  useEffect(() => {
    if (!level || !beat || !status || !muted) return
    let envelope = 0
    return subscribeFrame((_, delta) => {
      const current = live.current
      const singing = current.status === 'playing' || current.status === 'stopping'
      const moving = singing && !current.muted && !current.reducedMotion
      envelope = moving
        ? followRiveLevel(current.role, envelope, current.level.getLevel(), delta)
        : 0
      level.value = envelope
      beat.value = moving ? beatImpulse(current.beat.getBeatPosition()) : 0
      status.value = STATUS[current.status]
      muted.value = current.muted
    })
  }, [level, beat, status, muted])

  if (failed) return <SvgCharacter {...props} />

  return (
    <div aria-hidden className="relative h-full w-full">
      {!ready && <SvgCharacter {...props} />}
      <RiveComponent
        className={`pointer-events-none absolute inset-0 ${ready ? '' : 'opacity-0'}`}
      />
    </div>
  )
}
