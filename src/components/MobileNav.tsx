import { useState, useEffect, useCallback } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'

const NAV_LINKS = [
  { to: '/', label: 'Início' },
  { to: '/colecao', label: 'Coleção' },
  { to: '/carrinho', label: 'Carrinho' },
] as const

interface MobileNavProps {
  cartCount?: number
}

export function MobileNav({ cartCount = 0 }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, close])

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-[var(--radius)] p-2 text-text-primary hover:bg-surface-elevated transition-colors focus-visible:outline-2 focus-visible:outline-primary md:hidden"
      >
        {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>

      {open && (
        <div
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          className="absolute inset-x-0 top-full z-50 border-b border-border bg-surface shadow-floating md:hidden"
        >
          <nav aria-label="Navegação principal mobile">
            <ul className="flex flex-col py-2" role="list">
              {NAV_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={close}
                    className="block px-6 py-3 text-base font-medium text-text-primary hover:bg-surface-elevated hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                    activeProps={{ className: 'text-primary bg-surface-elevated' }}
                  >
                    {label}
                    {to === '/carrinho' && cartCount > 0 && (
                      <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
