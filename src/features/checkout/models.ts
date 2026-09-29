import type { CartItem } from '@/features/cart/models'
import type { FreightQuote } from '@/lib/freight'

export interface CheckoutCustomer {
  name: string
  email: string
  phone: string
  cpfCnpj: string
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

export interface CheckoutDraft {
  customer: CheckoutCustomer
  address: DeliveryAddress
  notes: string
  items: CartItem[]
  freightQuote: FreightQuote
}

export interface CheckoutConfirmationSnapshot {
  orderId: string
  createdAt: string
  customer: CheckoutCustomer
  deliverySnapshot: DeliveryAddress
  itemsSnapshot: CartItem[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  estimatedDelivery: string
  notes: string
}
