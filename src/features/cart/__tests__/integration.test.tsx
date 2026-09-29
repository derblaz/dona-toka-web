import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, it, expect, beforeEach } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { _resetForTest, addItem } from '@/features/cart/store'
import { loadCart, saveCart } from '@/lib/storage'
import { ADD_TO_CART_EVENT } from '@/features/catalog/models'
import type { CartItemSnapshot } from '@/features/catalog/models'
import type { CartItem } from '@/features/cart/models'

const mockImage = {
  src: '/img/toca.jpg',
  alt: 'Touca cirúrgica lisa',
  role: 'real-product' as const,
  width: 800,
  height: 800,
}

function makeSnapshot(overrides?: Partial<CartItemSnapshot>): CartItemSnapshot {
  return {
    productId: 'toca-cirurgica',
    productName: 'Touca Cirúrgica',
    variantId: 'toca-lisa',
    variantName: 'Lisa',
    slug: 'toca-cirurgica',
    priceCents: 4500,
    quantity: 1,
    image: mockImage,
    ...overrides,
  }
}

function makeCartItem(overrides?: Partial<CartItem>): CartItem {
  return {
    productId: 'toca-cirurgica',
    productName: 'Touca Cirúrgica',
    variantId: 'toca-lisa',
    variantName: 'Lisa',
    slug: 'toca-cirurgica',
    priceCents: 4500,
    quantity: 1,
    image: mockImage,
    ...overrides,
  }
}

function renderApp(path = '/') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  localStorage.clear()
  _resetForTest()
})

// ─── ADD_TO_CART_EVENT integration ────────────────────────────────────────────

describe('ADD_TO_CART_EVENT integration', () => {
  it('dispatching the event adds the item to the cart route and updates the shell counter', async () => {
    renderApp('/carrinho')

    // Initially empty
    expect(await screen.findByRole('heading', { name: /seu carrinho está vazio/i })).toBeInTheDocument()

    // Dispatch add-to-cart event (simulates ProductDetail action)
    window.dispatchEvent(new CustomEvent(ADD_TO_CART_EVENT, { detail: makeSnapshot() }))

    // Item appears in the cart route
    expect(await screen.findByText('Touca Cirúrgica')).toBeInTheDocument()
    expect(screen.getByText('Lisa')).toBeInTheDocument()

    // Cart counter in header shell reflects 1 item
    const header = screen.getByRole('banner')
    expect(within(header).getByRole('link', { name: /carrinho, 1 item/i })).toBeInTheDocument()
  })

  it('dispatching the event twice for the same variant merges quantities in the cart route', async () => {
    renderApp('/carrinho')
    await screen.findByRole('heading', { name: /seu carrinho está vazio/i })

    window.dispatchEvent(new CustomEvent(ADD_TO_CART_EVENT, { detail: makeSnapshot({ quantity: 2 }) }))
    window.dispatchEvent(new CustomEvent(ADD_TO_CART_EVENT, { detail: makeSnapshot({ quantity: 3 }) }))

    expect(await screen.findByText('Touca Cirúrgica')).toBeInTheDocument()

    const header = screen.getByRole('banner')
    expect(within(header).getByRole('link', { name: /carrinho, 5 itens/i })).toBeInTheDocument()
  })
})

// ─── Hydration (simulated refresh) ───────────────────────────────────────────

