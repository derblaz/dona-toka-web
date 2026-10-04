import { apiClient } from '@/lib/api-client'
import type { CatalogApiEnvelope, CatalogProductPayload, Product } from './models'

export interface CatalogRepository {
  getProducts(): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | undefined>
  getCollectionProducts(): Promise<Product[]>
}

function normalizeProduct(payload: CatalogProductPayload): Product {
  const galleryImageUrls = Array.from(
    new Set(
      (payload.galleryImageUrls ?? [])
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        .map((url) => url.trim()),
    ),
  )

  const mainImageUrl = typeof payload.mainImageUrl === 'string' && payload.mainImageUrl.trim().length > 0
    ? payload.mainImageUrl.trim()
    : galleryImageUrls[0] ?? ''

  return {
    id: payload.id,
    slug: payload.slug,
    name: payload.name,
    category: payload.category,
    description: payload.summary ?? payload.description ?? 'Produto disponível na coleção Dona Tôka.',
    priceCents: Number(payload.priceCents) || 0,
    active: Boolean(payload.active),
    mainImageUrl,
    galleryImageUrls: galleryImageUrls.length > 0 ? galleryImageUrls : mainImageUrl ? [mainImageUrl] : [],
  }
}

async function getProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<CatalogApiEnvelope<CatalogProductPayload[]>>('/api/v1/catalog/products')
  return (data.data ?? [])
    .map(normalizeProduct)
    .filter((product) => product.active)
}

async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (!slug || !slug.trim()) return undefined

  const products = await getProducts()
  return products.find((product) => product.slug === slug.trim())
}

async function getCollectionProducts(): Promise<Product[]> {
  return getProducts()
}

export const catalogRepository: CatalogRepository = {
  getProducts,
  getProductBySlug,
  getCollectionProducts,
}
