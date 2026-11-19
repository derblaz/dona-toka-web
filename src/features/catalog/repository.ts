import { apiClient } from '@/lib/api-client'
import type { CatalogApiEnvelope, CatalogProductPayload, Product } from './models'

export interface CatalogRepository {
  getProducts(): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | undefined>
  getCollectionProducts(): Promise<Product[]>
}

function normalizeProduct(payload: CatalogProductPayload): Product {
  const galleryImageUrls = (payload.galleryImages ?? []).map((image) => image.location)
  const mainImageUrl = galleryImageUrls[0] ?? ''

  return {
    id: payload.id,
    slug: payload.slug,
    name: payload.name,
    category: payload.category,
    description: payload.summary ?? payload.description ?? 'Produto disponível na coleção Dona Tôka.',
    priceCents: Number(payload.priceCents) || 0,
    active: Boolean(payload.active),
    mainImageUrl,
    galleryImageUrls,
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
