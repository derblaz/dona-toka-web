import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { productQueryOptions } from '@/features/catalog/queries'
import { ProductDetail } from '@/features/catalog/ProductDetail'

export const Route = createFileRoute('/produto/$slug')({
  component: ProductPage,
})

function ProductPage() {
  const { slug } = Route.useParams()
  const { data: product, isPending, isError } = useQuery(productQueryOptions(slug))
  const loadError = isError && product === undefined
    ? 'Não foi possível carregar o produto no momento.'
    : null

  if (isPending) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="text-text-secondary">Carregando produto...</p>
      </main>
    )
  }

  if (!product) {
    if (loadError) {
      return (
        <main className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h1 className="font-display text-3xl text-text-primary">Erro ao carregar produto</h1>
          <p className="mt-4 text-text-secondary">{loadError}</p>
          <a
            href="/colecao"
            className="btn-primary mt-8 px-5 py-3"
          >
            Ver coleção
          </a>
        </main>
      )
    }

    return (
      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl text-text-primary">Produto não encontrado</h1>
        <p className="mt-4 text-text-secondary">
          O produto que você está procurando não existe ou foi removido da coleção.
        </p>
        <a
          href="/colecao"
          className="btn-primary mt-8 px-5 py-3"
        >
          Ver coleção
        </a>
      </main>
    )
  }

  if (!product.active) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl text-text-primary">Produto indisponível</h1>
        <p className="mt-4 text-text-secondary">
          Este item não está disponível no momento.
        </p>
        <a
          href="/colecao"
          className="btn-primary mt-8 px-5 py-3"
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
