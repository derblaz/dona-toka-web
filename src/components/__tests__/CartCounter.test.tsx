import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CartCounter } from '../CartCounter'

describe('CartCounter', () => {
  it('shows empty cart label when count is 0', () => {
    render(<CartCounter count={0} />)
    expect(screen.getByRole('link', { name: /carrinho, vazio/i })).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows count badge and plural item label for count > 1', () => {
    render(<CartCounter count={3} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('aria-label', 'Carrinho, 3 itens')
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('uses singular label for count=1', () => {
    render(<CartCounter count={1} />)
    expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'Carrinho, 1 item')
  })

  it('caps badge display at 99+ for large counts', () => {
    render(<CartCounter count={100} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('defaults to empty cart when no count prop is provided', () => {
    render(<CartCounter />)
    expect(screen.getByRole('link', { name: /carrinho, vazio/i })).toBeInTheDocument()
  })
})
