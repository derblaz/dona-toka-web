import { describe, it, expect, beforeEach } from 'vitest'
import { loadCart, saveCart, clearCartStorage } from '../storage'
import { CART_SCHEMA_VERSION } from '@/features/cart/models'
import type { CartItem } from '@/features/cart/models'

const mockImage = {
  src: '/img/toca.jpg',
  alt: 'Touca cirúrgica lisa',
  role: 'real-product' as const,
  width: 800,
  height: 800,
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
})

describe('loadCart', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(loadCart()).toEqual([])
  })

  it('returns items from a valid current-version payload', () => {
    const items = [makeCartItem({ quantity: 2 })]
    saveCart(items)
    const result = loadCart()
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(2)
    expect(result[0].productId).toBe('toca-cirurgica')
  })

  it('discards a malformed payload (not an object)', () => {
    localStorage.setItem('dona-toka:cart', '"not-an-object"')
    expect(loadCart()).toEqual([])
  })

  it('discards a payload with missing version field', () => {
    localStorage.setItem('dona-toka:cart', JSON.stringify({ items: [] }))
    expect(loadCart()).toEqual([])
  })

  it('discards a payload with a stale schema version', () => {
    localStorage.setItem(
      'dona-toka:cart',
      JSON.stringify({ version: 0, items: [makeCartItem()] }),
    )
    expect(loadCart()).toEqual([])
  })

  it('discards a payload where an item is missing required fields', () => {
    localStorage.setItem(
      'dona-toka:cart',
      JSON.stringify({
        version: CART_SCHEMA_VERSION,
        items: [{ productId: 'x' }],
      }),
    )
    expect(loadCart()).toEqual([])
  })

  it('discards a payload where an item has priceCents of 0', () => {
    localStorage.setItem(
      'dona-toka:cart',
      JSON.stringify({
        version: CART_SCHEMA_VERSION,
        items: [makeCartItem({ priceCents: 0 })],
      }),
    )
    expect(loadCart()).toEqual([])
  })

  it('discards a payload where quantity exceeds max (10)', () => {
    localStorage.setItem(
      'dona-toka:cart',
      JSON.stringify({
        version: CART_SCHEMA_VERSION,
        items: [makeCartItem({ quantity: 11 })],
      }),
    )
    expect(loadCart()).toEqual([])
  })

  it('returns empty array when localStorage value is invalid JSON', () => {
    localStorage.setItem('dona-toka:cart', '{bad json')
    expect(loadCart()).toEqual([])
  })
})

describe('saveCart', () => {
  it('writes a versioned payload to localStorage', () => {
    const items = [makeCartItem()]
    saveCart(items)
    const raw = localStorage.getItem('dona-toka:cart')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!) as { version: number; items: CartItem[] }
    expect(parsed.version).toBe(CART_SCHEMA_VERSION)
    expect(parsed.items).toHaveLength(1)
  })

  it('overwrites a previous save', () => {
    saveCart([makeCartItem({ quantity: 1 })])
    saveCart([makeCartItem({ quantity: 5 })])
    const items = loadCart()
    expect(items[0].quantity).toBe(5)
  })

  it('saves an empty items array when cart is cleared', () => {
    saveCart([makeCartItem()])
    saveCart([])
    expect(loadCart()).toEqual([])
  })
})

describe('clearCartStorage', () => {
  it('removes the cart key from localStorage', () => {
    saveCart([makeCartItem()])
    clearCartStorage()
    expect(localStorage.getItem('dona-toka:cart')).toBeNull()
  })
})
