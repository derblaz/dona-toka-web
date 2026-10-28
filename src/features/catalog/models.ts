export interface ProductImage {
  src: string
  alt: string
  role: 'layout' | 'real-product'
  width: number
  height: number
}

export interface CatalogApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export interface CatalogProductPayload {
  id: string
  slug: string
  name: string
  category: string
  summary?: string
  description?: string
  priceCents: number
  active: boolean
  mainImageUrl?: string | null
  galleryImageUrls?: Array<string | null> | null
}

export interface Product {
  id: string
  slug: string
  name: string
  category: string
  description: string
  priceCents: number
  active: boolean
  mainImageUrl: string
  galleryImageUrls: string[]
}

/** Snapshot emitted when a visitor adds an item to the cart. */
export interface CartItemSnapshot {
  productId: string
  productName: string
  variantId: string
  variantName: string
  slug: string
  priceCents: number
  quantity: number
  image: ProductImage
}

export const ADD_TO_CART_EVENT = 'dona-toka:add-to-cart' as const

declare global {
  interface WindowEventMap {
    'dona-toka:add-to-cart': CustomEvent<CartItemSnapshot>
  }
}
