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
            galleryImages: [
              { id: 'img-1', location: 'https://cdn.example.com/touca.jpg', checksum: 'sha-1' },
              { id: 'img-2', location: 'https://cdn.example.com/touca-2.jpg', checksum: 'sha-2' },
            ],
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

  it('preserves gallery order from the API and uses the first image as cover', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Active products retrieved.',
        data: [
          {
            id: 'prod-1', slug: 'touca', name: 'Touca', category: 'toca', summary: 'Touca', priceCents: 5900, active: true,
            galleryImages: [
              { id: 'img-b', location: 'https://cdn.example.com/b.jpg', checksum: 'sha-b' },
              { id: 'img-a', location: 'https://cdn.example.com/a.jpg', checksum: 'sha-a' },
              { id: 'img-c', location: 'https://cdn.example.com/c.jpg', checksum: 'sha-c' },
            ],
          },
        ],
      },
    })

    const [product] = await catalogRepository.getProducts()

    expect(product.galleryImageUrls).toEqual([
      'https://cdn.example.com/b.jpg',
      'https://cdn.example.com/a.jpg',
      'https://cdn.example.com/c.jpg',
    ])
    expect(product.mainImageUrl).toBe('https://cdn.example.com/b.jpg')
  })

  it('keeps absolute local and OCI locations as-is without provider branching', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Active products retrieved.',
        data: [
          {
            id: 'prod-1', slug: 'touca', name: 'Touca', category: 'toca', summary: 'Touca', priceCents: 5900, active: true,
            galleryImages: [
              { id: 'img-1', location: 'http://localhost:8080/media/touca.jpg', checksum: 'sha-1' },
              { id: 'img-2', location: 'https://objectstorage.example.com/bucket/touca-2.jpg', checksum: 'sha-2' },
            ],
          },
        ],
      },
    })

    const [product] = await catalogRepository.getProducts()

    expect(product.galleryImageUrls).toEqual([
      'http://localhost:8080/media/touca.jpg',
      'https://objectstorage.example.com/bucket/touca-2.jpg',
    ])
    expect(product.mainImageUrl).toBe('http://localhost:8080/media/touca.jpg')
  })

  it('maps a product without images to an empty cover and gallery without synthesizing URLs', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Active products retrieved.',
        data: [
          { id: 'prod-1', slug: 'touca', name: 'Touca', category: 'toca', summary: 'Touca', priceCents: 5900, active: true, galleryImages: [] },
          { id: 'prod-2', slug: 'gorro', name: 'Gorro', category: 'gorro', summary: 'Gorro', priceCents: 4200, active: true },
          { id: 'prod-3', slug: 'boina', name: 'Boina', category: 'boina', summary: 'Boina', priceCents: 3900, active: true, galleryImages: null },
        ],
      },
    })

    const products = await catalogRepository.getProducts()

    expect(products[0]).toMatchObject({ mainImageUrl: '', galleryImageUrls: [] })
    expect(products[1]).toMatchObject({ mainImageUrl: '', galleryImageUrls: [] })
    expect(products[2]).toMatchObject({ mainImageUrl: '', galleryImageUrls: [] })
  })

  it('resolves the correct product by slug from the backend feed', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Active products retrieved.',
        data: [
          { id: 'prod-1', slug: 'touca-classica', name: 'Touca Clássica', category: 'toca-cirurgica', summary: 'Touca', priceCents: 5900, active: true, galleryImages: [{ id: 'img-1', location: 'https://cdn.example.com/touca.jpg', checksum: 'sha' }] },
          { id: 'prod-2', slug: 'gorro', name: 'Gorro', category: 'gorro', summary: 'Gorro', priceCents: 4200, active: true, galleryImages: [{ id: 'img-1', location: 'https://cdn.example.com/gorro.jpg', checksum: 'sha' }] },
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
          { id: 'prod-1', slug: 'touca-classica', name: 'Touca Clássica', category: 'toca-cirurgica', summary: 'Touca', priceCents: 5900, active: true, galleryImages: [{ id: 'img-1', location: 'https://cdn.example.com/touca.jpg', checksum: 'sha-1' }, { id: 'img-2', location: 'https://cdn.example.com/touca-2.jpg', checksum: 'sha-2' }] },
          { id: 'prod-2', slug: 'gorro', name: 'Gorro', category: 'gorro', summary: 'Gorro', priceCents: 4200, active: false, galleryImages: [{ id: 'img-1', location: 'https://cdn.example.com/gorro.jpg', checksum: 'sha' }] },
        ],
      },
    })

    const products = await catalogRepository.getProducts()
    expect(products).toHaveLength(1)
    expect(products[0].slug).toBe('touca-classica')
  })

  it('does not resolve a deactivated product by slug', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Active products retrieved.',
        data: [
          { id: 'prod-2', slug: 'gorro', name: 'Gorro', category: 'gorro', summary: 'Gorro', priceCents: 4200, active: false, galleryImages: [{ id: 'img-1', location: 'https://cdn.example.com/gorro.jpg', checksum: 'sha' }] },
        ],
      },
    })

    expect(await catalogRepository.getProductBySlug('gorro')).toBeUndefined()
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
