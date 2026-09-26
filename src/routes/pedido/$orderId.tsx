import { createFileRoute, Link } from '@tanstack/react-router'
import { getSessionOrder } from '@/features/checkout/service'
import { formatCurrency } from '@/lib/currency'

export const Route = createFileRoute('/pedido/$orderId')({
  component: OrderPage,
})

function OrderPage() {
  const { orderId } = Route.useParams()
  const order = getSessionOrder(orderId)

  if (!order) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-4xl text-text-primary mb-4">Pedido não encontrado</h1>
        <p className="text-text-secondary mb-8">
          Este pedido não está disponível ou não pertence a esta sessão.
        </p>
        <Link
          to="/"
          className="btn-primary px-8 py-3"
        >
          Voltar ao início
        </Link>
      </section>
    )
  }

  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  return (
    <section className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-[var(--radius)] border border-border bg-surface p-8 flex flex-col gap-6">
        <div className="text-center">
          <span className="inline-block mb-3 rounded-full bg-success/10 px-4 py-1 text-sm font-medium text-success">
            Pedido confirmado
          </span>
          <h1 className="font-display text-3xl text-text-primary">Obrigada pela sua compra!</h1>
          <p className="mt-2 text-text-secondary text-sm">
            Pedido realizado em {formattedDate}
          </p>
        </div>

        <hr className="border-border" />

        <div>
          <p className="text-xs text-text-secondary font-mono">Nº do pedido</p>
          <p className="font-semibold text-text-primary break-all">{order.orderId}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-text-primary mb-2">Itens</p>
          <ul className="flex flex-col gap-1">
            {order.itemsSnapshot.map((item) => (
              <li
                key={`${item.productId}-${item.variantId}`}
                className="flex justify-between text-sm"
              >
                <span className="text-text-secondary">
                  {item.productName} ({item.variantName}) × {item.quantity}
                </span>
                <span className="font-medium text-text-primary">
                  {formatCurrency(item.priceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Subtotal</span>
            <span>{formatCurrency(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Frete</span>
            <span>
              {order.freightCents === 0 ? 'Grátis' : formatCurrency(order.freightCents)}
            </span>
          </div>
          <hr className="border-border" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(order.totalCents)}</span>
          </div>
        </div>

        <div className="rounded-[var(--radius)] bg-background p-4 text-sm">
          <p className="font-semibold text-text-primary mb-1">Entrega estimada</p>
          <p className="text-text-secondary">{order.estimatedDelivery}</p>
          <p className="mt-2 text-xs text-text-secondary italic">
            O prazo de entrega é uma estimativa. O valor final do frete e o prazo exato são
            confirmados após o processamento do pedido.
          </p>
        </div>

        <div className="rounded-[var(--radius)] bg-background p-4 text-sm">
          <p className="font-semibold text-text-primary mb-1">
            Forma de pagamento:{' '}
            <span className="font-normal">
              {order.paymentType === 'pix' ? 'PIX' : 'Cartão de crédito'}
            </span>
          </p>
          {order.paymentType === 'pix' && (
            <p className="text-text-secondary">
              Você receberá as instruções de pagamento PIX no e-mail cadastrado.
            </p>
          )}
          {order.paymentType === 'card' && (
            <p className="text-text-secondary">
              Seu pedido foi recebido e será processado em breve.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 text-center">
          <Link
            to="/colecao"
            className="btn-primary px-8 py-3"
          >
            Continuar comprando
          </Link>
          <Link to="/" className="text-sm text-text-secondary hover:text-primary transition-colors">
            Voltar ao início
          </Link>
        </div>
      </div>
    </section>
  )
}
