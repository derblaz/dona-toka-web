import { createFileRoute } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useCartStore } from '@/features/cart/hooks'
import { formatCurrency } from '@/lib/currency'
import { validateQuantity } from '@/features/catalog/validation'
import { FreightEstimator } from '@/components/FreightEstimator'
import type { FreightQuote } from '@/lib/freight'

export const Route = createFileRoute('/carrinho')({
  component: CartPage,
})

function CartPage() {
  const { items, itemCount, subtotalCents, updateQuantity, removeItem, clearCart } =
    useCartStore()
  const [freightQuote, setFreightQuote] = useState<FreightQuote | null>(null)
  const totalCents = subtotalCents + (freightQuote?.amountCents ?? 0)

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h1 className="font-display text-4xl text-text-primary">Seu carrinho está vazio</h1>
        <p className="mt-4 text-text-secondary">
          Explore nossa coleção e adicione produtos ao carrinho.
        </p>
        <Link
          to="/colecao"
          className="btn-primary mt-8 px-8 py-3"
        >
          Ver coleção
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl text-text-primary">Carrinho</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm text-danger hover:underline"
          aria-label="Limpar carrinho"
        >
          Limpar carrinho
        </button>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Line items */}
        <ul className="flex flex-1 flex-col gap-4" aria-label="Itens do carrinho">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.variantId}`}
              className="flex gap-4 rounded-[var(--radius)] border border-border bg-surface p-4"
            >
              <img
                src={item.image.src}
                alt={item.image.alt}
                width={96}
                height={96}
                className="h-24 w-24 rounded-[var(--radius)] object-cover"
                loading="lazy"
              />
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">{item.productName}</p>
                    <p className="text-sm text-text-secondary">{item.variantName}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remover ${item.productName} — ${item.variantName}`}
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-text-secondary transition-colors hover:text-danger"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2" role="group" aria-label="Quantidade">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      disabled={item.quantity <= 1}
                      onClick={() => {
                        const r = validateQuantity(item.quantity - 1)
                        if (r.success) updateQuantity(item.productId, item.variantId, r.data)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-border text-text-secondary transition-colors hover:border-primary disabled:opacity-40"
                    >
                      −
                    </button>
                    <span
                      aria-label={`Quantidade: ${item.quantity}`}
                      className="w-8 text-center text-sm font-medium"
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      disabled={item.quantity >= 10}
                      onClick={() => {
                        const r = validateQuantity(item.quantity + 1)
                        if (r.success) updateQuantity(item.productId, item.variantId, r.data)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-border text-text-secondary transition-colors hover:border-primary disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-semibold text-text-primary">
                    {formatCurrency(item.priceCents * item.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Order summary */}
        <aside className="lg:w-80" aria-label="Resumo do pedido">
          <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text-primary">Resumo do pedido</h2>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">
                Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
              </span>
              <span className="font-medium text-text-primary">{formatCurrency(subtotalCents)}</span>
            </div>
            <FreightEstimator
              subtotalCents={subtotalCents}
              items={items.map(({ productId, quantity }) => ({ productId, quantity }))}
              onQuote={setFreightQuote}
            />
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Frete (estimativa)</span>
              <span className="font-medium text-text-primary">
                {freightQuote == null
                  ? 'Informe o CEP'
                  : freightQuote.amountCents === 0
                    ? 'Grátis'
                    : formatCurrency(freightQuote.amountCents)}
              </span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between font-semibold">
              <span>Total estimado</span>
              <span>{formatCurrency(totalCents)}</span>
            </div>
            <p className="text-xs text-text-secondary italic">
              Frete e prazo são estimativas. O valor final é confirmado no checkout.
            </p>
            <a
              href="/checkout"
              className="btn-primary w-full py-3 text-center"
            >
              Ir para o checkout
            </a>
          </div>
        </aside>
      </div>
    </section>
  )
}

