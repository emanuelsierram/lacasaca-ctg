import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminPage } from './app/admin/page';
import { HomePage } from './app/home/page';
import { AuthPage } from './app/auth/page';
import { ChangePasswordPage } from './app/auth/change-password';
import { CatalogPage } from './app/catalog/page';
import { ProductDetailPage } from './app/product/page';
import { CartView } from './cart';
import { CheckoutView } from './checkout';
import { OrdersPage } from './app/orders/page';
import { OrderSuccessPage } from './app/order-success/page';
import { api, type Cart, type Session } from './api';
import './styles.css';

const App = () => {
  const [route, setRoute] = React.useState(window.location.hash.slice(1) || 'home');
  const [search, setSearch] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [cart, setCart] = React.useState<Cart>({ id: 'guest-cart', items: [], total: 0 });
  const [session, setSession] = React.useState<Session | null>(() => {
    const saved = localStorage.getItem('lacasaca-session');
    return saved ? JSON.parse(saved) : null;
  });

  React.useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.slice(1) || 'catalog');
    window.addEventListener('hashchange', onHashChange);
    api.getCart().then(setCart).catch(() => undefined);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: string) => { window.location.hash = next; setMenuOpen(false); };
  const refreshCart = () => api.getCart().then(setCart);
  const saveSession = (next: Session) => {
    setSession(next);
    localStorage.setItem('lacasaca-session', JSON.stringify(next));
    localStorage.setItem('lacasaca-user-id', next.id);
  };
  const onAuth = (next: Session) => {
    saveSession(next);
    navigate('orders');
  };
  const logout = () => {
    setSession(null);
    localStorage.removeItem('lacasaca-session');
    localStorage.removeItem('lacasaca-user-id');
    navigate('auth');
  };
  const completePasswordSetup = () => {
    if (!session) return;
    const next = { ...session, mustChangePassword: false };
    setSession(next);
    localStorage.setItem('lacasaca-session', JSON.stringify(next));
    navigate('orders');
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 px-6 py-4 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <button className="shrink-0" onClick={() => navigate('home')} aria-label="Ir al inicio">
            <img src="/lacasaca-logo.svg" alt="Lacasaca" className="h-10 w-auto max-w-[220px] origin-left scale-[2.75] object-contain" />
          </button>
          <nav className="hidden min-w-0 items-center gap-5 text-sm md:flex">
            {route === 'catalog' && <label className="relative hidden min-w-0 sm:block"><span className="sr-only">Buscar producto</span><svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" strokeLinecap="round" /></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." aria-label="Buscar producto" className="w-56 rounded-lg border border-white/20 bg-white px-10 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-400 md:w-96" /></label>}
            <button onClick={() => navigate('home')}>Inicio</button>
            <button onClick={() => navigate('catalog')}>Catálogo</button>
            <button onClick={() => navigate('cart')} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h2l2.2 11h10.4L20 8H6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="19" r="1"/><circle cx="17" cy="19" r="1"/></svg>Carrito ({cart.items.length})</button>
            {session ? <><button onClick={() => navigate('orders')}>Mis pedidos</button>{session.role === 'ADMIN' && <button onClick={() => navigate('admin')}>Admin</button>}<button onClick={logout}>Salir</button></> : <button onClick={() => navigate('auth')}>Entrar</button>}
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => navigate('cart')} aria-label="Abrir carrito" className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-2"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h2l2.2 11h10.4L20 8H6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="19" r="1"/><circle cx="17" cy="19" r="1"/></svg><span>{cart.items.length}</span></button>
            <button onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} className="rounded-lg p-2 hover:bg-white/10"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d={menuOpen ? 'M6 6l12 12M18 6 6 18' : 'M4 6h16M4 12h16M4 18h16'} strokeLinecap="round" /></svg></button>
          </div>
        </div>
        {menuOpen && <div className="mx-auto mt-4 space-y-3 border-t border-white/10 pt-4 md:hidden">{route === 'catalog' && <label className="relative block"><span className="sr-only">Buscar producto</span><svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" strokeLinecap="round" /></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." aria-label="Buscar producto" className="w-full rounded-lg border border-white/20 bg-white px-9 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-400" /></label>}<button className="block w-full py-2 text-left" onClick={() => navigate('home')}>Inicio</button><button className="block w-full py-2 text-left" onClick={() => navigate('catalog')}>Catálogo</button>{session ? <><button className="block w-full py-2 text-left" onClick={() => navigate('orders')}>Mis pedidos</button>{session.role === 'ADMIN' && <button className="block w-full py-2 text-left" onClick={() => navigate('admin')}>Admin</button>}<button className="block w-full py-2 text-left" onClick={logout}>Salir</button></> : <button className="block w-full py-2 text-left" onClick={() => navigate('auth')}>Entrar</button>}</div>}
      </header>
      {session?.mustChangePassword && <button onClick={() => navigate('change-password')} className="w-full bg-amber-100 px-6 py-3 text-left text-sm font-semibold text-amber-950 underline">Crea tu contraseña para acceder fácilmente a tus pedidos.</button>}
      {route === 'home' && <HomePage onOpenProduct={(id) => navigate(`product/${id}`)} onOpenCatalog={() => navigate('catalog')} />}
      {route === 'catalog' && <CatalogPage search={search} onOpenProduct={(id) => navigate(`product/${id}`)} />}
      {route.startsWith('product/') && <ProductDetailPage productId={route.split('/')[1]} onCartChange={refreshCart} onBack={() => navigate('catalog')} />}
      {route === 'cart' && <CartView cart={cart} onChange={refreshCart} onCheckout={() => navigate('checkout')} />}
      {route === 'checkout' && <CheckoutView cart={cart} session={session} onCompleted={(id, account, madeToOrder) => {
        if (account) saveSession(account);
        if (madeToOrder) {
          const products = cart.items.map((item) => `${item.productName} Talla: ${item.variantLabel}`).join(', ');
          const text = `Hola, quiero finalizar el pedido de mi casaca: [${products}] realizado en lacasacactg.co. Deseo pagar el abono de 30%, me indicas los metodos de pago.`;
          window.location.assign(`https://api.whatsapp.com/send?phone=573246108197&text=${encodeURIComponent(text)}`);
          return;
        }
        navigate(account?.mustChangePassword ? 'change-password' : `order-success/${id}`);
      }} />}
      {route === 'auth' && <AuthPage onAuthenticated={onAuth} />}
      {route === 'change-password' && <ChangePasswordPage onCompleted={completePasswordSetup} />}
      {route === 'orders' && <OrdersPage />}
      {route.startsWith('order-success/') && <OrderSuccessPage orderId={route.split('/')[1]} onOrders={() => navigate('orders')} />}
      {route.startsWith('order/') && <OrdersPage selectedId={route.split('/')[1]} />}
      {route === 'admin' && <AdminPage />}
      <footer className="site-footer"><div><strong>Lacasaca Cartagena</strong><p>La camiseta que cuenta tu pasión.</p></div><div className="site-footer-links"><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a><a href="https://api.whatsapp.com/send?phone=573246108197" target="_blank" rel="noreferrer">WhatsApp</a><a href="#about">Sobre nosotros</a></div><small>© 2026 Lacasaca Cartagena</small></footer>
    </main>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
