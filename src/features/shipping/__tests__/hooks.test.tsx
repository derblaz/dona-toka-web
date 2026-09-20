import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { ShippingQuoteValidationError, useShippingQuote } from '../hooks'
import type { ShippingQuoteResult } from '../types'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const quote: ShippingQuoteResult = {
  options: [{
    serviceCode: '1',
    carrierName: 'PAC',
    priceCents: 1590,
    estimatedDays: 7,
  }],
  freeShippingApplied: false,
  subtotalCents: 4500,
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useShippingQuote', () => {
  it('sends destination ZIP and product list to the shared endpoint', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: quote })
    const { result } = renderHook(() => useShippingQuote(), { wrapper: createWrapper() })

    result.current.mutate({
      destinationZip: '01310-100',
      items: [{ productId: 'toca-cirurgica', quantity: 2 }],
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(post).toHaveBeenCalledWith('/api/v1/shipping/quote', {
      destinationZip: '01310100',
      items: [{ productId: 'toca-cirurgica', quantity: 2 }],
    })
    expect(result.current.data).toEqual(quote)
  })

  it('exposes loading and success states for a valid response', async () => {
    let resolveRequest: ((value: { data: ShippingQuoteResult }) => void) | undefined
    vi.spyOn(apiClient, 'post').mockImplementation(
      () => new Promise((resolve) => { resolveRequest = resolve }),
    )
    const { result } = renderHook(() => useShippingQuote(), { wrapper: createWrapper() })

    result.current.mutate({ destinationZip: '01310100', items: [{ productId: 'p1', quantity: 1 }] })
    await waitFor(() => expect(result.current.isPending).toBe(true))
    resolveRequest?.({ data: quote })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('surfaces validation errors without sending a request', async () => {
    const post = vi.spyOn(apiClient, 'post')
    const { result } = renderHook(() => useShippingQuote(), { wrapper: createWrapper() })

    result.current.mutate({ destinationZip: '123', items: [{ productId: 'p1', quantity: 1 }] })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ShippingQuoteValidationError)
    expect(post).not.toHaveBeenCalled()
  })

  it('surfaces API and network errors without crashing the UI', async () => {
    const error = new Error('Network unavailable')
    vi.spyOn(apiClient, 'post').mockRejectedValue(error)
    const { result } = renderHook(() => useShippingQuote(), { wrapper: createWrapper() })

    result.current.mutate({ destinationZip: '01310100', items: [{ productId: 'p1', quantity: 1 }] })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
  })

  it('surfaces backend validation errors from a rejected payload', async () => {
    const error = new Error('Payload inválido')
    vi.spyOn(apiClient, 'post').mockRejectedValue(error)
    const { result } = renderHook(() => useShippingQuote(), { wrapper: createWrapper() })

    result.current.mutate({ destinationZip: '01310100', items: [{ productId: 'p1', quantity: 1 }] })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Payload inválido')
  })
})
