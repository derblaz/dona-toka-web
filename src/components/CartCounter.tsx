import { ShoppingBag } from 'lucide-react'

interface CartCounterProps {
  count?: number
}

export function CartCounter({ count = 0 }: CartCounterProps) {
  return (
    <a
      href="/carrinho"
      aria-label={count > 0 ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho, vazio'}
      className="relative inline-flex items-center p-2 text-text-primary hover:text-primary transition-colors"
    >
      <ShoppingBag size={22} aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </a>
  )
}
