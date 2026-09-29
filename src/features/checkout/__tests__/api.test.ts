import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import {
  buildGuestCheckoutPayload,
  GuestCheckoutError,
  ShippingQuoteOutdatedError,
  submitGuestCheckout,
} from '../api'
import type { GuestCheckoutConfirmation, GuestCheckoutVariables } from '../api'

const variables: GuestCheckoutVariables = {
  email: 'maria@example.com',
  fullName: 'Maria Silva',
  cpfCnpj: '123.456.789-09',
  phone: '(11) 99988-7766',
  address: {
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    complement: 'Apto 45',
  },
  items: [
    { productId: '9b1d2f3a-0000-4000-8000-000000000001', quantity: 2 },
    { productId: '9b1d2f3a-0000-4000-8000-000000000002', quantity: 1 },
  ],
  itemsTotalCents: 14700,
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

function axiosHttpError(status: number, data: unknown): AxiosError {
  const error = new AxiosError(`Request failed with status code ${status}`)
  error.response = {
    status,
    statusText: '',
    headers: {},
    config: error.config!,
    data,
  }
  return error
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('buildGuestCheckoutPayload', () => {
  it('serializes masked CPF/CNPJ, phone, and CEP as digits only', () => {
    const payload = buildGuestCheckoutPayload(variables)

    expect(payload.cpfCnpj).toBe('12345678909')
    expect(payload.phone).toBe('11999887766')
    expect(payload.address.cep).toBe('01310100')
  })

  it('accepts a formatted CNPJ and strips it to digits only', () => {
    const payload = buildGuestCheckoutPayload({
      ...variables,
      cpfCnpj: '12.345.678/0001-90',
    })

    expect(payload.cpfCnpj).toBe('12345678000190')
  })

  it('includes shipping service and quoted value, with no card, payment-method, or return URL fields', () => {
    const payload = buildGuestCheckoutPayload(variables)

    expect(payload.shippingServiceId).toBe(1)
    expect(payload.shippingCents).toBe(1590)
    expect(payload).not.toHaveProperty('cardNumber')
    expect(payload).not.toHaveProperty('paymentMethod')
    expect(payload).not.toHaveProperty('returnUrl')
    expect(Object.keys(payload).sort()).toEqual([
      'address',
      'cpfCnpj',
      'email',
      'fullName',
      'items',
      'itemsTotalCents',
      'phone',
      'shippingCents',
      'shippingServiceId',
    ])
  })

  it('omits the complement when it is empty', () => {
    const payload = buildGuestCheckoutPayload({
      ...variables,
      address: { ...variables.address, complement: undefined },
    })

    expect(payload.address).not.toHaveProperty('complement')
  })
})

describe('submitGuestCheckout', () => {
  it('posts the normalized payload to the guest checkout endpoint', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, message: 'Guest checkout created.', data: confirmation },
    })

    const result = await submitGuestCheckout(variables)

    expect(post).toHaveBeenCalledWith('/api/v1/checkout/guest', buildGuestCheckoutPayload(variables))
    expect(result).toEqual(confirmation)
  })

  it('exposes order ID, payment details, and checkout URL on success', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, message: 'Guest checkout created.', data: confirmation },
    })

    const result = await submitGuestCheckout(variables)

    expect(result.orderId).toBe(confirmation.orderId)
    expect(result.paymentId).toBe(confirmation.paymentId)
    expect(result.paymentStatus).toBe('PENDING')
    expect(result.checkoutUrl).toBe('https://checkout.infinitepay.io/pay/abc')
    expect(result.redirect.returnUrl).toContain(`/pedido/${confirmation.orderId}`)
  })

  it('exposes corrected shipping and total on a 409 SHIPPING_QUOTE_OUTDATED conflict', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      axiosHttpError(409, {
        success: false,
        message: 'SHIPPING_QUOTE_OUTDATED',
        data: { shippingCents: 2250, totalCents: 16950 },
      }),
    )

    const promise = submitGuestCheckout(variables)

    await expect(promise).rejects.toBeInstanceOf(ShippingQuoteOutdatedError)
    await expect(promise).rejects.toMatchObject({
      correction: { shippingCents: 2250, totalCents: 16950 },
    })
  })

  it('wraps other backend failures with the response message', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      axiosHttpError(422, {
        success: false,
        message: 'The requested item total does not match the active catalog prices.',
        data: null,
      }),
    )

    const promise = submitGuestCheckout(variables)

    await expect(promise).rejects.toBeInstanceOf(GuestCheckoutError)
    await expect(promise).rejects.toMatchObject({
      message: 'The requested item total does not match the active catalog prices.',
    })
  })

  it('distinguishes a 409 with a different message from a shipping conflict', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      axiosHttpError(409, {
        success: false,
        message: 'A resource with the provided data already exists.',
        data: null,
      }),
    )

    const promise = submitGuestCheckout(variables)

    await expect(promise).rejects.toBeInstanceOf(GuestCheckoutError)
    await expect(promise).rejects.not.toBeInstanceOf(ShippingQuoteOutdatedError)
  })

  it('rethrows network errors without a response untouched', async () => {
    const networkError = new AxiosError('Network unavailable')
    vi.spyOn(apiClient, 'post').mockRejectedValue(networkError)

    await expect(submitGuestCheckout(variables)).rejects.toBe(networkError)
  })
})
