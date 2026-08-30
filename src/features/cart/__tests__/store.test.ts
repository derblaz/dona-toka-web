import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as cartStore from '../store'
import { loadCart, saveCart } from '@/lib/storage'
import { CART_SCHEMA_VERSION } from '../models'
import type { CartItemSnapshot } from '@/features/catalog/models'
import type { CartItem } from '../models'

const mockImage = {
  src: '/img/toca.jpg',
  alt: 'Touca cirúrgica lisa',
  role: 'real-product' as const,
  width: 800,
  height: 800,
}

function makeSnapshot(overrides?: Partial<CartItemSnapshot>): CartItemSnapshot {
  return {
    productId: 'toca-cirurgica',
    productName: 'Touca Cirúrgica',
    variantId: 'toca-lisa',
    variantName: 'Lisa',
    slug: 'toca-cirurgica',
    priceCents: 4500,
    quantity: 1,
    image: mockImage,
    ...overrides,
  }
}

function makeCartItem(overrides?: Partial<CartItem>): CartItem {
  return {
    productId: 'toca-cirurgica',
    productName: 'Touca Cirúrgica',
    variantId: 'toca-lisa',
    variantName: 'Lisa',
    slug: 'toca-cirurgica',
    priceCents: 4500,
    quantity: 1,
    image: mockImage,
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
  cartStore._resetForTest()
})

// ─── addItem ─────────────────────────────────────────────────────────────────

describe('addItem', () => {
  it('adds a new item to an empty cart', () => {
    cartStore.addItem(makeSnapshot())
    expect(cartStore.getItems()).toHaveLength(1)
    expect(cartStore.getItems()[0].variantId).toBe('toca-lisa')
  })

  it('merges quantity when the same product and variant is added again', () => {
    cartStore.addItem(makeSnapshot({ quantity: 3 }))
    cartStore.addItem(makeSnapshot({ quantity: 2 }))
    const items = cartStore.getItems()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(5)
  })

  it('preserves the product and variant snapshot on add', () => {
    cartStore.addItem(makeSnapshot())
    const item = cartStore.getItems()[0]
    expect(item.productId).toBe('toca-cirurgica')
    expect(item.variantId).toBe('toca-lisa')
    expect(item.productName).toBe('Touca Cirúrgica')
    expect(item.variantName).toBe('Lisa')
    expect(item.priceCents).toBe(4500)
    expect(item.image).toEqual(mockImage)
  })

  it('caps merged quantity at MAX_QUANTITY (10)', () => {
    cartStore.addItem(makeSnapshot({ quantity: 8 }))
    cartStore.addItem(makeSnapshot({ quantity: 5 }))
    expect(cartStore.getItems()[0].quantity).toBe(10)
  })

  it('treats different variants of the same product as separate items', () => {
    cartStore.addItem(makeSnapshot({ variantId: 'toca-lisa' }))
    cartStore.addItem(makeSnapshot({ variantId: 'toca-estampada' }))
    expect(cartStore.getItems()).toHaveLength(2)
  })
})

// ─── updateQuantity ───────────────────────────────────────────────────────────

describe('updateQuantity', () => {
  beforeEach(() => {
    cartStore._resetForTest([makeCartItem()])
  })

  it('updates quantity to a valid value', () => {
    cartStore.updateQuantity('toca-cirurgica', 'toca-lisa', 3)
    expect(cartStore.getItems()[0].quantity).toBe(3)
  })

  it('rejects quantity of zero', () => {
    cartStore.updateQuantity('toca-cirurgica', 'toca-lisa', 0)
    expect(cartStore.getItems()[0].quantity).toBe(1)
  })

  it('rejects quantity above MAX_QUANTITY (10)', () => {
    cartStore.updateQuantity('toca-cirurgica', 'toca-lisa', 11)
    expect(cartStore.getItems()[0].quantity).toBe(1)
  })

  it('rejects non-integer quantity', () => {
    cartStore.updateQuantity('toca-cirurgica', 'toca-lisa', 1.5)
    expect(cartStore.getItems()[0].quantity).toBe(1)
  })

  it('does nothing when productId/variantId does not match any item', () => {
    cartStore.updateQuantity('unknown', 'unknown', 3)
    expect(cartStore.getItems()[0].quantity).toBe(1)
  })
})

// ─── removeItem ──────────────────────────────────────────────────────────────

