import type { CheckoutConfirmationSnapshot, CheckoutDraft } from './models'

const SESSION_CONFIRMATION_SNAPSHOTS_KEY = 'dona-toka:checkout-confirmation-snapshots'

function generateConfirmationId(): string {
  return `chk-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function loadSessionSnapshots(): Record<string, CheckoutConfirmationSnapshot> {
  try {
    const raw = sessionStorage.getItem(SESSION_CONFIRMATION_SNAPSHOTS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, CheckoutConfirmationSnapshot>
  } catch {
    return {}
  }
}

function saveSessionSnapshot(snapshot: CheckoutConfirmationSnapshot): void {
  const snapshots = loadSessionSnapshots()
  snapshots[snapshot.orderId] = snapshot
  sessionStorage.setItem(SESSION_CONFIRMATION_SNAPSHOTS_KEY, JSON.stringify(snapshots))
}

export function createCheckoutConfirmationSnapshot(
  draft: CheckoutDraft,
): CheckoutConfirmationSnapshot {
  const subtotalCents = draft.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)
  const shippingCents = draft.freightQuote.amountCents

  return {
    orderId: generateConfirmationId(),
    createdAt: new Date().toISOString(),
    customer: { ...draft.customer },
    deliverySnapshot: { ...draft.address },
    itemsSnapshot: draft.items.map((item) => ({ ...item })),
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    estimatedDelivery: draft.freightQuote.estimatedDays,
    notes: draft.notes,
  }
}

export function saveCheckoutConfirmationSnapshot(snapshot: CheckoutConfirmationSnapshot): void {
  saveSessionSnapshot(snapshot)
}

export function getSessionOrder(orderId: string): CheckoutConfirmationSnapshot | null {
  const snapshots = loadSessionSnapshots()
  return snapshots[orderId] ?? null
}
