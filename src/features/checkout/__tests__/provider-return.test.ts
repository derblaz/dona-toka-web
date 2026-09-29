import { describe, expect, it } from 'vitest'
import {
  buildProviderReturnView,
  providerReturnSearchSchema,
} from '../provider-return'

const validReturn = {
  receipt_url: 'https://recibo.infinitepay.io/abc123',
  order_nsu: 'order-123',
  slug: 'invoice-slug-1',
  capture_method: 'credit_card',
  transaction_nsu: 'txn-456',
}

describe('providerReturnSearchSchema', () => {
  it('parses all documented InfinitePay return parameters', () => {
    const parsed = providerReturnSearchSchema.parse(validReturn)

    expect(parsed).toEqual(validReturn)
  })

  it('tolerates missing receipt_url and capture_method without throwing', () => {
    const parsed = providerReturnSearchSchema.parse({ order_nsu: 'order-123' })

    expect(parsed.receipt_url).toBeUndefined()
    expect(parsed.capture_method).toBeUndefined()
    expect(parsed.order_nsu).toBe('order-123')
  })

  it('tolerates an empty search object', () => {
    expect(providerReturnSearchSchema.parse({})).toEqual({})
  })

  it('drops malformed values instead of throwing', () => {
    const parsed = providerReturnSearchSchema.parse({
      receipt_url: 'not-a-url',
      order_nsu: '',
      capture_method: 42,
    })

    expect(parsed.receipt_url).toBeUndefined()
    expect(parsed.order_nsu).toBeUndefined()
    expect(parsed.capture_method).toBeUndefined()
  })
})

describe('buildProviderReturnView', () => {
  it('maps a completed credit-card return to displayable fields', () => {
    const view = buildProviderReturnView(providerReturnSearchSchema.parse(validReturn))

    expect(view.hasDisplayableResult).toBe(true)
    expect(view.receiptUrl).toBe(validReturn.receipt_url)
    expect(view.orderReference).toBe('order-123')
    expect(view.invoiceSlug).toBe('invoice-slug-1')
    expect(view.transactionReference).toBe('txn-456')
    expect(view.captureMethodLabel).toBe('Cartão de crédito')
  })

  it('maps a pix capture method to its display label', () => {
    const view = buildProviderReturnView(
      providerReturnSearchSchema.parse({ ...validReturn, capture_method: 'pix' }),
    )

    expect(view.captureMethodLabel).toBe('PIX')
  })

  it('treats a return without receipt_url as processing-safe content', () => {
    const view = buildProviderReturnView(
      providerReturnSearchSchema.parse({ order_nsu: 'order-123', capture_method: 'pix' }),
    )

    expect(view.hasDisplayableResult).toBe(false)
    expect(view.receiptUrl).toBeUndefined()
  })

  it('does not surface an unsupported capture_method as an approved payment method', () => {
    const view = buildProviderReturnView(
      providerReturnSearchSchema.parse({ ...validReturn, capture_method: 'boleto' }),
    )

    expect(view.captureMethodLabel).toBeUndefined()
    expect(view.hasDisplayableResult).toBe(true)
    expect(view.orderReference).toBe('order-123')
  })
})
