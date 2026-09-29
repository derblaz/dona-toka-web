import { render, screen, waitFor } from '@testing-library/react'
import { AxiosError } from 'axios'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { _resetForTest, getItems } from '@/features/cart/store'
import * as checkoutNavigation from '@/features/checkout/navigation'
import { apiClient } from '@/lib/api-client'
import { getSessionOrder } from '@/features/checkout/service'
import { stripNonDigits } from '@/lib/masks'
import type { CartItem } from '@/features/cart/models'

let shippingQuoteMode: 'error' | 'empty' | 'multi' = 'error'

vi.mock('@/features/shipping/hooks', () => {
  class ShippingQuoteValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ShippingQuoteValidationError'
    }
  }

  return {
    ShippingQuoteValidationError,
    useShippingQuote: () => ({
      mutate: (
        _variables: unknown,
        options?: { onError?: (error: Error) => void; onSuccess?: (data: unknown) => void },
      ) => {
        if (shippingQuoteMode === 'empty') {
          options?.onSuccess?.({ options: [], freeShippingApplied: false, subtotalCents: 0 })
          return
        }

        if (shippingQuoteMode === 'multi') {
          options?.onSuccess?.({
            options: [
              { serviceCode: '1', carrierName: 'Econômico', priceCents: 1590, estimatedDays: 5 },
              { serviceCode: '2', carrierName: 'Expresso', priceCents: 2590, estimatedDays: 2 },
            ],
            freeShippingApplied: false,
            subtotalCents: 4900,
          })
          return
        }

        options?.onError?.(new Error('offline'))
      },
    }),
  }
})

const mockImage = {
  src: '/img/toca.jpg',
  alt: 'Touca cirúrgica',
  role: 'real-product' as const,
  width: 400,
  height: 400,
}

const cartItem: CartItem = {
  productId: 'p1',
  variantId: 'v1',
  productName: 'Touca Cirúrgica',
  variantName: 'Lisa',
  slug: 'toca-lisa',
  priceCents: 4900,
  quantity: 1,
  image: mockImage,
}

function renderRoute(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  render(<RouterProvider router={router} />)
  return router
}

function axiosHttpError(status: number, data: unknown): AxiosError {
  const error = new AxiosError(`Request failed with status code ${status}`)
  error.response = {
    status,
    statusText: '',
    headers: {},
    config: error.config!,
    data,
  }
  return error
}

beforeEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  _resetForTest([])
  shippingQuoteMode = 'error'
})

describe('checkout route — empty cart guard', () => {
  it('redirects to /carrinho when cart is empty', async () => {
    _resetForTest([])
    renderRoute('/checkout')

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /finalizar/i })).toBeNull()
    })

    await waitFor(() => {
      expect(
        screen.getByText(/seu carrinho está vazio/i) ||
          screen.getByRole('heading', { name: /carrinho/i }),
      ).toBeTruthy()
    })
  })
})

describe('checkout form — validation', () => {
  it('shows field errors when form is submitted empty', async () => {
    _resetForTest([cartItem])
    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    await userEvent.click(screen.getByRole('button', { name: /fazer pagamento/i }))

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    })
  })

  it('preserves valid entered values when validation fails', async () => {
    _resetForTest([cartItem])
    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    const nameInput = screen.getByLabelText(/nome completo/i)
    await userEvent.type(nameInput, 'Ana Lima')

    await userEvent.click(screen.getByRole('button', { name: /fazer pagamento/i }))

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    })

    expect(nameInput).toHaveValue('Ana Lima')
  })
})

describe('checkout — input masking', () => {
  it('displays masked phone and CPF/CNPJ values while keeping normalized digits available', async () => {
    _resetForTest([cartItem])
    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    const phoneInput = screen.getByLabelText(/telefone/i)
    const documentInput = screen.getByLabelText(/cpf ou cnpj/i)

    await userEvent.type(phoneInput, '11912345678')
    await userEvent.type(documentInput, '12345678909')

    expect(phoneInput).toHaveValue('(11) 91234-5678')
    expect(documentInput).toHaveValue('123.456.789-09')
    expect(stripNonDigits((phoneInput as HTMLInputElement).value)).toBe('11912345678')
    expect(stripNonDigits((documentInput as HTMLInputElement).value)).toBe('12345678909')
  })
})

