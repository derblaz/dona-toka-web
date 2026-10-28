import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { routeTree } from '@/routeTree.gen'
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

describe('ProductCard integration', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders product cards from the backend catalog feed', async () => {
    vi.mocked(catalogRepository.getCollectionProducts).mockResolvedValue([
      {
        id: 'prod-1',
        slug: 'touca-classica',
        name: 'Touca Clássica',
        category: 'toca-cirurgica',
        description: 'Touca confortável para uso diário.',
        priceCents: 5900,
        active: true,
        mainImageUrl: 'https://cdn.example.com/touca.jpg',
        galleryImageUrls: ['https://cdn.example.com/touca.jpg'],
      },
      {
        id: 'prod-2',
        slug: 'gorro',
        name: 'Gorro',
        category: 'gorro',
        description: 'Gorro artesanal.',
        priceCents: 4200,
        active: true,
        mainImageUrl: 'https://cdn.example.com/gorro.jpg',
        galleryImageUrls: ['https://cdn.example.com/gorro.jpg'],
      },
    ])

    renderWithRouter('/colecao')

    expect(await screen.findByRole('heading', { name: /coleção/i })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /touca clássica/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /gorro/i })).toBeInTheDocument()
  })

  it('renders product detail links for each catalog item', async () => {
    vi.mocked(catalogRepository.getCollectionProducts).mockResolvedValue([
      { id: 'prod-1', slug: 'touca-classica', name: 'Touca Clássica', category: 'toca-cirurgica', description: 'Touca', priceCents: 5900, active: true, mainImageUrl: 'https://cdn.example.com/touca.jpg', galleryImageUrls: ['https://cdn.example.com/touca.jpg'] },
    ])

    renderWithRouter('/colecao')

    expect(await screen.findByRole('link', { name: /ver detalhes de touca clássica/i })).toHaveAttribute('href', '/produto/touca-classica')
  })
})
