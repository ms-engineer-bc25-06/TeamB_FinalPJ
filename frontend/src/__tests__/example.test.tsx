import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// サンプル
function TestComponent() {
  return <div>Hello, Vitest!</div>
}

describe('Vitest Setup Test', () => {
  it('renders test component', () => {
    render(<TestComponent />)
    expect(screen.getByText('Hello, Vitest!')).toBeInTheDocument()
  })

  it('performs basic arithmetic', () => {
    expect(2 + 2).toBe(4)
  })
}) 