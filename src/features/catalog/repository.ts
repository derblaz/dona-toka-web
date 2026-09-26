import { apiClient } from '@/lib/api-client'
import type { CatalogApiEnvelope, CatalogProductPayload, Product } from './models'

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'toca-cirurgica',
    slug: 'toca-cirurgica',
    name: 'Touca Cirúrgica',
    category: 'toca-cirurgica',
    description: 'Touca cirúrgica artesanal com tecido respirável e ajuste confortável.',
    priceCents: 4500,
    active: true,
    mainImageUrl: '/hero-modelo.png',
    galleryImageUrls: ['/hero-modelo.png', '/logo-dona-toka.png'],
  },
  {
    id: 'gorro',
    slug: 'gorro',
    name: 'Gorro',
    category: 'gorro',
    description: 'Gorro confortável e elegante, feito com tecido de qualidade.',
    priceCents: 4200,
    active: true,
    mainImageUrl: '/hero-modelo.png',
    galleryImageUrls: ['/hero-modelo.png'],
  },
]

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
  try {
    const { data } = await apiClient.get<CatalogApiEnvelope<CatalogProductPayload[]>>('/api/v1/catalog/products')
    return (data.data ?? [])
      .map(normalizeProduct)
      .filter((product) => product.active)
  } catch {
    return FALLBACK_PRODUCTS
  }
}

async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (!slug || !slug.trim()) return undefined

  try {
    const products = await getProducts()
    return products.find((product) => product.slug === slug.trim())
  } catch {
    return FALLBACK_PRODUCTS.find((product) => product.slug === slug.trim())
  }
}

async function getCollectionProducts(): Promise<Product[]> {
  return getProducts()
}

export const catalogRepository: CatalogRepository = {
  getProducts,
  getProductBySlug,
  getCollectionProducts,
}
