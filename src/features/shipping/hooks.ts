import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  ShippingQuoteRequest,
  ShippingQuoteResult,
  ShippingQuoteVariables,
} from './types'

export class ShippingQuoteValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShippingQuoteValidationError'
  }
}

function normalizeDestinationZip(destinationZip: string): string {
  return destinationZip.replace(/\D/g, '')
}

function validateRequest({ destinationZip, items }: ShippingQuoteVariables): ShippingQuoteRequest {
  const normalizedZip = typeof destinationZip === 'string'
    ? normalizeDestinationZip(destinationZip)
    : ''

  if (!/^\d{8}$/.test(normalizedZip)) {
    throw new ShippingQuoteValidationError('CEP inválido. Informe um CEP com 8 dígitos.')
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ShippingQuoteValidationError('Adicione ao menos um produto para calcular o frete.')
  }

  if (items.some((item) => !item || !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    throw new ShippingQuoteValidationError('Os produtos e quantidades informados são inválidos.')
  }

  return { destinationZip: normalizedZip, items }
}

async function requestShippingQuote(variables: ShippingQuoteVariables): Promise<ShippingQuoteResult> {
  const request = validateRequest(variables)
  const { data } = await apiClient.post<ShippingQuoteResult>('/api/v1/shipping/quote', request)
  return data
}

export function useShippingQuote() {
  return useMutation<ShippingQuoteResult, Error, ShippingQuoteVariables>({
    mutationFn: requestShippingQuote,
  })
}
