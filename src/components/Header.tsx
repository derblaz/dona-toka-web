import { Link } from '@tanstack/react-router'
import { CartCounter } from './CartCounter'
import { MobileNav } from './MobileNav'

const NAV_LINKS = [
  { to: '/colecao', label: 'Coleção' },
  { to: '/', hash: 'personalize', label: 'Personalize' },
  { to: '/', hash: 'marca', label: 'A Dona Tôka' },
  { to: '/', hash: 'clientes', label: 'Clientes' },
] as const

interface HeaderProps {
  cartCount?: number
}

export function Header({ cartCount = 0 }: HeaderProps) {
  return (
    <>
      <div className="topbar">Toucas cirúrgicas personalizadas · Feitas com cuidado, pensadas para você</div>
      <header className="site-header">
        <div className="container site-nav">
          <Link
            to="/"
            aria-label="Dona Toka — página inicial"
            className="logo-link focus-visible:outline-2 focus-visible:outline-primary"
          >
            <img
              src="/logo-dona-toka.png"
              alt="Dona Tôka Acessórios"
              width={92}
              height={78}
              className="site-logo"
            />
          </Link>

          <nav aria-label="Navegação principal" className="desktop-menu">
            <ul role="list">
              {NAV_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    hash={'hash' in item ? item.hash : undefined}
                    className="focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <CartCounter count={cartCount} />
            <Link className="header-cta" to="/colecao">Sua touca do seu jeito →</Link>
            <MobileNav cartCount={cartCount} />
          </div>
        </div>
      </header>
    </>
  )
}
