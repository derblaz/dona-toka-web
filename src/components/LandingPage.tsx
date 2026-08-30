import { Link } from '@tanstack/react-router'

const products = [
    ['Clássica', 'Floral', 'Delicada, leve e cheia de personalidade.', '89,90'],
    ['Para você', 'Personalizada', 'Seu nome, sua profissão ou a sua arte.', '99,90'],
    ['Edição especial', 'Exclusiva', 'Estampas autorais em pequenas coleções.', '89,90'],
]

const steps = [
    ['Escolha o modelo', 'Defina o formato e o estilo da sua touca.'],
    ['Conte sua ideia', 'Envie uma imagem, nome, referência ou descreva o que imaginou.'],
    ['Aprove a arte', 'Nossa equipe prepara a composição para você visualizar antes da produção.'],
    ['Receba sua Dona Tôka', 'Produzimos sua peça com cuidado e enviamos para você.'],
]

export function LandingPage() {
    return (
        <div className="landing-page">
            <section className="hero"><div className="container hero-grid"><div>
                <div className="eyebrow">Toucas cirúrgicas · Dona Tôka</div>
                <h1>Sua touca,<br /><em>do seu jeito.</em></h1>
                <p className="hero-copy">Porque aquilo que você usa também pode contar um pouco sobre quem você é. Escolha uma estampa, personalize ou crie uma peça única para acompanhar sua rotina.</p>
                <div className="hero-actions"><Link className="btn black" to="/colecao">CRIAR MINHA TOUCA</Link><Link className="btn light" to="/colecao">VER COLEÇÃO</Link></div>
                <div className="hero-note"><div><strong>Personalização</strong>Seu nome, sua arte, sua identidade.</div><div><strong>Acabamento</strong>Peças feitas com atenção aos detalhes.</div></div>
            </div><div className="hero-visual"><img className="hero-image" src="/hero-modelo.png" alt="Modelo Dona Tôka" fetchPriority="high" /><div className="visual-label">Detalhes que<br />fazem você diferente.<span>Dona Tôka · Acessórios</span></div></div></div></section>
            <section className="intro"><div className="container intro-grid"><h2>Não é só uma touca.<br />É <em>o seu jeito</em> de vestir a profissão.</h2><p>A Dona Tôka nasceu para transformar um acessório do dia a dia em algo pessoal. Estampas, nomes, cores e ideias que fazem sentido para você — com um cuidado especial em cada peça.</p></div></section>
            <section className="section" id="colecao"><div className="container"><div className="section-head"><div><div className="eyebrow">Escolha a sua</div><h2>Nossa coleção</h2></div><div className="section-desc">Modelos para diferentes estilos. E, se nenhuma delas for exatamente você, crie a sua.</div></div><div className="products">{products.map(([category, name, description, price]) => <article className="product" key={name}><div className="product-image"><img src="/hero-modelo.png" alt="" /></div><div className="product-info"><small>{category}</small><h3>{name}</h3><p>{description}</p><div className="price">A partir de R$ {price}</div></div></article>)}</div></div></section>
            <section className="section personalize" id="personalize"><div className="container personalize-grid"><div><div className="eyebrow">Personalize</div><h2>Você imagina.<br />A gente cria.</h2><div className="steps">{steps.map(([title, text], index) => <div className="step" key={title}><div className="number">0{index + 1}</div><div><strong>{title}</strong><p>{text}</p></div></div>)}</div><Link className="btn black" to="/colecao">COMEÇAR PERSONALIZAÇÃO</Link></div><div className="custom-card"><div className="custom-photo"><img src="/hero-modelo.png" alt="Prévia de uma touca personalizada" /><div className="custom-name">Dra. Ana · Odontologia</div></div><div className="custom-footer"><span>Prévia de personalização</span><b>Sua touca do seu jeito.</b></div></div></div></section>
            <section className="brand" id="marca"><div className="container brand-grid"><div className="brand-logo"><img src="/logo-dona-toka.png" alt="Logo Dona Tôka" /></div><div className="brand-copy"><div className="eyebrow">Nossa essência</div><h2>Autêntica por natureza.</h2><p>A Dona Tôka acredita que os pequenos detalhes têm força. Por isso, criamos acessórios que unem personalidade e cuidado — peças para você usar no trabalho e ainda sentir que são realmente suas.</p><div className="signature">Sua touca do seu jeito.</div></div></div></section>
            <section className="testimonials" id="clientes"><div className="container testimonial-grid">{[['“Ficou exatamente como eu imaginei. A minha cara.”', 'Juliana · Enfermeira'], ['“O cuidado nos detalhes é o que mais gostei. Dá para perceber a qualidade.”', 'Carla · Dentista'], ['“Minha touca virou parte do meu estilo no consultório.”', 'Marina · Médica']].map(([quote, name]) => <article className="testimonial" key={name}><div className="stars">★★★★★</div><p>{quote}</p><small>{name}</small></article>)}</div></section>
            <section className="final-cta"><div className="container"><div className="eyebrow">Agora é com você</div><h2>Sua touca.<br /><em>Do seu jeito.</em></h2><p>Escolha uma das nossas estampas ou conte para a gente o que você gostaria de criar.</p><Link className="btn black" to="/colecao">QUERO CRIAR A MINHA</Link></div></section>
        </div>
    )
}
