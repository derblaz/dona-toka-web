import { describe, it, expect, beforeEach } from 'vitest'
import { confirmCheckout, getSessionOrder } from '../service'
import { _resetForTest, getItems } from '@/features/cart/store'
import type { OrderDraft } from '../models'
import type { CartItem } from '@/features/cart/models'

const item: CartItem = {
  productId: 'p1',
  variantId: 'v1',
  productName: 'Touca Cirúrgica',
  variantName: 'Lisa',
  slug: 'touca-cirurgica-lisa',
  priceCents: 4900,
  quantity: 2,
  image: { src: '/img.jpg', alt: 'Touca', role: 'real-product', width: 400, height: 400 },
}

const validDraft: OrderDraft = {
  customer: { name: 'Ana Lima', email: 'ana@example.com', phone: '(11) 91234-5678' },
  address: {
    cep: '01310100',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
  notes: '',
  payment: { type: 'pix' },
  items: [item],
  freightQuote: { amountCents: 1590, estimatedDays: '5–7 dias úteis', label: 'Estimativa de frete' },
}

beforeEach(() => {
  sessionStorage.clear()
  _resetForTest([item])
})

describe('confirmCheckout — PIX', () => {
  it('returns a confirmed MockOrder with correct totals', () => {
    const order = confirmCheckout(validDraft)
    expect(order.status).toBe('confirmed')
    expect(order.paymentType).toBe('pix')
    expect(order.subtotalCents).toBe(9800) // 4900 * 2
    expect(order.freightCents).toBe(1590)
    expect(order.totalCents).toBe(11390)
    expect(order.estimatedDelivery).toBe('5–7 dias úteis')
    expect(order.orderId).toMatch(/^dt-/)
    expect(order.createdAt).toBeTruthy()
  })

  it('does not include raw card fields in the returned order', () => {
    const order = confirmCheckout(validDraft)
    const orderStr = JSON.stringify(order)
    expect(orderStr).not.toContain('cardNumber')
    expect(orderStr).not.toContain('cvv')
    expect(orderStr).not.toContain('expiry')
  })

  it('persists the order to sessionStorage', () => {
    const order = confirmCheckout(validDraft)
    const retrieved = getSessionOrder(order.orderId)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.orderId).toBe(order.orderId)
  })

  it('does not clear the cart — cart clearing is the route\'s responsibility', () => {
    confirmCheckout(validDraft)
    expect(getItems()).toHaveLength(1)
  })
})

describe('confirmCheckout — card', () => {
  const cardDraft: OrderDraft = {
    ...validDraft,
    payment: {
      type: 'card',
      cardholderName: 'Ana Lima',
      cardNumber: '4539148803436467',
      expiry: '12/99',
      cvv: '123',
    },
  }

  it('returns confirmed order with paymentType card', () => {
    const order = confirmCheckout(cardDraft)
    expect(order.paymentType).toBe('card')
    expect(order.status).toBe('confirmed')
  })

  it('does not store card data in the returned MockOrder', () => {
    const order = confirmCheckout(cardDraft)
    const orderStr = JSON.stringify(order)
    expect(orderStr).not.toContain('4539148803436467')
    expect(orderStr).not.toContain('123')
    expect(orderStr).not.toContain('12/99')
  })

  it('does not store card data in sessionStorage', () => {
    confirmCheckout(cardDraft)
    const raw = sessionStorage.getItem('dona-toka:session-orders') ?? ''
    expect(raw).not.toContain('4539148803436467')
    expect(raw).not.toContain('cvv')
  })
})

describe('confirmCheckout — invalid input', () => {
  it('throws when draft is invalid', () => {
    const bad = { ...validDraft, customer: { name: '', email: 'bad', phone: '' } }
    expect(() => confirmCheckout(bad as OrderDraft)).toThrow()
  })
})

describe('getSessionOrder', () => {
  it('returns null for unknown orderId', () => {
    expect(getSessionOrder('unknown-order-id')).toBeNull()
  })

  it('returns the order for a known orderId', () => {
    const order = confirmCheckout(validDraft)
    expect(getSessionOrder(order.orderId)).toEqual(order)
  })
})