describe('cart hydration from localStorage', () => {
  it('restores items and quantity from a valid localStorage payload after page load', async () => {
    // Seed localStorage (simulates data saved before page reload)
    saveCart([makeCartItem({ quantity: 3 })])
    // Simulate module re-initialization (hydration) by seeding store from loadCart()
    _resetForTest(loadCart())

    renderApp('/carrinho')

    expect(await screen.findByText('Touca Cirúrgica')).toBeInTheDocument()
    expect(screen.getByText('Lisa')).toBeInTheDocument()
    // Quantity display should show 3
    expect(screen.getByLabelText('Quantidade: 3')).toBeInTheDocument()
  })

  it('shows empty-cart state when localStorage payload is malformed', async () => {
    localStorage.setItem('dona-toka:cart', '{bad json}')
    _resetForTest(loadCart()) // loadCart discards malformed payload → empty

    renderApp('/carrinho')

    expect(await screen.findByRole('heading', { name: /seu carrinho está vazio/i })).toBeInTheDocument()
  })

  it('shows empty-cart state when localStorage payload has a stale version', async () => {
    localStorage.setItem('dona-toka:cart', JSON.stringify({ version: 0, items: [makeCartItem()] }))
    _resetForTest(loadCart()) // loadCart discards stale version → empty

    renderApp('/carrinho')

    expect(await screen.findByRole('heading', { name: /seu carrinho está vazio/i })).toBeInTheDocument()
  })
})

// ─── Cart editing ─────────────────────────────────────────────────────────────

describe('cart route editing', () => {
  it('removing the last item renders the empty-cart state', async () => {
    const user = userEvent.setup()
    _resetForTest([makeCartItem()])

    renderApp('/carrinho')

    const removeBtn = await screen.findByRole('button', { name: /remover touca cirúrgica/i })
    await user.click(removeBtn)

    expect(await screen.findByRole('heading', { name: /seu carrinho está vazio/i })).toBeInTheDocument()
  })

  it('removing the last item hides the checkout CTA', async () => {
    const user = userEvent.setup()
    _resetForTest([makeCartItem()])

    renderApp('/carrinho')

    expect(await screen.findByRole('link', { name: /finalizar pedido/i })).toBeInTheDocument()

    const removeBtn = screen.getByRole('button', { name: /remover touca cirúrgica/i })
    await user.click(removeBtn)

    await screen.findByRole('heading', { name: /seu carrinho está vazio/i })
    expect(screen.queryByRole('link', { name: /finalizar pedido/i })).not.toBeInTheDocument()
  })

  it('clearing the cart via the clear button renders the empty-cart state', async () => {
    const user = userEvent.setup()
    _resetForTest([makeCartItem(), makeCartItem({ variantId: 'toca-estampada', variantName: 'Estampada' })])

    renderApp('/carrinho')

    const clearBtn = await screen.findByRole('button', { name: /limpar carrinho/i })
    await user.click(clearBtn)

    expect(await screen.findByRole('heading', { name: /seu carrinho está vazio/i })).toBeInTheDocument()
  })

  it('incrementing quantity updates the line item display', async () => {
    const user = userEvent.setup()
    _resetForTest([makeCartItem({ quantity: 1 })])

    renderApp('/carrinho')

    await screen.findByText('Touca Cirúrgica')
    const incBtn = screen.getByRole('button', { name: /aumentar quantidade/i })
    await user.click(incBtn)

    expect(screen.getByLabelText('Quantidade: 2')).toBeInTheDocument()
  })
})

// ─── Empty-cart navigation ────────────────────────────────────────────────────

describe('empty-cart state', () => {
  it('shows a link to the collection when cart is empty', async () => {
    renderApp('/carrinho')

    expect(await screen.findByRole('link', { name: /ver coleção/i })).toBeInTheDocument()
  })
})

// ─── Subtotal display ─────────────────────────────────────────────────────────

describe('cart subtotal and total display', () => {
  it('shows subtotal in the order summary in Brazilian Real format', async () => {
    _resetForTest([makeCartItem({ priceCents: 4500, quantity: 2 })])

    renderApp('/carrinho')

    await screen.findByText('Touca Cirúrgica')

    // The order summary aside displays both the subtotal label and the value
    const summary = screen.getByRole('complementary', { name: /resumo do pedido/i })
    // R$ 90,00 = 4500 * 2 centavos
    expect(within(summary).getAllByText(/90,00/).length).toBeGreaterThanOrEqual(1)
  })
})