describe('checkout — hosted-payment state', () => {
  it('redirects to the hosted checkout URL after a successful guest checkout', async () => {
    shippingQuoteMode = 'multi'
    _resetForTest([cartItem])
    const assignSpy = vi
      .spyOn(checkoutNavigation, 'redirectToHostedCheckout')
      .mockImplementation(() => undefined)
    let resolveCheckout: ((value: { data: unknown }) => void) | undefined
    vi.spyOn(apiClient, 'post').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCheckout = resolve
        }),
    )

    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    await userEvent.type(screen.getByLabelText(/nome completo/i), 'Ana Lima')
    await userEvent.type(screen.getByLabelText(/cpf ou cnpj/i), '12345678909')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'ana@example.com')
    await userEvent.type(screen.getByLabelText(/telefone/i), '11912345678')

    await userEvent.type(screen.getByLabelText(/cep/i), '01310100')
    await userEvent.click(screen.getByRole('button', { name: /calcular frete/i }))
    await screen.findByText(/estimativa de frete/i)

    await userEvent.type(screen.getByLabelText(/rua \/ avenida/i), 'Av. Paulista')
    await userEvent.type(screen.getByLabelText(/número/i), '1000')
    await userEvent.type(screen.getByLabelText(/bairro/i), 'Bela Vista')
    await userEvent.type(screen.getByLabelText(/cidade/i), 'São Paulo')
    await userEvent.type(screen.getByLabelText(/estado/i), 'SP')

    expect(screen.queryByRole('radio', { name: /pix/i })).toBeNull()
    expect(screen.queryByRole('radio', { name: /cartão/i })).toBeNull()
    expect(screen.queryByLabelText(/cvv/i)).toBeNull()
    expect(screen.queryByLabelText(/número do cartão/i)).toBeNull()
    expect(screen.queryByLabelText(/nome no cartão/i)).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: /fazer pagamento/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmando/i })).toBeDisabled()
    })
    expect(assignSpy).not.toHaveBeenCalled()

    resolveCheckout?.({
      data: {
        success: true,
        message: 'Guest checkout created.',
        data: {
          orderId: '9b1d2f3a-0000-4000-8000-000000000010',
          orderStatus: 'CREATED',
          paymentId: '9b1d2f3a-0000-4000-8000-000000000020',
          paymentStatus: 'PENDING',
          checkoutUrl: 'https://checkout.infinitepay.io/pay/abc',
          redirect: {
            returnUrl: 'http://localhost:5173/pedido/9b1d2f3a-0000-4000-8000-000000000010',
            checkoutUrl: 'https://checkout.infinitepay.io/pay/abc',
            orderId: '9b1d2f3a-0000-4000-8000-000000000010',
          },
        },
      },
    })

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledTimes(1)
    })

    const confirmationBucket = sessionStorage.getItem('dona-toka:checkout-confirmation-snapshots')
    expect(confirmationBucket).toContain('12345678909')
    expect(confirmationBucket).toContain('11912345678')
    expect(assignSpy).toHaveBeenCalledWith('https://checkout.infinitepay.io/pay/abc')

    // The snapshot is keyed by the backend order id so /pedido/{orderId} finds it on return.
    expect(getSessionOrder('9b1d2f3a-0000-4000-8000-000000000010')).toMatchObject({
      orderId: '9b1d2f3a-0000-4000-8000-000000000010',
    })
  })

  it('refreshes the displayed freight on shipping conflict and keeps the cart intact', async () => {
    shippingQuoteMode = 'multi'
    _resetForTest([cartItem])
    const assignSpy = vi
      .spyOn(checkoutNavigation, 'redirectToHostedCheckout')
      .mockImplementation(() => undefined)
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      axiosHttpError(409, {
        success: false,
        message: 'SHIPPING_QUOTE_OUTDATED',
        data: { shippingCents: 2250, totalCents: 12050 },
      }),
    )

    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    await userEvent.type(screen.getByLabelText(/nome completo/i), 'Ana Lima')
    await userEvent.type(screen.getByLabelText(/cpf ou cnpj/i), '12345678909')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'ana@example.com')
    await userEvent.type(screen.getByLabelText(/telefone/i), '11912345678')
    await userEvent.type(screen.getByLabelText(/cep/i), '01310100')
    await userEvent.click(screen.getByRole('button', { name: /calcular frete/i }))
    await screen.findByText(/estimativa de frete/i)

    await userEvent.type(screen.getByLabelText(/rua \/ avenida/i), 'Av. Paulista')
    await userEvent.type(screen.getByLabelText(/número/i), '1000')
    await userEvent.type(screen.getByLabelText(/bairro/i), 'Bela Vista')
    await userEvent.type(screen.getByLabelText(/cidade/i), 'São Paulo')
    await userEvent.type(screen.getByLabelText(/estado/i), 'SP')

    await userEvent.click(screen.getByRole('button', { name: /fazer pagamento/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/frete atualizado pelo backend/i)
    })
    expect(screen.getByRole('status')).toHaveTextContent(/r\$\s?22,50/i)
    expect(screen.getByRole('status')).toHaveTextContent(/r\$\s?120,50/i)
    expect(assignSpy).not.toHaveBeenCalled()
    expect(getItems()).toHaveLength(1)
    expect(getItems()[0]).toMatchObject({ productId: cartItem.productId, quantity: 1 })
  })

  it('shows an accessible error and preserves the cart on generic checkout failure', async () => {
    shippingQuoteMode = 'multi'
    _resetForTest([cartItem])
    const assignSpy = vi
      .spyOn(checkoutNavigation, 'redirectToHostedCheckout')
      .mockImplementation(() => undefined)
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      axiosHttpError(422, {
        success: false,
        message: 'The requested item total does not match the active catalog prices.',
        data: null,
      }),
    )

    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    await userEvent.type(screen.getByLabelText(/nome completo/i), 'Ana Lima')
    await userEvent.type(screen.getByLabelText(/cpf ou cnpj/i), '12345678909')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'ana@example.com')
    await userEvent.type(screen.getByLabelText(/telefone/i), '11912345678')
    await userEvent.type(screen.getByLabelText(/cep/i), '01310100')
    await userEvent.click(screen.getByRole('button', { name: /calcular frete/i }))
    await screen.findByText(/estimativa de frete/i)

    await userEvent.type(screen.getByLabelText(/rua \/ avenida/i), 'Av. Paulista')
    await userEvent.type(screen.getByLabelText(/número/i), '1000')
    await userEvent.type(screen.getByLabelText(/bairro/i), 'Bela Vista')
    await userEvent.type(screen.getByLabelText(/cidade/i), 'São Paulo')
    await userEvent.type(screen.getByLabelText(/estado/i), 'SP')

    await userEvent.click(screen.getByRole('button', { name: /fazer pagamento/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /the requested item total does not match the active catalog prices/i,
      )
    })
    expect(assignSpy).not.toHaveBeenCalled()
    expect(getItems()).toHaveLength(1)
    expect(getItems()[0]).toMatchObject({ productId: cartItem.productId, quantity: 1 })
    expect(sessionStorage.getItem('dona-toka:checkout-confirmation-snapshots')).toBeNull()
  })
})

