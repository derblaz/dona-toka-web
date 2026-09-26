import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { ADD_TO_CART_EVENT } from '../models'
import type { CartItemSnapshot } from '../models'
import { catalogRepository } from '@/features/catalog/repository'

vi.mock('@/features/catalog/repository', () => ({
  catalogRepository: {
    getCollectionProducts: vi.fn(),
    getProductBySlug: vi.fn(),
    getProducts: vi.fn(),
  },
}))

function renderWithRouter(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  return render(<RouterProvider router={router} />)
}

describe('product detail page', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders product name, description and main image from the backend contract', async () => {
    vi.mocked(catalogRepository.getProductBySlug).mockResolvedValue({
      id: 'prod-1',
      slug: 'touca-classica',
      name: 'Touca Clássica',
      category: 'toca-cirurgica',
      description: 'Touca confortável para uso diário.',
      priceCents: 5900,
      active: true,
      mainImageUrl: 'https://cdn.example.com/touca.jpg',
      galleryImageUrls: ['https://cdn.example.com/touca.jpg', 'https://cdn.example.com/touca-2.jpg'],
    })

    renderWithRouter('/produto/touca-classica')

    expect(await screen.findByRole('heading', { name: /touca clássica/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/touca confortável para uso diário/i)).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /touca clássica/i }).length).toBeGreaterThan(0)
  })

  it('renders a not-found state for an unknown slug', async () => {
    vi.mocked(catalogRepository.getProductBySlug).mockResolvedValue(undefined)

    renderWithRouter('/produto/produto-que-nao-existe')

    expect(await screen.findByRole('heading', { name: /produto não encontrado/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver coleção/i })).toBeInTheDocument()
  })

  it('renders an unavailable state when the backend product is inactive', async () => {
    vi.mocked(catalogRepository.getProductBySlug).mockResolvedValue({
      id: 'prod-2',
      slug: 'gorro',
      name: 'Gorro',
      category: 'gorro',
      description: 'Gorro artesanal.',
      priceCents: 4200,
      active: false,
      mainImageUrl: 'https://cdn.example.com/gorro.jpg',
      galleryImageUrls: ['https://cdn.example.com/gorro.jpg'],
    })

    renderWithRouter('/produto/gorro')

    expect(await screen.findByRole('heading', { name: /produto indisponível/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver coleção/i })).toBeInTheDocument()
  })

  it('renders a safe empty state when main product media is missing', async () => {
    vi.mocked(catalogRepository.getProductBySlug).mockResolvedValue({
      id: 'prod-3',
      slug: 'produto-sem-imagem',
      name: 'Produto sem imagem',
      category: 'toca-cirurgica',
      description: 'Produto sem mídia disponível.',
      priceCents: 1200,
      active: true,
      mainImageUrl: '',
      galleryImageUrls: [],
    })

    renderWithRouter('/produto/produto-sem-imagem')

    expect(await screen.findByRole('heading', { name: /produto sem imagem/i })).toBeInTheDocument()
    expect(screen.getByText(/imagem indisponível/i)).toBeInTheDocument()
  })

  it('renders price and installment message from the product contract', async () => {
    vi.mocked(catalogRepository.getProductBySlug).mockResolvedValue({
      id: 'prod-1',
      slug: 'touca-classica',
      name: 'Touca Clássica',
      category: 'toca-cirurgica',
      description: 'Touca confortável para uso diário.',
      priceCents: 5900,
      active: true,
      mainImageUrl: 'https://cdn.example.com/touca.jpg',
      galleryImageUrls: ['https://cdn.example.com/touca.jpg'],
    })

    renderWithRouter('/produto/touca-classica')

    await screen.findByRole('heading', { name: /touca clássica/i })
    expect(screen.getAllByText(/R\$/).length).toBeGreaterThan(0)
    expect(screen.getByText(/3x de/i)).toBeInTheDocument()
  })

  it('renders the gallery image selector for product media', async () => {
    vi.mocked(catalogRepository.getProductBySlug).mockResolvedValue({
      id: 'prod-1',
      slug: 'touca-classica',
      name: 'Touca Clássica',
      category: 'toca-cirurgica',
      description: 'Touca confortável para uso diário.',
      priceCents: 5900,
      active: true,
      mainImageUrl: 'https://cdn.example.com/touca.jpg',
      galleryImageUrls: ['https://cdn.example.com/touca.jpg', 'https://cdn.example.com/touca-2.jpg'],
    })

    renderWithRouter('/produto/touca-classica')

    await screen.findByRole('heading', { name: /touca clássica/i })
    expect(screen.getAllByRole('button', { name: /ver imagem/i }).length).toBeGreaterThan(0)
  })

  it('dispatches the add-to-cart event using the backend product payload', async () => {
    const user = userEvent.setup()
    const dispatchSpy = vi.fn()
    vi.mocked(catalogRepository.getProductBySlug).mockResolvedValue({
      id: 'prod-1',
      slug: 'touca-classica',
      name: 'Touca Clássica',
      category: 'toca-cirurgica',
      description: 'Touca confortável para uso diário.',
      priceCents: 5900,
      active: true,
      mainImageUrl: 'https://cdn.example.com/touca.jpg',
      galleryImageUrls: ['https://cdn.example.com/touca.jpg'],
    })

    window.addEventListener(ADD_TO_CART_EVENT, dispatchSpy)
    renderWithRouter('/produto/touca-classica')

    await screen.findByRole('heading', { name: /touca clássica/i })
    await user.click(screen.getByRole('button', { name: /adicionar ao carrinho/i }))

    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent<CartItemSnapshot>
    const snapshot = event.detail
    expect(snapshot.productId).toBe('prod-1')
    expect(snapshot.variantId).toBe('prod-1')
    expect(snapshot.quantity).toBe(1)
    expect(snapshot.priceCents).toBe(5900)
    expect(snapshot.image.src).toBe('https://cdn.example.com/touca.jpg')

    window.removeEventListener(ADD_TO_CART_EVENT, dispatchSpy)
  })

  it('supports quantity increment and validation for the simplified product model', async () => {
    const user = userEvent.setup()
    vi.mocked(catalogRepository.getProductBySlug).mockResolvedValue({
      id: 'prod-1',
      slug: 'touca-classica',
      name: 'Touca Clássica',
      category: 'toca-cirurgica',
      description: 'Touca confortável para uso diário.',
      priceCents: 5900,
      active: true,
      mainImageUrl: 'https://cdn.example.com/touca.jpg',
      galleryImageUrls: ['https://cdn.example.com/touca.jpg'],
    })

    renderWithRouter('/produto/touca-classica')

    await screen.findByRole('heading', { name: /touca clássica/i })
    await user.click(screen.getByRole('button', { name: /aumentar quantidade/i }))
    await user.click(screen.getByRole('button', { name: /aumentar quantidade/i }))
    expect(screen.getByRole('spinbutton', { name: /quantidade/i })).toHaveValue(3)

    fireEvent.change(screen.getByRole('spinbutton', { name: /quantidade/i }), { target: { value: '0', valueAsNumber: 0 } })
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
