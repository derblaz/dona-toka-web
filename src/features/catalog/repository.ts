import type { Product } from './models'
import { CATALOG_SEED } from './seed'

export interface CatalogRepository {
  getProducts(): Product[]
  getProductBySlug(slug: string): Product | undefined
  getCollectionProducts(): Product[]
}

function getProducts(): Product[] {
  return CATALOG_SEED
}

function getProductBySlug(slug: string): Product | undefined {
  return CATALOG_SEED.find((p) => p.slug === slug)
}

function getCollectionProducts(): Product[] {
  return CATALOG_SEED
}

export const catalogRepository: CatalogRepository = {
  getProducts,
  getProductBySlug,
  getCollectionProducts,
}
