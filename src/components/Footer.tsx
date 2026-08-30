import { Link } from '@tanstack/react-router'

export function Footer() {
    return (
        <footer aria-label="Rodapé">
            <div className="container footer-grid">
                <div><img className="footer-logo" src="/logo-dona-toka.png" alt="Dona Tôka" /><p className="footer-text">Acessórios feitos para você levar sua personalidade para onde estiver.</p></div>
                <nav className="footer-links" aria-label="Comprar"><div className="footer-title">Comprar</div><a href="#colecao">Coleção</a><a href="#personalize">Personalizadas</a><Link to="/colecao">Kits</Link></nav>
                <nav className="footer-links" aria-label="Dona Tôka"><div className="footer-title">Dona Tôka</div><a href="#marca">Sobre nós</a><a href="#personalize">Como funciona</a><a href="#clientes">Perguntas frequentes</a></nav>
                <nav className="footer-links" aria-label="Contato"><div className="footer-title">Contato</div><a href="https://wa.me/5511999999999">WhatsApp</a><a href="#">Instagram</a><a href="mailto:contato@donatoka.com.br">contato@donatoka.com.br</a></nav>
            </div>
            <div className="container copy"><span>© 2026 Dona Tôka Acessórios. Todos os direitos reservados.</span><span>Sua touca do seu jeito.</span></div>
        </footer>
    )
}