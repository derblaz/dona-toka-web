import { createFileRoute } from '@tanstack/react-router'
import { catalogRepository } from '@/features/catalog/repository'
import { ProductDetail } from '@/features/catalog/ProductDetail'

export const Route = createFileRoute('/produto/$slug')({
  component: ProductPage,
})

function ProductPage() {
  const { slug } = Route.useParams()
  const product = catalogRepository.getProductBySlug(slug)

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl text-text-primary">Produto não encontrado</h1>
        <p className="mt-4 text-text-secondary">
          O produto que você está procurando não existe ou foi removido da coleção.
        </p>
        <a
          href="/colecao"
          className="mt-8 inline-flex rounded-[var(--radius)] bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          Ver coleção
        </a>
      </main>
    )
  }

  return (
    <main>
      <ProductDetail product={product} />
    </main>
  )
}
