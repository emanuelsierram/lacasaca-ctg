import React, { useEffect, useState } from 'react';
import { api, type Product } from '../../api';
import { formatCOP } from '../../currency';

const heroImage = 'https://cccartagena.com/wp-content/uploads/2019/01/cartagena1.jpg';

const slides = [
  {
    image: 'https://assets.goal.com/images/v3/blt0562414eefe1cf28/Manchester%20United%2026-27%20away%20kit%20.jpg?auto=webp&format=pjpg&width=3840&quality=60',
    label: 'Pasión que se lleva puesta',
  },
  {
    image: 'https://fotografias.antena3.com/clipping/cmsimages01/2026/07/23/9710FCDD-0DCC-472A-A117-F1255D41F9C4/segunda-equipacion-real-madrid-2026-27_69.jpg?crop=3840,2160,x0,y0&width=1280&height=720&optimize=low&format=webply',
    label: 'Tu equipo, tu historia',
  },
  {
    image: 'https://assets.goal.com/images/v3/blt1eeac0e49031b42a/Juventus%2026:27%20home%20kit%20.jpg',
    label: 'Viste el momento',
  },
];

function ProductStrip({ products, onOpenProduct, twoPerRow = false }: { products: Product[]; onOpenProduct: (id: string) => void; twoPerRow?: boolean }) {
  const [start, setStart] = useState(0);
  const carouselProducts = products.slice(0, 10);
  const visibleProducts = Array.from({ length: Math.min(4, carouselProducts.length) }, (_, index) => carouselProducts[(start + index) % carouselProducts.length]);
  const canMove = carouselProducts.length > 4;

  return (
    <div className="home-product-carousel">
      {canMove && <button type="button" className="home-product-control home-product-control-prev" onClick={() => setStart((current) => (current - 1 + carouselProducts.length) % carouselProducts.length)} aria-label="Productos anteriores">←</button>}
      <div className={`home-product-strip${twoPerRow ? ' home-product-strip-two' : ''}`}>
      {visibleProducts.map((product) => {
        const variant = product.variants.find((item) => item.isActive);
        const image = product.images?.[0] ?? product.featuredImage;
        return (
          <article className="home-product-card" key={product.id}>
            <button type="button" className="home-product-image" onClick={() => onOpenProduct(product.id)} aria-label={`Ver ${product.name}`}>
              {image ? <img src={image} alt={product.name} /> : <span>Sin imagen</span>}
              <span className="home-product-tag">{product.category}</span>
            </button>
            <div className="home-product-info">
              <h3>{product.name}</h3>
              <div className="home-product-meta">
                <strong>{formatCOP(variant?.price ?? 0)}</strong>
                <button type="button" onClick={() => onOpenProduct(product.id)}>Ver casaca <span aria-hidden="true">↗</span></button>
              </div>
            </div>
          </article>
        );
      })}
      </div>
      {canMove && <button type="button" className="home-product-control home-product-control-next" onClick={() => setStart((current) => (current + 1) % carouselProducts.length)} aria-label="Más productos">→</button>}
    </div>
  );
}

function DeliveryIcon() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="delivery-icon" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="24" r="3" /><circle cx="24" cy="24" r="3" /><path d="M12 24h9l3-9h-8l-3-5H8" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 15h5l3 5h-5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function WhatsAppIcon() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="whatsapp-icon" fill="currentColor"><path d="M16 3.5A12.45 12.45 0 0 0 5.25 22.25L3.5 28.5l6.4-1.68A12.5 12.5 0 1 0 16 3.5Zm0 22.65a10.1 10.1 0 0 1-5.15-1.42l-.37-.22-3.8 1 1.02-3.7-.24-.38A10.12 10.12 0 1 1 16 26.15Zm5.55-7.56c-.3-.15-1.78-.88-2.05-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.07a8.3 8.3 0 0 1-2.4-1.48 9.1 9.1 0 0 1-1.67-2.08c-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.1 4.49.71.3 1.27.48 1.7.61.72.23 1.37.2 1.89.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.12-.27-.2-.57-.35Z" /></svg>;
}

