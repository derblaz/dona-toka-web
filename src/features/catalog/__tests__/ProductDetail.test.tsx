import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { ADD_TO_CART_EVENT } from '../models'
import type { CartItemSnapshot } from '../models'

function renderWithRouter(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  return render(<RouterProvider router={router} />)
}

describe('product detail page', () => {
  it('renders product name and description for toca-cirurgica', async () => {
    renderWithRouter('/produto/toca-cirurgica')
    expect(await screen.findByRole('heading', { name: /touca cirúrgica/i, level: 1 })).toBeInTheDocument()
  })

  it('renders a not-found state for unknown slug without a runtime error', async () => {
    renderWithRouter('/produto/produto-que-nao-existe')
    expect(await screen.findByRole('heading', { name: /produto não encontrado/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver coleção/i })).toBeInTheDocument()
  })

  it('renders price in Brazilian Real format', async () => {
    renderWithRouter('/produto/toca-cirurgica')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })
    expect(screen.getAllByText(/R\$/).length).toBeGreaterThan(0)
  })

  it('renders installment message', async () => {
    renderWithRouter('/produto/toca-cirurgica')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })
    expect(screen.getByText(/3x de/i)).toBeInTheDocument()
  })

  it('renders variant selector buttons', async () => {
    renderWithRouter('/produto/toca-cirurgica')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })
    expect(screen.getByRole('radio', { name: /lisa/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /estampada/i })).toBeInTheDocument()
  })

  it('switches active variant when another is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter('/produto/toca-cirurgica')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })

    const estampada = screen.getByRole('radio', { name: /estampada/i })
    await user.click(estampada)
    expect(estampada).toHaveAttribute('aria-checked', 'true')
  })

  it('renders quantity control with increment and decrement buttons', async () => {
    renderWithRouter('/produto/toca-cirurgica')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })
    expect(screen.getByRole('button', { name: /aumentar quantidade/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /diminuir quantidade/i })).toBeInTheDocument()
  })

  it('disables decrement button when quantity is at minimum', async () => {
    renderWithRouter('/produto/toca-cirurgica')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })
    const decrement = screen.getByRole('button', { name: /diminuir/i })
    expect(decrement).toBeDisabled()
  })

  describe('add to cart', () => {

    it('dispatches add-to-cart event with expected cart item snapshot', async () => {
      const user = userEvent.setup()
      const dispatchSpy = vi.fn()
      window.addEventListener(ADD_TO_CART_EVENT, dispatchSpy)

      renderWithRouter('/produto/toca-cirurgica')
      await screen.findByRole('heading', { name: /touca cirúrgica/i })

      const addButton = screen.getByRole('button', { name: /adicionar ao carrinho/i })
      await user.click(addButton)

      expect(dispatchSpy).toHaveBeenCalledTimes(1)

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent<CartItemSnapshot>
      const snapshot = event.detail
      expect(snapshot.productId).toBe('toca-cirurgica')
      expect(snapshot.variantId).toBe('toca-lisa')
      expect(snapshot.quantity).toBe(1)
      expect(snapshot.priceCents).toBeGreaterThan(0)
      expect(snapshot.image).toBeDefined()
      expect(snapshot.image.alt.trim()).not.toBe('')

      window.removeEventListener(ADD_TO_CART_EVENT, dispatchSpy)
    })

    it('dispatches snapshot with selected variant when variant is changed before adding', async () => {
      const user = userEvent.setup()
      const dispatchSpy = vi.fn()
      window.addEventListener(ADD_TO_CART_EVENT, dispatchSpy)

      renderWithRouter('/produto/toca-cirurgica')
      await screen.findByRole('heading', { name: /touca cirúrgica/i })

      await user.click(screen.getByRole('radio', { name: /estampada/i }))
      await user.click(screen.getByRole('button', { name: /adicionar ao carrinho/i }))

      const snapshot = (dispatchSpy.mock.calls[0][0] as CustomEvent<CartItemSnapshot>).detail
      expect(snapshot.variantId).toBe('toca-estampada')

      window.removeEventListener(ADD_TO_CART_EVENT, dispatchSpy)
    })

    it('dispatches snapshot with correct quantity after increment', async () => {
      const user = userEvent.setup()
      const dispatchSpy = vi.fn()
      window.addEventListener(ADD_TO_CART_EVENT, dispatchSpy)

      renderWithRouter('/produto/toca-cirurgica')
      await screen.findByRole('heading', { name: /touca cirúrgica/i })

      await user.click(screen.getByRole('button', { name: /aumentar/i }))
      await user.click(screen.getByRole('button', { name: /aumentar/i }))
      await user.click(screen.getByRole('button', { name: /adicionar ao carrinho/i }))

      const snapshot = (dispatchSpy.mock.calls[0][0] as CustomEvent<CartItemSnapshot>).detail
      expect(snapshot.quantity).toBe(3)

      window.removeEventListener(ADD_TO_CART_EVENT, dispatchSpy)
    })
  })

  it('renders gorro product detail', async () => {
    renderWithRouter('/produto/gorro')
    expect(await screen.findByRole('heading', { name: /gorro/i, level: 1 })).toBeInTheDocument()
  })

  it('switches image tab to layout and back to real-product', async () => {
    const user = userEvent.setup()
    renderWithRouter('/produto/toca-cirurgica')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })

    const layoutTab = screen.getByRole('button', { name: /^layout$/i })
    await user.click(layoutTab)
    expect(layoutTab).toHaveAttribute('aria-pressed', 'true')

    const realTab = screen.getByRole('button', { name: /^produto real$/i })
    await user.click(realTab)
    expect(realTab).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches image via thumbnail buttons', async () => {
    const user = userEvent.setup()
    renderWithRouter('/produto/toca-cirurgica')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })

    const thumbnailLayout = screen.getByRole('button', { name: /ver imagem do layout/i })
    await user.click(thumbnailLayout)
    expect(screen.getByRole('button', { name: /^layout$/i })).toHaveAttribute('aria-pressed', 'true')

    const thumbnailReal = screen.getByRole('button', { name: /ver imagem do produto real/i })
    await user.click(thumbnailReal)
    expect(screen.getByRole('button', { name: /^produto real$/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('disables increment button at maximum quantity', async () => {
    const user = userEvent.setup()
    renderWithRouter('/produto/toca-cirurgica')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })

    const incBtn = screen.getByRole('button', { name: /aumentar/i })
    for (let i = 0; i < 9; i++) {
      await user.click(incBtn)
    }
    expect(incBtn).toBeDisabled()
  })

  it('shows validation error when invalid quantity is entered in the input', async () => {
    renderWithRouter('/produto/toca-cirurgica')
    await screen.findByRole('heading', { name: /touca cirúrgica/i })

    const input = screen.getByRole('spinbutton', { name: /quantidade/i })
    fireEvent.change(input, { target: { value: '0', valueAsNumber: 0 } })
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
