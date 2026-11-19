import { act, render, screen, waitFor } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { apiClient } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

function productPayload(name: string, active = true) {
  return {
    id: 'prod-1',
    slug: 'touca-classica',
    name,
    category: 'toca-cirurgica',
    summary: 'Touca confortável.',
    priceCents: 5900,
    active,
    galleryImages: [{ id: 'img-1', location: 'https://cdn.example.com/touca.jpg', checksum: 'sha-1' }],
  }
}

function catalogResponse(products: ReturnType<typeof productPayload>[]) {
  return { data: { success: true, message: 'Active products retrieved.', data: products } }
}

describe('storefront catalog revalidation', () => {
  beforeEach(() => {
    queryClient.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('refetches the public catalog when window focus returns to the collection route', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(catalogResponse([productPayload('Touca Clássica')]))
      .mockResolvedValueOnce(catalogResponse([productPayload('Touca Clássica Atualizada')]))

    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/colecao'] }) })
    render(<RouterProvider router={router} />)

    expect(await screen.findByText('Touca Clássica')).toBeInTheDocument()
    expect(apiClient.get).toHaveBeenCalledTimes(1)

    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(await screen.findByText('Touca Clássica Atualizada')).toBeInTheDocument()
    expect(apiClient.get).toHaveBeenCalledTimes(2)
  })

  it('does not resolve a product detail page for a product deactivated after the feed changed', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      catalogResponse([productPayload('Touca Clássica', false)]),
    )

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/produto/touca-classica'] }),
    })
    render(<RouterProvider router={router} />)

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled())
    expect(await screen.findByRole('heading', { name: /produto não encontrado/i })).toBeInTheDocument()
  })
});
