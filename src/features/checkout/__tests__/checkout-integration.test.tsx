import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, it, expect, beforeEach } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { _resetForTest } from '@/features/cart/store'
import type { CartItem } from '@/features/cart/models'

const mockImage = {
  src: '/img/toca.jpg',
  alt: 'Touca cirúrgica',
  role: 'real-product' as const,
  width: 400,
  height: 400,
}

const cartItem: CartItem = {
  productId: 'p1',
  variantId: 'v1',
  productName: 'Touca Cirúrgica',
  variantName: 'Lisa',
  slug: 'toca-lisa',
  priceCents: 4900,
  quantity: 1,
  image: mockImage,
}

function renderRoute(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  sessionStorage.clear()
  _resetForTest([])
})

// ── Empty cart guard ──────────────────────────────────────────────────────────

describe('checkout route — empty cart guard', () => {
  it('redirects to /carrinho when cart is empty', async () => {
    _resetForTest([])
    renderRoute('/checkout')
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /finalizar/i })).toBeNull()
    })
    // Should render cart empty state or cart page heading
    await waitFor(() => {
      expect(
        screen.getByText(/seu carrinho está vazio/i) ||
          screen.getByRole('heading', { name: /carrinho/i }),
      ).toBeTruthy()
    })
  })
})

// ── Invalid form submission ───────────────────────────────────────────────────

describe('checkout form — validation', () => {
  it('shows field errors when form is submitted empty', async () => {
    _resetForTest([cartItem])
    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    // Simulate freight quote by clicking "Calcular frete" without CEP — then submit
    const submitBtn = screen.getByRole('button', { name: /confirmar pedido/i })
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    })
  })

  it('preserves valid entered values when validation fails', async () => {
    _resetForTest([cartItem])
    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    const nameInput = screen.getByLabelText(/nome completo/i)
    await userEvent.type(nameInput, 'Ana Lima')

    // Submit without filling other required fields
    const submitBtn = screen.getByRole('button', { name: /confirmar pedido/i })
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    })

    // Name value should be preserved
    expect(nameInput).toHaveValue('Ana Lima')
  })
})

// ── PIX checkout flow ─────────────────────────────────────────────────────────

describe('checkout — PIX path', () => {
  it('completes PIX checkout and navigates to order confirmation', async () => {
    _resetForTest([cartItem])
    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    // Fill customer
    await userEvent.type(screen.getByLabelText(/nome completo/i), 'Ana Lima')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'ana@example.com')
    await userEvent.type(screen.getByLabelText(/telefone/i), '(11) 91234-5678')

    // Fill address + calculate freight
    await userEvent.type(screen.getByLabelText(/cep/i), '01310100')
    await userEvent.click(screen.getByRole('button', { name: /calcular frete/i }))
    await screen.findByText(/estimativa de frete/i)

    await userEvent.type(screen.getByLabelText(/rua \/ avenida/i), 'Av. Paulista')
    await userEvent.type(screen.getByLabelText(/número/i), '1000')
    await userEvent.type(screen.getByLabelText(/bairro/i), 'Bela Vista')
    await userEvent.type(screen.getByLabelText(/cidade/i), 'São Paulo')
    await userEvent.type(screen.getByLabelText(/estado/i), 'SP')

    // PIX is default — submit
    await userEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    await waitFor(() => {
      expect(screen.getByText(/obrigada pela sua compra/i)).toBeInTheDocument()
    })

    // Estimated delivery disclosure must be visible
    expect(
      screen.getByText(/prazo de entrega é uma estimativa/i),
    ).toBeInTheDocument()
  })
})

// ── Card checkout flow ────────────────────────────────────────────────────────

describe('checkout — card path', () => {
  it('completes card checkout and does not persist card data', async () => {
    _resetForTest([cartItem])
    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    await userEvent.type(screen.getByLabelText(/nome completo/i), 'Ana Lima')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'ana@example.com')
    await userEvent.type(screen.getByLabelText(/telefone/i), '(11) 91234-5678')

    await userEvent.type(screen.getByLabelText(/cep/i), '01310100')
    await userEvent.click(screen.getByRole('button', { name: /calcular frete/i }))
    await screen.findByText(/estimativa de frete/i)

    await userEvent.type(screen.getByLabelText(/rua \/ avenida/i), 'Av. Paulista')
    await userEvent.type(screen.getByLabelText(/número/i), '1000')
    await userEvent.type(screen.getByLabelText(/bairro/i), 'Bela Vista')
    await userEvent.type(screen.getByLabelText(/cidade/i), 'São Paulo')
    await userEvent.type(screen.getByLabelText(/estado/i), 'SP')

    // Select card
    await userEvent.click(screen.getByRole('radio', { name: /cartão/i }))

    await userEvent.type(screen.getByLabelText(/nome no cartão/i), 'Ana Lima')
    await userEvent.type(
      screen.getByLabelText(/número do cartão/i),
      '4539 1488 0343 6467',
    )
    await userEvent.type(screen.getByLabelText(/validade/i), '12/99')
    await userEvent.type(screen.getByLabelText(/cvv/i), '123')

    await userEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    await waitFor(() => {
      expect(screen.getByText(/obrigada pela sua compra/i)).toBeInTheDocument()
    })

    // Confirm card data is not in sessionStorage
    const raw = sessionStorage.getItem('dona-toka:session-orders') ?? ''
    expect(raw).not.toContain('4539148803436467')
    expect(raw).not.toContain('123')
  })
})

// ── Unknown order route ───────────────────────────────────────────────────────

describe('/pedido/$orderId — unknown order', () => {
  it('renders not-found state for an unknown orderId', async () => {
    renderRoute('/pedido/unknown-order-xyz')
    await waitFor(() => {
      expect(screen.getByText(/pedido não encontrado/i)).toBeInTheDocument()
    })
  })
})
