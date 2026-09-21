import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatCurrency, formatInstallments } from '@/lib/currency'
import { validateQuantity, MIN_QUANTITY, MAX_QUANTITY } from './validation'
import { ADD_TO_CART_EVENT } from './models'
import type { Product, ProductVariant, CartItemSnapshot } from './models'
import { FreightEstimator } from '@/components/FreightEstimator'

interface ProductDetailProps {
  product: Product
}

const INSTALLMENTS = 3

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0])
  const [quantity, setQuantity] = useState(1)
  const [imageRole, setImageRole] = useState<'layout' | 'real-product'>('real-product')
  const [quantityError, setQuantityError] = useState<string | null>(null)

  const layoutImage = selectedVariant.images.find((i) => i.role === 'layout')
  const realImage = selectedVariant.images.find((i) => i.role === 'real-product')
  const activeImage = imageRole === 'layout' ? layoutImage : realImage

  function handleQuantityChange(delta: number) {
    const next = quantity + delta
    const result = validateQuantity(next)
    if (result.success) {
      setQuantity(result.data)
      setQuantityError(null)
    }
  }

  function handleQuantityInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Number(e.target.value)
    const result = validateQuantity(raw)
    if (result.success) {
      setQuantity(result.data)
      setQuantityError(null)
    } else {
      setQuantityError(result.error)
    }
  }

  function handleAddToCart() {
    const result = validateQuantity(quantity)
    if (!result.success) {
      setQuantityError(result.error)
      return
    }

    const heroImage = selectedVariant.images.find((i) => i.role === 'real-product') ?? selectedVariant.images[0]
    const snapshot: CartItemSnapshot = {
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      slug: product.slug,
      priceCents: selectedVariant.priceCents,
      quantity: result.data,
      image: heroImage,
    }

    window.dispatchEvent(new CustomEvent(ADD_TO_CART_EVENT, { detail: snapshot }))
    toast.success(`${product.name} — ${selectedVariant.name} adicionado ao carrinho`)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* Gallery */}
      <div className="flex flex-col gap-3">
        <div className="relative rounded-[var(--radius)] overflow-hidden aspect-square bg-surface-elevated">
          {activeImage && (
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              width={activeImage.width}
              height={activeImage.height}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setImageRole('real-product')}
            aria-pressed={imageRole === 'real-product'}
            className={cn(
              'flex-1 rounded-[var(--radius)] border py-2 text-sm font-medium transition-colors',
              imageRole === 'real-product'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-text-secondary hover:border-primary',
            )}
          >
            Produto real
          </button>
          <button
            type="button"
            onClick={() => setImageRole('layout')}
            aria-pressed={imageRole === 'layout'}
            className={cn(
              'flex-1 rounded-[var(--radius)] border py-2 text-sm font-medium transition-colors',
              imageRole === 'layout'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-text-secondary hover:border-primary',
            )}
          >
            Layout
          </button>
        </div>
        {layoutImage && realImage && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setImageRole('real-product')}
              className={cn(
                'rounded-[var(--radius)] overflow-hidden border-2 transition-colors',
                imageRole === 'real-product' ? 'border-primary' : 'border-transparent',
              )}
              aria-label="Ver imagem do produto real"
            >
              <img
                src={realImage.src}
                alt={realImage.alt}
                width={120}
                height={90}
                loading="lazy"
                className="w-full object-cover aspect-[4/3]"
              />
            </button>
            <button
              type="button"
              onClick={() => setImageRole('layout')}
              className={cn(
                'rounded-[var(--radius)] overflow-hidden border-2 transition-colors',
                imageRole === 'layout' ? 'border-primary' : 'border-transparent',
              )}
              aria-label="Ver imagem do layout de personalização"
            >
              <img
                src={layoutImage.src}
                alt={layoutImage.alt}
                width={120}
                height={90}
                loading="lazy"
                className="w-full object-cover aspect-[4/3]"
              />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-3xl text-text-primary">{product.name}</h1>
          <p className="mt-2 text-text-secondary">{product.description}</p>
        </div>

        {/* Variant selector */}
        <div>
          <p className="mb-2 text-sm font-semibold text-text-primary">Variante: {selectedVariant.name}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Selecionar variante">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                role="radio"
                aria-checked={selectedVariant.id === variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={cn(
                  'rounded-[var(--radius)] border px-4 py-2 text-sm font-medium transition-colors',
                  selectedVariant.id === variant.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-text-secondary hover:border-primary',
                )}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <p className="text-3xl font-bold text-text-primary">{formatCurrency(selectedVariant.priceCents)}</p>
          <p className="mt-1 text-sm text-text-secondary">
            ou {formatInstallments(selectedVariant.priceCents, INSTALLMENTS)}
          </p>
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="mb-2 block text-sm font-semibold text-text-primary">
            Quantidade
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= MIN_QUANTITY}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border text-text-secondary hover:border-primary disabled:opacity-40 transition-colors"
            >
              −
            </button>
            <input
              id="quantity"
              type="number"
              value={quantity}
              min={MIN_QUANTITY}
              max={MAX_QUANTITY}
              onChange={handleQuantityInput}
              aria-invalid={quantityError != null}
              aria-describedby={quantityError ? 'quantity-error' : undefined}
              className="h-9 w-16 rounded-[var(--radius)] border border-border bg-surface text-center text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= MAX_QUANTITY}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border text-text-secondary hover:border-primary disabled:opacity-40 transition-colors"
            >
              +
            </button>
          </div>
          {quantityError && (
            <p id="quantity-error" role="alert" className="mt-1 text-sm text-danger">
              {quantityError}
            </p>
          )}
        </div>

        {/* Add to cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full rounded-[var(--radius)] bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          Adicionar ao carrinho
        </button>

        {/* Freight estimator */}
        <FreightEstimator
          subtotalCents={selectedVariant.priceCents * quantity}
          productId={product.id}
          quantity={quantity}
        />
      </div>
    </div>
  )
}
