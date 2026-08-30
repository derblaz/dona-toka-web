import { useEffect, useReducer } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { Header } from './Header'
import { Footer } from './Footer'
import * as cartStore from '@/features/cart/store'
import { ADD_TO_CART_EVENT } from '@/features/catalog/models'

export function AppShell() {
  const [, rerender] = useReducer((x: number) => x + 1, 0)

  useEffect(() => cartStore.subscribe(rerender), [])

  useEffect(() => {
    function handleAddToCart(event: CustomEvent) {
      cartStore.addItem(event.detail)
    }
    window.addEventListener(ADD_TO_CART_EVENT, handleAddToCart)
    return () => window.removeEventListener(ADD_TO_CART_EVENT, handleAddToCart)
  }, [])

  const cartCount = cartStore.getItemCount()

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius)] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Ir para conteúdo principal
      </a>

      <Header cartCount={cartCount} />

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <Toaster richColors position="bottom-right" />
    </div>
  )
}
