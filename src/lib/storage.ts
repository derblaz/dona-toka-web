import { z } from 'zod'
import { CART_SCHEMA_VERSION } from '@/features/cart/models'
import type { CartItem } from '@/features/cart/models'

const CART_KEY = 'dona-toka:cart'

const productImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  role: z.enum(['layout', 'real-product']),
  width: z.number(),
  height: z.number(),
})

const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  productName: z.string(),
  variantName: z.string(),
  slug: z.string(),
  priceCents: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
  image: productImageSchema,
})

const persistedCartSchema = z.object({
  version: z.literal(CART_SCHEMA_VERSION),
  items: z.array(cartItemSchema),
})

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    const result = persistedCartSchema.safeParse(parsed)
    if (result.success) return result.data.items
    return []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  try {
    const payload = { version: CART_SCHEMA_VERSION, items }
    localStorage.setItem(CART_KEY, JSON.stringify(payload))
  } catch {
    // localStorage may be unavailable in private browsing with full quota
  }
}

export function clearCartStorage(): void {
  try {
    localStorage.removeItem(CART_KEY)
  } catch {
    // ignore
  }
}
