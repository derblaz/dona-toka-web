export interface ProductImage {
  src: string
  alt: string
  role: 'layout' | 'real-product'
  width: number
  height: number
}

export interface ProductVariant {
  id: string
  name: string
  slug: string
  priceCents: number
  images: ProductImage[]
  maxQuantity: number
}

export interface Product {
  id: string
  slug: string
  name: string
  category: 'toca-cirurgica' | 'gorro'
  description: string
  variants: ProductVariant[]
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
