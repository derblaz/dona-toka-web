import { describe, it, expect, beforeEach } from 'vitest'
import {
  createCheckoutConfirmationSnapshot,
  getSessionOrder,
  saveCheckoutConfirmationSnapshot,
} from '../service'
import { _resetForTest } from '@/features/cart/store'
import type { CheckoutDraft } from '../models'
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

const validDraft: CheckoutDraft = {
  customer: {
    name: 'Ana Lima',
    email: 'ana@example.com',
    phone: '11912345678',
    cpfCnpj: '12345678909',
  },
  address: {
    cep: '01310100',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
  notes: 'Deixar com a portaria',
  items: [item],
  freightQuote: { amountCents: 1590, estimatedDays: '5–7 dias úteis', label: 'Estimativa de frete' },
}

beforeEach(() => {
  sessionStorage.clear()
  _resetForTest([item])
})

describe('createCheckoutConfirmationSnapshot', () => {
  it('builds a confirmation snapshot without payment data', () => {
    const snapshot = createCheckoutConfirmationSnapshot(validDraft)

    expect(snapshot.orderId).toMatch(/^chk-/)
    expect(snapshot.createdAt).toBeTruthy()
    expect(snapshot.customer.cpfCnpj).toBe('12345678909')
    expect(snapshot.customer.phone).toBe('11912345678')
    expect(snapshot.subtotalCents).toBe(9800)
    expect(snapshot.shippingCents).toBe(1590)
    expect(snapshot.totalCents).toBe(11390)
    expect(snapshot.estimatedDelivery).toBe('5–7 dias úteis')
    expect(snapshot.notes).toBe('Deixar com a portaria')
    expect(JSON.stringify(snapshot)).not.toContain('cardNumber')
    expect(JSON.stringify(snapshot)).not.toContain('paymentType')
  })
})

describe('checkout confirmation snapshot storage', () => {
  it('persists and retrieves the snapshot by order id', () => {
    const snapshot = createCheckoutConfirmationSnapshot(validDraft)
    saveCheckoutConfirmationSnapshot(snapshot)

    expect(getSessionOrder(snapshot.orderId)).toEqual(snapshot)
  })

  it('returns null for an unknown confirmation id', () => {
    expect(getSessionOrder('unknown-order-id')).toBeNull()
  })
})
