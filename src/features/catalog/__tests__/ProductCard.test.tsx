import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { routeTree } from '@/routeTree.gen'

function renderWithRouter(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  return render(<RouterProvider router={router} />)
}

describe('ProductCard integration', () => {
  it('renders both toca and gorro product names on /colecao', async () => {
    renderWithRouter('/colecao')
    expect(await screen.findByRole('heading', { name: /touca cirúrgica/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /gorro/i })).toBeInTheDocument()
  })

  it('exposes layout and real-product image toggle buttons', async () => {
    renderWithRouter('/colecao')
    await screen.findByRole('heading', { name: /coleção/i })
    const layoutButtons = screen.getAllByRole('button', { name: /layout/i })
    const produtoButtons = screen.getAllByRole('button', { name: /produto/i })
    expect(layoutButtons.length).toBeGreaterThan(0)
    expect(produtoButtons.length).toBeGreaterThan(0)
  })

  it('switches to layout image when layout button is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter('/colecao')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })

    const layoutButtons = screen.getAllByRole('button', { name: /^layout$/i })
    await user.click(layoutButtons[0])
    expect(layoutButtons[0]).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders variant selection buttons for each product', async () => {
    renderWithRouter('/colecao')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })
    expect(screen.getAllByRole('radio', { name: /lisa/i }).length).toBeGreaterThan(0)
  })

  it('shows price when a variant is selected', async () => {
    renderWithRouter('/colecao')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })
    expect(screen.getAllByText(/R\$/).length).toBeGreaterThan(0)
  })

  it('has a link to product detail for each product', async () => {
    renderWithRouter('/colecao')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })
    const detailLinks = screen.getAllByRole('link', { name: /ver detalhes/i })
    expect(detailLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('switches to produto view when produto button is clicked after layout', async () => {
    const user = userEvent.setup()
    renderWithRouter('/colecao')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })

    const layoutButtons = screen.getAllByRole('button', { name: /^layout$/i })
    await user.click(layoutButtons[0])

    const produtoButtons = screen.getAllByRole('button', { name: /^produto$/i })
    await user.click(produtoButtons[0])
    expect(produtoButtons[0]).toHaveAttribute('aria-pressed', 'true')
  })
})
