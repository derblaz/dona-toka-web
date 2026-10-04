import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { catalogRepository } from '../repository'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('catalogRepository', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('maps backend catalog payloads to storefront products with main and gallery image data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Active products retrieved.',
        data: [
          {
            id: 'prod-1',
            slug: 'touca-classica',
            name: 'Touca Clássica',
            category: 'toca-cirurgica',
            summary: 'Touca confortável para uso diário.',
            priceCents: 5900,
            active: true,
            mainImageUrl: 'https://cdn.example.com/touca.jpg',
            galleryImageUrls: ['https://cdn.example.com/touca.jpg', 'https://cdn.example.com/touca-2.jpg'],
          },
        ],
      },
    })

    const products = await catalogRepository.getProducts()

    expect(products).toHaveLength(1)
    expect(products[0]).toMatchObject({
      id: 'prod-1',
      slug: 'touca-classica',
      name: 'Touca Clássica',
      description: 'Touca confortável para uso diário.',
      mainImageUrl: 'https://cdn.example.com/touca.jpg',
      galleryImageUrls: ['https://cdn.example.com/touca.jpg', 'https://cdn.example.com/touca-2.jpg'],
    })
  })

  it('resolves the correct product by slug from the backend feed', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Active products retrieved.',
        data: [
          { id: 'prod-1', slug: 'touca-classica', name: 'Touca Clássica', category: 'toca-cirurgica', summary: 'Touca', priceCents: 5900, active: true, mainImageUrl: 'https://cdn.example.com/touca.jpg', galleryImageUrls: ['https://cdn.example.com/touca.jpg'] },
          { id: 'prod-2', slug: 'gorro', name: 'Gorro', category: 'gorro', summary: 'Gorro', priceCents: 4200, active: true, mainImageUrl: 'https://cdn.example.com/gorro.jpg', galleryImageUrls: ['https://cdn.example.com/gorro.jpg'] },
        ],
      },
    })

    const product = await catalogRepository.getProductBySlug('gorro')

    expect(product).toBeDefined()
    expect(product?.id).toBe('prod-2')
    expect(product?.slug).toBe('gorro')
  })

  it('filters inactive products before rendering the storefront catalog', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Active products retrieved.',
        data: [
          { id: 'prod-1', slug: 'touca-classica', name: 'Touca Clássica', category: 'toca-cirurgica', summary: 'Touca', priceCents: 5900, active: true, mainImageUrl: 'https://cdn.example.com/touca.jpg', galleryImageUrls: ['https://cdn.example.com/touca.jpg', 'https://cdn.example.com/touca-2.jpg'] },
          { id: 'prod-2', slug: 'gorro', name: 'Gorro', category: 'gorro', summary: 'Gorro', priceCents: 4200, active: false, mainImageUrl: 'https://cdn.example.com/gorro.jpg', galleryImageUrls: ['https://cdn.example.com/gorro.jpg'] },
        ],
      },
    })

    const products = await catalogRepository.getProducts()
    expect(products).toHaveLength(1)
    expect(products[0].slug).toBe('touca-classica')
  })

  it('surfaces backend failures instead of using a local fallback catalog', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('offline'))

    await expect(catalogRepository.getProducts()).rejects.toThrow('offline')
    await expect(catalogRepository.getProductBySlug('toca-cirurgica')).rejects.toThrow('offline')
  })

  it('returns an empty list for failed or empty backend catalog responses', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Active products retrieved.',
        data: [],
      },
    })

    const products = await catalogRepository.getProducts()
    expect(products).toEqual([])
    expect(await catalogRepository.getCollectionProducts()).toEqual([])
  })
})
