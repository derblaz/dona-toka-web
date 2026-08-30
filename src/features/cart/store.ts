import { loadCart, saveCart } from '@/lib/storage'
import { MAX_QUANTITY, MIN_QUANTITY } from '@/features/catalog/validation'
import type { CartItem } from './models'
import type { CartItemSnapshot } from '@/features/catalog/models'

let items: CartItem[] = loadCart()
const listeners = new Set<() => void>()

function notify(): void {
  saveCart(items)
  listeners.forEach((fn) => fn())
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getItems(): CartItem[] {
  return items
}

export function getItemCount(): number {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}

export function getSubtotalCents(): number {
  return items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)
}

/** Phase 1: total equals subtotal; task_05 freight is added at checkout time. */
export function getTotalCents(): number {
  return getSubtotalCents()
}

export function addItem(snapshot: CartItemSnapshot): void {
  const existing = items.find(
    (i) => i.productId === snapshot.productId && i.variantId === snapshot.variantId,
  )
  if (existing) {
    const merged = Math.min(existing.quantity + snapshot.quantity, MAX_QUANTITY)
    items = items.map((i) =>
      i.productId === snapshot.productId && i.variantId === snapshot.variantId
        ? { ...i, quantity: merged }
        : i,
    )
  } else {
    items = [
      ...items,
      {
        productId: snapshot.productId,
        variantId: snapshot.variantId,
        productName: snapshot.productName,
        variantName: snapshot.variantName,
        slug: snapshot.slug,
        priceCents: snapshot.priceCents,
        quantity: snapshot.quantity,
        image: snapshot.image,
      },
    ]
  }
  notify()
}

export function updateQuantity(productId: string, variantId: string, quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) return
  items = items.map((i) =>
    i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i,
  )
  notify()
}

export function removeItem(productId: string, variantId: string): void {
  items = items.filter((i) => !(i.productId === productId && i.variantId === variantId))
  notify()
}

export function clearCart(): void {
  items = []
  notify()
}

/** Test-only: reset store state to avoid cross-test contamination. */
export function _resetForTest(seed: CartItem[] = []): void {
  items = seed
  listeners.clear()
}
