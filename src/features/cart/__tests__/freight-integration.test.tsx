import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { _resetForTest } from '@/features/cart/store'
import type { CartItem } from '@/features/cart/models'
import { apiClient } from '@/lib/api-client'
import { catalogRepository } from '@/features/catalog/repository'

vi.mock('@/features/catalog/repository', () => ({
  catalogRepository: {
    getCollectionProducts: vi.fn(),
    getProductBySlug: vi.fn(),
    getProducts: vi.fn(),
  },
}))

const mockImage = {
  src: '/img/toca.jpg',
  alt: 'Touca cirúrgica lisa',
  role: 'real-product' as const,
  width: 800,
  height: 800,
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

function renderCart() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/carrinho'] }),
  })
  return render(<RouterProvider router={router} />)
}

function renderProductDetail(slug = 'toca-cirurgica') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/produto/${slug}`] }),
  })
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  localStorage.clear()
  _resetForTest()
  vi.restoreAllMocks()
})

// ─── Cart freight integration ──────────────────────────────────────────────

describe('Cart freight estimator', () => {
  it('shows freight and estimated days after entering a valid CEP', async () => {
    const user = userEvent.setup()
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        options: [{ serviceCode: '1', carrierName: 'PAC', priceCents: 1590, estimatedDays: 7 }],
        freeShippingApplied: false,
        subtotalCents: 4500,
      },
    })
    _resetForTest([makeCartItem()])
    renderCart()

    await screen.findByText('Touca Cirúrgica')

    const cepInput = screen.getByLabelText(/cep para estimativa de frete/i)
    await user.type(cepInput, '01310100')
    await user.click(screen.getByRole('button', { name: /calcular/i }))

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/dias úteis/i)).toBeInTheDocument()
  })

  it('shows an error and does not change cart items when an invalid CEP is entered', async () => {
    const user = userEvent.setup()
    _resetForTest([makeCartItem()])
    renderCart()

    await screen.findByText('Touca Cirúrgica')

    const cepInput = screen.getByLabelText(/cep para estimativa de frete/i)
    await user.type(cepInput, '123')
    await user.click(screen.getByRole('button', { name: /calcular/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/inválido/i)
    expect(screen.getByText('Touca Cirúrgica')).toBeInTheDocument()
  })

  it('shows a backend error when freight calculation fails for a valid CEP', async () => {
    const user = userEvent.setup()
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('offline'))
    _resetForTest([makeCartItem()])
    renderCart()

    await screen.findByText('Touca Cirúrgica')

    const cepInput = screen.getByLabelText(/cep para estimativa de frete/i)
    await user.type(cepInput, '01310100')
    await user.click(screen.getByRole('button', { name: /calcular/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível calcular o frete/i)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('updates the total display to include freight when a valid CEP is provided', async () => {
    const user = userEvent.setup()
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        options: [{ serviceCode: '1', carrierName: 'PAC', priceCents: 1590, estimatedDays: 7 }],
        freeShippingApplied: false,
        subtotalCents: 4500,
      },
    })
    _resetForTest([makeCartItem({ priceCents: 4500 })])
    renderCart()

    await screen.findByText('Touca Cirúrgica')

    const summary = screen.getByRole('complementary', { name: /resumo do pedido/i })
    expect(within(summary).getByText('Total estimado')).toBeInTheDocument()

    const cepInput = screen.getByLabelText(/cep para estimativa de frete/i)
    await user.type(cepInput, '01310100')
    await user.click(screen.getByRole('button', { name: /calcular/i }))

    await screen.findByRole('status')
    expect(within(summary).getByText(/60,90/)).toBeInTheDocument()
  })

  it('shows free shipping when subtotal meets the threshold', async () => {
    const user = userEvent.setup()
    const freeShippingThresholdCents = 29900
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        options: [{ serviceCode: '1', carrierName: 'PAC', priceCents: 0, estimatedDays: 7 }],
        freeShippingApplied: true,
        subtotalCents: freeShippingThresholdCents,
      },
    })
    const unitPrice = freeShippingThresholdCents
    _resetForTest([makeCartItem({ priceCents: unitPrice, quantity: 1 })])
    renderCart()

    await screen.findByText('Touca Cirúrgica')

    const cepInput = screen.getByLabelText(/cep para estimativa de frete/i)
    await user.type(cepInput, '01310100')
    await user.click(screen.getByRole('button', { name: /calcular/i }))

    await screen.findByRole('status')
    expect(screen.getAllByText('Grátis').length).toBeGreaterThan(0)
  })
})

// ─── Product detail freight integration ────────────────────────────────────

describe('Product detail freight estimator', () => {
  it('can estimate freight on the product detail page without adding the item to the cart', async () => {
    const user = userEvent.setup()
    vi.mocked(catalogRepository.getProductBySlug).mockResolvedValue({
      id: 'prod-1',
      slug: 'toca-cirurgica',
      name: 'Touca Cirúrgica',
      category: 'toca-cirurgica',
      description: 'Touca confortável para uso diário.',
      priceCents: 4500,
      active: true,
      mainImageUrl: 'https://cdn.example.com/touca.jpg',
      galleryImageUrls: ['https://cdn.example.com/touca.jpg'],
    })
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        options: [{ serviceCode: '1', carrierName: 'PAC', priceCents: 1590, estimatedDays: 7 }],
        freeShippingApplied: false,
        subtotalCents: 4500,
      },
    })
    renderProductDetail('toca-cirurgica')

    await screen.findByRole('button', { name: /adicionar ao carrinho/i })

    const cepInput = screen.getByLabelText(/cep para estimativa de frete/i)
    await user.type(cepInput, '01310100')
    await user.click(screen.getByRole('button', { name: /calcular/i }))

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/dias úteis/i)).toBeInTheDocument()

    const header = screen.getByRole('banner')
    expect(within(header).queryByRole('link', { name: /carrinho, \d+ item/i })).not.toBeInTheDocument()
  })
})
