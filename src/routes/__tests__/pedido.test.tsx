import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { saveCheckoutConfirmationSnapshot } from '@/features/checkout/service'
import type { CheckoutConfirmationSnapshot } from '@/features/checkout/models'
import { _resetForTest } from '@/features/cart/store'

const ORDER_ID = '9b1d2f3a-0000-4000-8000-000000000010'

const snapshot: CheckoutConfirmationSnapshot = {
  orderId: ORDER_ID,
  createdAt: '2026-09-27T12:00:00.000Z',
  customer: {
    name: 'Ana Lima',
    email: 'ana@example.com',
    phone: '11912345678',
    cpfCnpj: '12345678909',
  },
  deliverySnapshot: {
    cep: '01310100',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
  itemsSnapshot: [
    {
      productId: 'p1',
      variantId: 'v1',
      productName: 'Touca Cirúrgica',
      variantName: 'Lisa',
      slug: 'touca-cirurgica-lisa',
      priceCents: 4900,
      quantity: 2,
      image: { src: '/img.jpg', alt: 'Touca', role: 'real-product', width: 400, height: 400 },
    },
  ],
  subtotalCents: 9800,
  shippingCents: 1590,
  totalCents: 11390,
  estimatedDelivery: '5–7 dias úteis',
  notes: '',
}

function renderOrderPage(url: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [url] }),
  })
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  sessionStorage.clear()
  _resetForTest([])
  saveCheckoutConfirmationSnapshot(snapshot)
})

describe('confirmation route — provider return handling', () => {
  it('renders a neutral processing state when provider parameters are partial', async () => {
    renderOrderPage(`/pedido/${ORDER_ID}?order_nsu=order-123`)

    expect(
      await screen.findByText(/pagamento em processamento/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/pagamento em confirmação/i)).toBeNull()
    expect(screen.queryByRole('link', { name: /ver comprovante/i })).toBeNull()
    // Neutral copy must not assert an authoritative outcome in either direction.
    expect(screen.queryByText(/pagamento aprovado/i)).toBeNull()
    expect(screen.queryByText(/pagamento (recusado|falhou)/i)).toBeNull()
  })

  it('renders a neutral processing state when no provider parameters arrive', async () => {
    renderOrderPage(`/pedido/${ORDER_ID}`)

    expect(
      await screen.findByText(/pagamento em processamento/i),
    ).toBeInTheDocument()
  })

  it('renders receipt, reference and capture method for a valid completed return', async () => {
    renderOrderPage(
      `/pedido/${ORDER_ID}?receipt_url=${encodeURIComponent('https://recibo.infinitepay.io/abc123')}` +
        '&order_nsu=order-123&slug=invoice-slug-1&capture_method=pix&transaction_nsu=txn-456',
    )

    expect(await screen.findByText(/pagamento em confirmação/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver comprovante do provedor/i })).toHaveAttribute(
      'href',
      'https://recibo.infinitepay.io/abc123',
    )
    expect(screen.getByText('PIX')).toBeInTheDocument()
    expect(screen.getByText('order-123')).toBeInTheDocument()
    expect(screen.getByText('txn-456')).toBeInTheDocument()
    // Redirect parameters are display-only: never asserted as authoritative approval.
    expect(screen.queryByText(/pagamento aprovado/i)).toBeNull()
  })

  it('does not display an unsupported capture_method as an approved payment method', async () => {
    renderOrderPage(
      `/pedido/${ORDER_ID}?receipt_url=${encodeURIComponent('https://recibo.infinitepay.io/abc123')}` +
        '&capture_method=boleto',
    )

    expect(await screen.findByText(/pagamento em confirmação/i)).toBeInTheDocument()
    expect(screen.queryByText(/forma informada/i)).toBeNull()
    expect(screen.queryByText(/boleto/i)).toBeNull()
  })

  it('keeps the confirmation snapshot summary visible after the checkout handoff', async () => {
    renderOrderPage(`/pedido/${ORDER_ID}`)

    expect(
      await screen.findByRole('heading', { name: /obrigada pela sua compra/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/touca cirúrgica/i)).toBeInTheDocument()
    expect(screen.getByText(ORDER_ID)).toBeInTheDocument()
  })

  it('renders the not-found state for an unknown order id', async () => {
    renderOrderPage('/pedido/unknown-order?receipt_url=https%3A%2F%2Frecibo.infinitepay.io%2Fabc')

    expect(
      await screen.findByRole('heading', { name: /pedido não encontrado/i }),
    ).toBeInTheDocument()
  })
})
