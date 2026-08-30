/**
 * Deterministic local freight estimation — Phase 1.
 * No carrier API is called; results must be presented as estimates.
 *
 * Rules (centavos, integer arithmetic):
 *   - Subtotal >= FREE_SHIPPING_THRESHOLD_CENTS → frete grátis (0 centavos, 5–7 dias)
 *   - CEP prefix 01–29 (sul/sudeste)            → R$ 15,90, 5–7 dias úteis
 *   - CEP prefix 30–59 (centro-oeste/nordeste)   → R$ 22,50, 7–10 dias úteis
 *   - CEP prefix 60–99 (norte/nordeste)          → R$ 28,90, 10–15 dias úteis
 */

export const FREE_SHIPPING_THRESHOLD_CENTS = 29900 // R$ 299,00

export interface FreightQuote {
  /** Freight cost in integer centavos. Zero means free shipping. */
  amountCents: number
  /** Estimated delivery range string, e.g. "5–7 dias úteis" */
  estimatedDays: string
  /** Human-readable label, always marked as an estimate */
  label: string
}

export type FreightError = { code: 'INVALID_CEP'; message: string }
export type FreightResult = { ok: true; quote: FreightQuote } | { ok: false; error: FreightError }

/** Normalize a CEP by stripping all non-digit characters. */
export function normalizeCep(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** Return true when the CEP is exactly 8 digits after normalization. */
export function isValidCep(raw: string): boolean {
  return /^\d{8}$/.test(normalizeCep(raw))
}

/** Return a deterministic freight quote for the given CEP and cart subtotal. */
export function quoteFreight(params: { cep: string; subtotalCents: number }): FreightResult {
  const digits = normalizeCep(params.cep)

  if (!/^\d{8}$/.test(digits)) {
    return {
      ok: false,
      error: { code: 'INVALID_CEP', message: 'CEP inválido. Informe um CEP com 8 dígitos.' },
    }
  }

  if (params.subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return {
      ok: true,
      quote: {
        amountCents: 0,
        estimatedDays: '5–7 dias úteis',
        label: 'Frete grátis (estimativa)',
      },
    }
  }

  const prefix = parseInt(digits.slice(0, 2), 10)

  if (prefix <= 29) {
    return {
      ok: true,
      quote: { amountCents: 1590, estimatedDays: '5–7 dias úteis', label: 'Estimativa de frete' },
    }
  }

  if (prefix <= 59) {
    return {
      ok: true,
      quote: { amountCents: 2250, estimatedDays: '7–10 dias úteis', label: 'Estimativa de frete' },
    }
  }

  return {
    ok: true,
    quote: { amountCents: 2890, estimatedDays: '10–15 dias úteis', label: 'Estimativa de frete' },
  }
}