describe('checkout — freight quote edge cases', () => {
  it('shows an invalid CEP error before requesting freight', async () => {
    _resetForTest([cartItem])
    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    await userEvent.type(screen.getByLabelText(/cep/i), '1234')
    await userEvent.click(screen.getByRole('button', { name: /calcular frete/i }))

    expect(screen.getByText(/cep inválido/i)).toBeInTheDocument()
    expect(screen.queryByText(/estimativa de frete/i)).toBeNull()
  })

  it('shows a shipping error when the backend returns no options', async () => {
    shippingQuoteMode = 'empty'
    _resetForTest([cartItem])
    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    await userEvent.type(screen.getByLabelText(/cep/i), '01310100')
    await userEvent.click(screen.getByRole('button', { name: /calcular frete/i }))

    expect(
      screen.getByText(/não foi possível calcular o frete para este cep/i),
    ).toBeInTheDocument()
  })

  it('allows switching between returned shipping options', async () => {
    shippingQuoteMode = 'multi'
    _resetForTest([cartItem])
    renderRoute('/checkout')
    await screen.findByRole('heading', { name: /finalizar/i })

    await userEvent.type(screen.getByLabelText(/cep/i), '01310100')
    await userEvent.click(screen.getByRole('button', { name: /calcular frete/i }))

    const expressOption = await screen.findByRole('radio', { name: /expresso/i })
    await userEvent.click(expressOption)

    expect(expressOption).toBeChecked()
    expect(screen.getByText(/entrega selecionada/i)).toBeInTheDocument()
  })
})

describe('/pedido/$orderId — unknown order', () => {
  it('renders not-found state for an unknown orderId', async () => {
    renderRoute('/pedido/unknown-order-xyz')

    await waitFor(() => {
      expect(screen.getByText(/pedido não encontrado/i)).toBeInTheDocument()
    })
  })
})
