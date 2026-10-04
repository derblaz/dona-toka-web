import { isAxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'
import { normalizePhoneDigits, stripNonDigits } from '@/lib/masks'

/**
 * Contract mirrors `GuestCheckoutRequest` on the backend (ADR-001/ADR-002):
 * digit-only document/phone/CEP, server-quoted shipping, and no card,
 * payment-method, or return URL fields.
 */
export interface GuestCheckoutAddress {
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  complement?: string
}

export interface GuestCheckoutItem {
  productId: string
  quantity: number
}

export interface GuestCheckoutPayload {
  email: string
  fullName: string
  /** CPF or CNPJ, digits only. */
  cpfCnpj: string
  /** Exactly 11 digits. */
  phone: string
  address: GuestCheckoutAddress
  items: GuestCheckoutItem[]
  itemsTotalCents: number
  shippingServiceId: number
  shippingCents: number
}

/** Values accepted by the API boundary; masked fields are normalized here. */
export interface GuestCheckoutVariables {
  email: string
  fullName: string
  cpfCnpj: string
  phone: string
  address: GuestCheckoutAddress
  items: GuestCheckoutItem[]
  itemsTotalCents: number
  shippingServiceId: number
  shippingCents: number
}

export interface GuestCheckoutRedirect {
  returnUrl: string
  checkoutUrl: string
  orderId: string
}

/** Matches `GuestCheckoutConfirmation` returned inside `ApiResponse.data`. */
export interface GuestCheckoutConfirmation {
  orderId: string
  orderStatus: string
  paymentId: string
  paymentStatus: string
  checkoutUrl: string
  redirect: GuestCheckoutRedirect
}

interface ApiResponseEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export interface ShippingQuoteCorrection {
  shippingCents: number
  totalCents: number
}

/** Thrown when the backend requotes shipping and the quoted value diverged (409). */
export class ShippingQuoteOutdatedError extends Error {
  readonly correction: ShippingQuoteCorrection

  constructor(correction: ShippingQuoteCorrection) {
    super('SHIPPING_QUOTE_OUTDATED')
    this.name = 'ShippingQuoteOutdatedError'
    this.correction = correction
  }
}

/** Generic checkout failure carrying the backend message when available. */
export class GuestCheckoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GuestCheckoutError'
  }
}

export function buildGuestCheckoutPayload(
  variables: GuestCheckoutVariables,
): GuestCheckoutPayload {
  return {
    email: variables.email,
    fullName: variables.fullName,
    cpfCnpj: stripNonDigits(variables.cpfCnpj),
    phone: normalizePhoneDigits(variables.phone),
    address: {
      cep: stripNonDigits(variables.address.cep),
      street: variables.address.street,
      number: variables.address.number,
      neighborhood: variables.address.neighborhood,
      city: variables.address.city,
      state: variables.address.state,
      ...(variables.address.complement ? { complement: variables.address.complement } : {}),
    },
    items: variables.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    itemsTotalCents: variables.itemsTotalCents,
    shippingServiceId: variables.shippingServiceId,
    shippingCents: variables.shippingCents,
  }
}

export async function submitGuestCheckout(
  variables: GuestCheckoutVariables,
): Promise<GuestCheckoutConfirmation> {
  const payload = buildGuestCheckoutPayload(variables)

  try {
    const { data: envelope } = await apiClient.post<ApiResponseEnvelope<GuestCheckoutConfirmation>>(
      '/api/v1/checkout/guest',
      payload,
    )
    return envelope.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const { status, data } = error.response as {
        status: number
        data?: ApiResponseEnvelope<unknown>
      }

      if (status === 409 && data?.message === 'SHIPPING_QUOTE_OUTDATED') {
        const correction = data.data as ShippingQuoteCorrection
        throw new ShippingQuoteOutdatedError({
          shippingCents: correction.shippingCents,
          totalCents: correction.totalCents,
        })
      }

      if (typeof data?.message === 'string' && data.message.length > 0) {
        throw new GuestCheckoutError(data.message)
      }
    }

    throw error
  }
}
