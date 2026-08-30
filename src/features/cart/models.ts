import type { ProductImage } from '@/features/catalog/models'

export const CART_SCHEMA_VERSION = 1 as const

export interface CartItem {
  productId: string
  variantId: string
  productName: string
  variantName: string
  slug: string
  priceCents: number
  quantity: number
  image: ProductImage
}

export interface PersistedCart {
  version: typeof CART_SCHEMA_VERSION
  items: CartItem[]
}
