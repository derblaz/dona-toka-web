import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { toast } from 'sonner'
import { describe, it, expect } from 'vitest'
import { routeTree } from '@/routeTree.gen'

function renderApp(path = '/') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  return render(<RouterProvider router={router} />)
}

// ─── Unit: shell landmarks ───────────────────────────────────────────────────

describe('AppShell landmarks', () => {
  it('renders header, main, and footer semantic landmarks', async () => {
    renderApp()
    expect(await screen.findByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders a cart control link in the header', async () => {
    renderApp()
    await screen.findByRole('banner')
    const header = screen.getByRole('banner')
    expect(within(header).getByRole('link', { name: /carrinho/i })).toBeInTheDocument()
  })

  it('renders the primary navigation inside the header', async () => {
    renderApp()
    await screen.findByRole('banner')
    expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument()
  })
})

// ─── Unit: mobile navigation ─────────────────────────────────────────────────

describe('MobileNav keyboard and focus behavior', () => {
  it('renders a toggle button that starts closed (aria-expanded=false)', async () => {
    renderApp()
    await screen.findByRole('button', { name: /abrir menu/i })
    const btn = screen.getByRole('button', { name: /abrir menu/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the menu when the toggle button is clicked and exposes nav links', async () => {
    const user = userEvent.setup()
    renderApp()
    const btn = await screen.findByRole('button', { name: /abrir menu/i })
    await user.click(btn)
    const dialog = screen.getByRole('dialog', { name: /menu de navegação/i })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: /início/i })).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: /coleção/i })).toBeInTheDocument()
  })

  it('closes the menu when Escape is pressed', async () => {
    const user = userEvent.setup()
    renderApp()
    const btn = await screen.findByRole('button', { name: /abrir menu/i })
    await user.click(btn)
    expect(screen.getByRole('dialog', { name: /menu de navegação/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /menu de navegação/i })).not.toBeInTheDocument()
  })
})

// ─── Integration: outlet placement ───────────────────────────────────────────

describe('root route integration', () => {
  it('places the outlet content inside the main landmark', async () => {
    renderApp('/')
    const main = await screen.findByRole('main')
    expect(within(main).getByRole('heading', { name: /sua touca/i, level: 1 })).toBeInTheDocument()
  })
})

// ─── Integration: toaster ─────────────────────────────────────────────────────

describe('Toaster integration', () => {
  it('renders a success toast without leaking sensitive data', async () => {
    renderApp()
    await screen.findByRole('banner')

    toast.success('Produto adicionado ao carrinho!')

    const toastEl = await screen.findByText(/produto adicionado ao carrinho/i)
    expect(toastEl).toBeInTheDocument()
    expect(toastEl.textContent).not.toMatch(/cartão|card|cvv|cpf|senha/i)
  })
})
