import { createFileRoute, Link } from '@tanstack/react-router'
import { getSessionOrder } from '@/features/checkout/service'
import {
  buildProviderReturnView,
  providerReturnSearchSchema,
} from '@/features/checkout/provider-return'
import { formatCurrency } from '@/lib/currency'

export const Route = createFileRoute('/pedido/$orderId')({
  validateSearch: (search) => providerReturnSearchSchema.parse(search),
  component: OrderPage,
})

function OrderPage() {
  const { orderId } = Route.useParams()
  const providerReturn = buildProviderReturnView(Route.useSearch())
  const order = getSessionOrder(orderId)

  if (!order) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-4xl text-text-primary mb-4">Pedido não encontrado</h1>
        <p className="text-text-secondary mb-8">
          Este pedido não está disponível ou não pertence a esta sessão.
        </p>
        <Link to="/" className="btn-primary px-8 py-3">
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
      <div className="flex flex-col gap-6 rounded-[var(--radius)] border border-border bg-surface p-8">
        <div className="text-center">
          <span className="mb-3 inline-block rounded-full bg-success/10 px-4 py-1 text-sm font-medium text-success">
            Resumo salvo
          </span>
          <h1 className="font-display text-3xl text-text-primary">Obrigada pela sua compra!</h1>
          <p className="mt-2 text-sm text-text-secondary">Pedido salvo em {formattedDate}</p>
        </div>

        <hr className="border-border" />

        <div>
          <p className="text-xs font-mono text-text-secondary">Nº do pedido</p>
          <p className="break-all font-semibold text-text-primary">{order.orderId}</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-text-primary">Itens</p>
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
            <span>{order.shippingCents === 0 ? 'Grátis' : formatCurrency(order.shippingCents)}</span>
          </div>
          <hr className="border-border" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(order.totalCents)}</span>
          </div>
        </div>

        <div className="rounded-[var(--radius)] bg-background p-4 text-sm">
          <p className="mb-1 font-semibold text-text-primary">Entrega estimada</p>
          <p className="text-text-secondary">{order.estimatedDelivery}</p>
          <p className="mt-2 text-xs italic text-text-secondary">
            Este resumo é preservado localmente enquanto o pagamento segue para a InfinitePay.
          </p>
        </div>

        <div className="rounded-[var(--radius)] bg-background p-4 text-sm">
          {providerReturn.hasDisplayableResult ? (
            <>
              <p className="font-semibold text-text-primary mb-1">Pagamento em confirmação</p>
              <p className="text-text-secondary">
                Os dados abaixo foram informados pelo provedor no retorno e servem apenas como
                referência. A confirmação definitiva do pagamento é feita pela loja.
              </p>
              <dl className="mt-3 flex flex-col gap-2">
                {providerReturn.captureMethodLabel && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Forma informada</dt>
                    <dd className="font-medium text-text-primary">
                      {providerReturn.captureMethodLabel}
                    </dd>
                  </div>
                )}
                {providerReturn.orderReference && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Referência do pedido</dt>
                    <dd className="break-all font-medium text-text-primary">
                      {providerReturn.orderReference}
                    </dd>
                  </div>
                )}
                {providerReturn.transactionReference && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Transação</dt>
                    <dd className="break-all font-medium text-text-primary">
                      {providerReturn.transactionReference}
                    </dd>
                  </div>
                )}
                {providerReturn.invoiceSlug && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">Fatura</dt>
                    <dd className="break-all font-medium text-text-primary">
                      {providerReturn.invoiceSlug}
                    </dd>
                  </div>
                )}
              </dl>
              {providerReturn.receiptUrl && (
                <a
                  href={providerReturn.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block font-medium text-primary hover:underline"
                >
                  Ver comprovante do provedor
                </a>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold text-text-primary mb-1">Pagamento em processamento</p>
              <p className="text-text-secondary">
                Ainda estamos aguardando a confirmação do provedor de pagamento. Assim que ela
                chegar, o status do seu pedido será atualizado automaticamente — você pode fechar
                esta página com segurança.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 text-center">
          <Link to="/colecao" className="btn-primary px-8 py-3">
            Continuar comprando
          </Link>
          <Link to="/" className="text-sm text-text-secondary transition-colors hover:text-primary">
            Voltar ao início
          </Link>
        </div>
      </div>
    </section>
  )
}