describe('removeItem', () => {
  it('removes the matching item from the cart', () => {
    cartStore._resetForTest([makeCartItem()])
    cartStore.removeItem('toca-cirurgica', 'toca-lisa')
    expect(cartStore.getItems()).toHaveLength(0)
  })

  it('leaves other items intact when only the target is removed', () => {
    cartStore._resetForTest([
      makeCartItem({ variantId: 'toca-lisa' }),
      makeCartItem({ variantId: 'toca-estampada' }),
    ])
    cartStore.removeItem('toca-cirurgica', 'toca-lisa')
    expect(cartStore.getItems()).toHaveLength(1)
    expect(cartStore.getItems()[0].variantId).toBe('toca-estampada')
  })
})

// ─── clearCart ───────────────────────────────────────────────────────────────

describe('clearCart', () => {
  it('removes all items from the cart', () => {
    cartStore._resetForTest([makeCartItem(), makeCartItem({ variantId: 'toca-estampada' })])
    cartStore.clearCart()
    expect(cartStore.getItems()).toHaveLength(0)
  })
})

// ─── Selectors ───────────────────────────────────────────────────────────────

describe('selectors', () => {
  it('getItemCount returns sum of all quantities', () => {
    cartStore._resetForTest([
      makeCartItem({ quantity: 3 }),
      makeCartItem({ variantId: 'toca-estampada', quantity: 2 }),
    ])
    expect(cartStore.getItemCount()).toBe(5)
  })

  it('getSubtotalCents calculates exact integer centavo sum', () => {
    cartStore._resetForTest([
      makeCartItem({ priceCents: 4500, quantity: 2 }),
      makeCartItem({ variantId: 'toca-estampada', priceCents: 5500, quantity: 3 }),
    ])
    expect(cartStore.getSubtotalCents()).toBe(4500 * 2 + 5500 * 3)
  })

  it('getTotalCents equals subtotal in Phase 1 (no freight component)', () => {
    cartStore._resetForTest([makeCartItem({ priceCents: 4500, quantity: 2 })])
    expect(cartStore.getTotalCents()).toBe(cartStore.getSubtotalCents())
  })

  it('getSubtotalCents returns 0 for an empty cart', () => {
    expect(cartStore.getSubtotalCents()).toBe(0)
  })
})

// ─── Serialized payload safety ────────────────────────────────────────────────

describe('serialized cart payload safety', () => {
  it('saved cart data does not contain card, address, or customer fields', () => {
    cartStore._resetForTest([makeCartItem()])
    cartStore.addItem(makeSnapshot())

    const raw = localStorage.getItem('dona-toka:cart')
    expect(raw).not.toBeNull()

    const lower = raw!.toLowerCase()
    const forbidden = ['cardnumber', 'cvv', 'expiry', 'cpf', 'email', 'phone', 'street', 'address', 'password']
    for (const field of forbidden) {
      expect(lower).not.toContain(field)
    }
  })

  it('saved cart uses the current schema version', () => {
    cartStore._resetForTest([makeCartItem()])
    cartStore.addItem(makeSnapshot())

    const raw = localStorage.getItem('dona-toka:cart')
    const parsed = JSON.parse(raw!) as { version: number }
    expect(parsed.version).toBe(CART_SCHEMA_VERSION)
  })
})

// ─── Persistence (via storage helpers) ───────────────────────────────────────

describe('localStorage persistence via subscribe/notify', () => {
  it('persists cart to localStorage after addItem', () => {
    cartStore.addItem(makeSnapshot())
    const raw = localStorage.getItem('dona-toka:cart')
    expect(raw).not.toBeNull()
    const items = loadCart()
    expect(items).toHaveLength(1)
    expect(items[0].variantId).toBe('toca-lisa')
  })

  it('persists updated cart after clearCart', () => {
    cartStore._resetForTest([makeCartItem()])
    cartStore.clearCart()
    const items = loadCart()
    expect(items).toHaveLength(0)
  })

  it('hydrates from valid localStorage payload via loadCart', () => {
    const items: CartItem[] = [makeCartItem({ quantity: 2 })]
    saveCart(items)
    const loaded = loadCart()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].quantity).toBe(2)
    expect(loaded[0].variantId).toBe('toca-lisa')
  })

  it('subscribe fires callback when cart changes', () => {
    const spy = vi.fn()
    const unsubscribe = cartStore.subscribe(spy)
    cartStore.addItem(makeSnapshot())
    expect(spy).toHaveBeenCalledTimes(1)
    unsubscribe()
    cartStore.addItem(makeSnapshot())
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
