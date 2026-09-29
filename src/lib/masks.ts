/**
 * Dependency-free input masking utilities for checkout contact and address
 * fields (ADR-004). Pure functions: display holds the formatted value while
 * schemas and the backend API work with digit-only values.
 */

/** Strip every non-digit character, keeping only `0-9`. */
export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Format a Brazilian phone as `(99) 99999-9999` (11 digits) or
 * `(99) 9999-9999` (10 digits), progressively while typing.
 * Input is normalized first and limited to 11 digits.
 */
export function formatPhone(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11)
  const len = digits.length

  if (len === 0) return ''
  if (len <= 2) return `(${digits}`
  if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (len <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/**
 * Format a CPF (`999.999.999-99`) or CNPJ (`99.999.999/9999-99`),
 * chosen by the normalized digit count: up to 11 digits is CPF,
 * 12–14 digits is CNPJ. Input is limited to 14 digits.
 */
export function formatCpfCnpj(value: string): string {
  const digits = stripNonDigits(value).slice(0, 14)
  const len = digits.length

  if (len <= 11) {
    if (len <= 3) return digits
    if (len <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (len <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  if (len <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

/**
 * Format a CEP as `99999-999`, progressively while typing.
 * Input is normalized first and limited to 8 digits.
 */
export function formatCep(value: string): string {
  const digits = stripNonDigits(value).slice(0, 8)

  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}
