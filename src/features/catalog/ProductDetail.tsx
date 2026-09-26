import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatCurrency, formatInstallments } from '@/lib/currency'
import { validateQuantity, MIN_QUANTITY, MAX_QUANTITY } from './validation'
import { ADD_TO_CART_EVENT } from './models'
import type { Product, CartItemSnapshot } from './models'
import { FreightEstimator } from '@/components/FreightEstimator'

interface ProductDetailProps {
  product: Product
}

const INSTALLMENTS = 3

export function ProductDetail({ product }: ProductDetailProps) {
  const galleryImages = useMemo(() => {
    const uniqueImages = [product.mainImageUrl, ...product.galleryImageUrls].filter((url) => typeof url === 'string' && url.trim().length > 0)
    return Array.from(new Set(uniqueImages.map((url) => url.trim())))
  }, [product])

  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(galleryImages[0] ?? '')
  const [quantityError, setQuantityError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedImage(galleryImages[0] ?? '')
  }, [galleryImages])

  const activeImage = selectedImage || product.mainImageUrl || galleryImages[0] || ''

  if (!product.active) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl text-text-primary">Produto indisponível</h1>
        <p className="mt-4 text-text-secondary">
          Este produto não está disponível no momento. Consulte a coleção para ver itens ativos.
        </p>
        <Link
          to="/colecao"
          className="btn-primary mt-8 px-5 py-3"
        >
          Ver coleção
        </Link>
      </main>
    )
  }

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

    const heroImage = activeImage || product.mainImageUrl || ''
    const snapshot: CartItemSnapshot = {
      productId: product.id,
      productName: product.name,
      variantId: product.id,
      variantName: product.name,
      slug: product.slug,
      priceCents: product.priceCents,
      quantity: result.data,
      image: {
        src: heroImage,
        alt: product.name,
        role: 'real-product',
        width: 1200,
        height: 1200,
      },
    }

    window.dispatchEvent(new CustomEvent(ADD_TO_CART_EVENT, { detail: snapshot }))
    toast.success(`${product.name} adicionado ao carrinho`)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="flex flex-col gap-3">
        <div className="relative rounded-[var(--radius)] overflow-hidden aspect-square bg-surface-elevated">
          {activeImage ? (
            <img
              src={activeImage}
              alt={product.name}
              width={1200}
              height={1200}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-secondary">
              Imagem indisponível
            </div>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="grid grid-cols-3 gap-2">
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedImage(image)}
                className={cn(
                  'rounded-[var(--radius)] overflow-hidden border-2 transition-colors',
                  selectedImage === image ? 'border-primary' : 'border-transparent',
                )}
                aria-label={`Ver imagem ${index + 1}`}
              >
                <img
                  src={image}
                  alt={`${product.name} imagem ${index + 1}`}
                  width={120}
                  height={90}
                  loading="lazy"
                  className="w-full object-cover aspect-[4/3]"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-3xl text-text-primary">{product.name}</h1>
          <p className="mt-2 text-text-secondary">{product.description}</p>
        </div>

        <div>
          <p className="text-3xl font-bold text-text-primary">{formatCurrency(product.priceCents)}</p>
          <p className="mt-1 text-sm text-text-secondary">
            ou {formatInstallments(product.priceCents, INSTALLMENTS)}
          </p>
        </div>

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

        <button
          type="button"
          onClick={handleAddToCart}
          className="btn-primary w-full py-3"
        >
          Adicionar ao carrinho
        </button>

        <FreightEstimator
          subtotalCents={product.priceCents * quantity}
          productId={product.id}
          quantity={quantity}
        />
      </div>
    </div>
  )
}
