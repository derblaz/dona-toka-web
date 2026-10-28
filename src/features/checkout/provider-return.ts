import { z } from 'zod'

/**
 * Parameters appended by InfinitePay to the `redirect_url` when the customer
 * returns from the hosted checkout (ADR-003). They are display-only hints and
 * may arrive partially or not at all; the webhook remains the source of truth.
 * Every field falls back to `undefined` instead of throwing on bad input.
 */
export const providerReturnSearchSchema = z.object({
  receipt_url: z.string().url().optional().catch(undefined),
  order_nsu: z.string().min(1).optional().catch(undefined),
  slug: z.string().min(1).optional().catch(undefined),
  capture_method: z.string().min(1).optional().catch(undefined),
  transaction_nsu: z.string().min(1).optional().catch(undefined),
})

export type ProviderReturnSearch = z.infer<typeof providerReturnSearchSchema>

/** Capture methods documented by InfinitePay; anything else is not displayed. */
const CAPTURE_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de crédito',
  pix: 'PIX',
}

export interface ProviderReturnView {
  receiptUrl?: string
  orderReference?: string
  invoiceSlug?: string
  transactionReference?: string
  captureMethodLabel?: string
  /** True when the return carries a receipt, i.e. a completed result to show. */
  hasDisplayableResult: boolean
}

export function buildProviderReturnView(search: ProviderReturnSearch): ProviderReturnView {
  const captureMethodLabel = search.capture_method
    ? CAPTURE_METHOD_LABELS[search.capture_method]
    : undefined

  return {
    receiptUrl: search.receipt_url,
    orderReference: search.order_nsu,
    invoiceSlug: search.slug,
    transactionReference: search.transaction_nsu,
    captureMethodLabel,
    hasDisplayableResult: search.receipt_url != null,
  }
}
