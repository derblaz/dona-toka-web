import { checkoutFormSchema } from './schemas'
import type { OrderDraft, MockOrder } from './models'

const SESSION_ORDERS_KEY = 'dona-toka:session-orders'

function generateOrderId(): string {
  return `dt-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function loadSessionOrders(): Record<string, MockOrder> {
  try {
    const raw = sessionStorage.getItem(SESSION_ORDERS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, MockOrder>
  } catch {
    return {}
  }
}

function saveSessionOrder(order: MockOrder): void {
  const orders = loadSessionOrders()
  orders[order.orderId] = order
  sessionStorage.setItem(SESSION_ORDERS_KEY, JSON.stringify(orders))
}

export function getSessionOrder(orderId: string): MockOrder | null {
  const orders = loadSessionOrders()
  return orders[orderId] ?? null
}

export function confirmCheckout(draft: OrderDraft): MockOrder {
  const validation = checkoutFormSchema.safeParse({
    customer: draft.customer,
    address: draft.address,
    notes: draft.notes,
    payment: draft.payment,
  })

  if (!validation.success) {
    throw new Error('Dados de checkout inválidos: ' + validation.error.message)
  }

  const subtotalCents = draft.items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)
  const freightCents = draft.freightQuote.amountCents
  const totalCents = subtotalCents + freightCents

  const orderId = generateOrderId()

  const order: MockOrder = {
    orderId,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    paymentType: draft.payment.type,
    deliverySnapshot: {
      cep: draft.address.cep,
      street: draft.address.street,
      number: draft.address.number,
      complement: draft.address.complement,
      neighborhood: draft.address.neighborhood,
      city: draft.address.city,
      state: draft.address.state,
    },
    itemsSnapshot: draft.items.map((i) => ({ ...i })),
    subtotalCents,
    freightCents,
    totalCents,
    estimatedDelivery: draft.freightQuote.estimatedDays,
  }

  saveSessionOrder(order)
  return order
}
