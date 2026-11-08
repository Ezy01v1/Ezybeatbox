import type { ReactNode } from 'react'
import { INK } from './art'

const patches = new Map<string, { color: string; symbol: ReactNode }>([
  [
    'boom-bap-01',
    {
      color: '#f4bd86',
      symbol: (
        <>
          <circle r="6.5" />
          <circle r="1.6" fill="currentColor" stroke="none" />
          <path d="M-4 0a4 4 0 0 1 4-4m4 4a4 4 0 0 1-4 4" />
        </>
      ),
    },
  ],
  [
    'trap-01',
    {
      color: '#e2b8ff',
      symbol: <path d="M1-7-5 1h5l-1 6 6-9H0Z" fill="currentColor" stroke="none" />,
    },
  ],
  [
    'reggaeton-01',
    {
      color: '#ffca76',
      symbol: <path d="M-7 2H7M-5 5H5M-4 0a4 4 0 0 1 8 0M0-7v1m-6 1 1 1m11-1-1 1" />,
    },
  ],
  [
    'house-01',
    {
      color: '#a9f6e1',
      symbol: <path d="M0-7 7 0 0 7-7 0ZM-7 0H7M0-7-3 0l3 7 3-7Z" />,
    },
  ],
  [
    'dnb-01',
    {
      color: '#e1f88c',
      symbol: <path d="m-6-4 4 4-4 4m6-8 4 4-4 4m6-8 4 4-4 4" transform="translate(-2)" />,
    },
  ],
  [
    'afrobeat-01',
    {
      color: '#ffb173',
      symbol: <path d="m-7 0 4-4 4 4-4 4Zm6 0 4-4 4 4-4 4ZM0-7v1m0 12v1" />,
    },
  ],
])

export function GenrePatch({ packId }: { packId: string | undefined }) {
  const patch = packId ? patches.get(packId) : undefined
  if (!patch) return null

  return (
    <g data-genre-patch="" transform="translate(73 103) rotate(8)" color={patch.color}>
      <rect x="-10" y="-9" width="20" height="18" rx="4" fill={INK} stroke="currentColor" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {patch.symbol}
      </g>
    </g>
  )
}
