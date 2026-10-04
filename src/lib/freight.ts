export interface FreightQuote {
  /** Freight cost in integer centavos. Zero means free shipping. */
  amountCents: number
  /** Estimated delivery range string, e.g. "5–7 dias úteis" */
  estimatedDays: string
  /** Human-readable label, always marked as an estimate */
  label: string
}

/** Normalize a CEP by stripping all non-digit characters. */
export function normalizeCep(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** Return true when the CEP is exactly 8 digits after normalization. */
export function isValidCep(raw: string): boolean {
  return /^\d{8}$/.test(normalizeCep(raw))
}
