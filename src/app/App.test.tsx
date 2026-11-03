import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renders the app name and tagline from the Spanish translations', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'EzyBeatbox' })).toBeInTheDocument()
    expect(screen.getByText('Arma tu beat, capa por capa.')).toBeInTheDocument()
  })
})