export function HomePage({ onOpenProduct, onOpenCatalog }: { onOpenProduct: (id: string) => void; onOpenCatalog: () => void }) {
  const [slide, setSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listProducts().then((result) => setProducts(result.items)).catch((reason: Error) => setError(reason.message));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const immediate = products.filter((product) => product.availabilityType === 'IMMEDIATE');
  const madeToOrder = products.filter((product) => product.availabilityType === 'MADE_TO_ORDER');
  const whatsapp = 'https://api.whatsapp.com/send?phone=573246108197&text=Hola%2C%20quiero%20consultar%20por%20una%20casaca%20de%20f%C3%BAtbol.';

  return (
    <div className="home-page">
      <section className="home-hero">
        <img src={heroImage} alt="Camiseta de fútbol" className="home-hero-image" />
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <p className="home-kicker">Fútbol para vestir</p>
          <h1>Lacasaca Cartagena</h1>
          <p>Las mejores casacas de fútbol de la más alta calidad con los mejores precios del mercado. Cuidando cada detalle para ofrecerte una camiseta que esté a la altura de tu pasión.</p>
          <div className="home-delivery"><DeliveryIcon /><span>DOMICILIO GRATIS A TODA CARTAGENA</span></div>
        </div>
        <button type="button" className="home-hero-action" onClick={() => document.getElementById('inmediata')?.scrollIntoView({ behavior: 'smooth' })}>Explorar colección <span aria-hidden="true">↓</span></button>
      </section>

      <section className="home-carousel-section" aria-label="Colección destacada">
        <div className="home-section-heading home-carousel-heading"><div><p className="home-kicker">La cancha te llama</p><h2>Hechas para alentar</h2></div><div className="home-carousel-controls"><button type="button" onClick={() => setSlide((slide - 1 + slides.length) % slides.length)} aria-label="Imagen anterior">←</button><span>{String(slide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span><button type="button" onClick={() => setSlide((slide + 1) % slides.length)} aria-label="Imagen siguiente">→</button></div></div>
        <div className="home-carousel-frame"><img src={slides[slide].image} alt={slides[slide].label} /><div className="home-carousel-caption"><span>{slides[slide].label}</span><span>0{slide + 1}</span></div></div>
      </section>

      <section id="inmediata" className="home-products-section">
        <div className="home-section-heading"><div><p className="home-kicker">Para hoy</p><h2>Nuestras mejores Casacas</h2><p>Entrega inmediata con domicilio gratis a toda Cartagena, paga por transferencia o en efectivo al recibir el producto.</p></div><button type="button" onClick={onOpenCatalog} className="home-see-all">Ver catálogo <span aria-hidden="true">↗</span></button></div>
        {error ? <p className="home-api-message">{error}. Verifica que el backend esté iniciado.</p> : immediate.length ? <ProductStrip products={immediate} onOpenProduct={onOpenProduct} twoPerRow /> : <p className="home-api-message">Cargando nuestra colección...</p>}
      </section>

      <section className="home-products-section home-order-section">
        <div className="home-section-heading"><div><p className="home-kicker">Diseñada para ti</p><h2>Casacas a pedido</h2><p>Casacas disponibles de 15 a 20 días, solicítala pagando solo el 30% del valor total. Personalízala a tu gusto.</p></div><button type="button" onClick={onOpenCatalog} className="home-see-all">Ver catálogo <span aria-hidden="true">↗</span></button></div>
        {madeToOrder.length ? <ProductStrip products={madeToOrder} onOpenProduct={onOpenProduct} twoPerRow /> : <p className="home-api-message">Próximamente más diseños para personalizar.</p>}
      </section>

      <section className="home-contact-section"><div><p className="home-kicker">Tu próxima casaca existe</p><h2>¿No encuentras tu casaca favorita?</h2><p>Puedes decirnos la referencia y te la hacemos llegar.</p></div><a className="whatsapp-button" href={whatsapp} target="_blank" rel="noreferrer"><WhatsAppIcon /> Contactar por WhatsApp</a></section>
    </div>
  );
}