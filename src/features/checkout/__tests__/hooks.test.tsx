import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { _resetForTest, getItems } from '@/features/cart/store'
import type { CartItem } from '@/features/cart/models'
import { ShippingQuoteOutdatedError } from '../api'
import type { GuestCheckoutConfirmation, GuestCheckoutVariables } from '../api'
import { useGuestCheckout } from '../hooks'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const variables: GuestCheckoutVariables = {
  email: 'maria@example.com',
  fullName: 'Maria Silva',
  cpfCnpj: '12345678909',
  phone: '11999887766',
  address: {
    cep: '01310100',
    street: 'Avenida Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
  items: [{ productId: '9b1d2f3a-0000-4000-8000-000000000001', quantity: 2 }],
  itemsTotalCents: 9800,
  shippingServiceId: 1,
  shippingCents: 1590,
}

const confirmation: GuestCheckoutConfirmation = {
  orderId: '9b1d2f3a-0000-4000-8000-000000000010',
  orderStatus: 'CREATED',
  paymentId: '9b1d2f3a-0000-4000-8000-000000000020',
  paymentStatus: 'PENDING',
  checkoutUrl: 'https://checkout.infinitepay.io/pay/abc',
  redirect: {
    returnUrl: 'http://localhost:5173/pedido/9b1d2f3a-0000-4000-8000-000000000010',
    checkoutUrl: 'https://checkout.infinitepay.io/pay/abc',
    orderId: '9b1d2f3a-0000-4000-8000-000000000010',
  },
}

const cartItem: CartItem = {
  productId: '9b1d2f3a-0000-4000-8000-000000000001',
  variantId: 'v1',
  productName: 'Touca Cirúrgica',
  variantName: 'Lisa',
  slug: 'toca-lisa',
  priceCents: 4900,
  quantity: 2,
  image: { src: '/img/toca.jpg', alt: 'Touca cirúrgica', role: 'real-product', width: 400, height: 400 },
}

function axiosHttpError(status: number, data: unknown): AxiosError {
  const error = new AxiosError(`Request failed with status code ${status}`)
  error.response = { status, statusText: '', headers: {}, config: error.config!, data }
  return error
}

beforeEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  _resetForTest([])
})

describe('useGuestCheckout', () => {
  it('exposes pending then success states with the confirmation data', async () => {
    let resolveRequest: ((value: { data: unknown }) => void) | undefined
    vi.spyOn(apiClient, 'post').mockImplementation(
      () => new Promise((resolve) => { resolveRequest = resolve }),
    )
    const { result } = renderHook(() => useGuestCheckout(), { wrapper: createWrapper() })

    result.current.mutate(variables)
    await waitFor(() => expect(result.current.isPending).toBe(true))

    resolveRequest?.({
      data: { success: true, message: 'Guest checkout created.', data: confirmation },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(confirmation)
  })

  it('exposes a shipping-quote conflict distinctly, with corrected values', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      axiosHttpError(409, {
        success: false,
        message: 'SHIPPING_QUOTE_OUTDATED',
        data: { shippingCents: 2250, totalCents: 12050 },
      }),
    )
    const { result } = renderHook(() => useGuestCheckout(), { wrapper: createWrapper() })

    result.current.mutate(variables)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ShippingQuoteOutdatedError)
    const conflict = result.current.error as ShippingQuoteOutdatedError
    expect(conflict.correction).toEqual({ shippingCents: 2250, totalCents: 12050 })
  })

  it('exposes generic failures as errors', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      axiosHttpError(503, { success: false, message: 'Payment provider unavailable.', data: null }),
    )
    const { result } = renderHook(() => useGuestCheckout(), { wrapper: createWrapper() })

    result.current.mutate(variables)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ShippingQuoteOutdatedError)
    expect(result.current.error?.message).toBe('Payment provider unavailable.')
  })

  it('leaves the cart unchanged when the guest checkout mutation fails', async () => {
    _resetForTest([cartItem])
    const before = getItems()
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      axiosHttpError(409, {
        success: false,
        message: 'SHIPPING_QUOTE_OUTDATED',
        data: { shippingCents: 2250, totalCents: 12050 },
      }),
    )
    const { result } = renderHook(() => useGuestCheckout(), { wrapper: createWrapper() })

    result.current.mutate(variables)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getItems()).toEqual(before)
    expect(getItems()).toHaveLength(1)
    expect(getItems()[0]).toMatchObject({ productId: cartItem.productId, quantity: 2 })
  })
})
