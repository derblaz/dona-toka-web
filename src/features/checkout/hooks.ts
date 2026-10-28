import { useMutation } from '@tanstack/react-query'
import { submitGuestCheckout } from './api'
import type { GuestCheckoutConfirmation, GuestCheckoutVariables } from './api'

/**
 * Single typed boundary for guest checkout (task_08). Exposes pending,
 * success, conflict (`ShippingQuoteOutdatedError`), and failure states;
 * the cart store is never touched here, so a failed mutation preserves it.
 */
export function useGuestCheckout() {
  return useMutation<GuestCheckoutConfirmation, Error, GuestCheckoutVariables>({
    mutationFn: submitGuestCheckout,
  })
}
