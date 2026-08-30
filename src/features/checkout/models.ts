import type { CartItem } from '@/features/cart/models'
import type { FreightQuote } from '@/lib/freight'

export interface CheckoutCustomer {
  name: string
  email: string
  phone: string
}

export interface DeliveryAddress {
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}

export type PaymentMethod =
  | { type: 'pix' }
  | {
      type: 'card'
      cardholderName: string
      /** Formatted card number, e.g. "1234 5678 9012 3456" */
      cardNumber: string
      expiry: string
      cvv: string
    }

export interface OrderDraft {
  customer: CheckoutCustomer
  address: DeliveryAddress
  notes: string
  payment: PaymentMethod
  items: CartItem[]
  freightQuote: FreightQuote
}

export interface MockOrder {
  orderId: string
  createdAt: string
  status: 'confirmed'
  paymentType: 'pix' | 'card'
  /** Delivery snapshot — no raw card values */
  deliverySnapshot: DeliveryAddress
  /** Item snapshot */
  itemsSnapshot: CartItem[]
  subtotalCents: number
  freightCents: number
  totalCents: number
  estimatedDelivery: string
}
