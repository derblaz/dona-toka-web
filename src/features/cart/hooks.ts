import { useEffect, useReducer } from 'react'
import * as cartStore from './store'
import type { CartItem } from './models'

export interface CartState {
  items: CartItem[]
  itemCount: number
  subtotalCents: number
  totalCents: number
  addItem: typeof cartStore.addItem
  updateQuantity: typeof cartStore.updateQuantity
  removeItem: typeof cartStore.removeItem
  clearCart: typeof cartStore.clearCart
}

export function useCartStore(): CartState {
  const [, rerender] = useReducer((x: number) => x + 1, 0)

  useEffect(() => cartStore.subscribe(rerender), [])

  return {
    items: cartStore.getItems(),
    itemCount: cartStore.getItemCount(),
    subtotalCents: cartStore.getSubtotalCents(),
    totalCents: cartStore.getTotalCents(),
    addItem: cartStore.addItem,
    updateQuantity: cartStore.updateQuantity,
    removeItem: cartStore.removeItem,
    clearCart: cartStore.clearCart,
  }
}
