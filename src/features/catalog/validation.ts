import { z } from 'zod'

export const MAX_QUANTITY = 10
export const MIN_QUANTITY = 1

export const quantitySchema = z
  .number({
    required_error: 'Quantidade é obrigatória',
    invalid_type_error: 'Quantidade deve ser um número',
  })
  .int({ message: 'Quantidade deve ser um número inteiro' })
  .min(MIN_QUANTITY, { message: `Quantidade mínima é ${MIN_QUANTITY}` })
  .max(MAX_QUANTITY, { message: `Quantidade máxima é ${MAX_QUANTITY}` })

export function validateQuantity(value: unknown): { success: true; data: number } | { success: false; error: string } {
  const result = quantitySchema.safeParse(value)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Quantidade inválida' }
}
