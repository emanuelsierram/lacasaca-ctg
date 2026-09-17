import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminPage } from './app/admin/page';
import { AuthPage } from './app/auth/page';
import { CatalogPage } from './app/catalog/page';
import { ProductDetailPage } from './app/product/page';
import { CartView } from './cart';
import { CheckoutView } from './checkout';
import { OrdersPage } from './app/orders/page';
import { api, type Cart, type Session } from './api';
import './styles.css';

const App = () => {
  const [route, setRoute] = React.useState(window.location.hash.slice(1) || 'catalog');
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

  const navigate = (next: string) => { window.location.hash = next; };
  const refreshCart = () => api.getCart().then(setCart);
  const onAuth = (next: Session) => {
    setSession(next);
    localStorage.setItem('lacasaca-session', JSON.stringify(next));
    localStorage.setItem('lacasaca-user-id', next.id);
    navigate('orders');
  };
  const logout = () => {
    setSession(null);
    localStorage.removeItem('lacasaca-session');
    localStorage.removeItem('lacasaca-user-id');
    navigate('catalog');
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 px-6 py-4 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button className="text-left" onClick={() => navigate('catalog')}>
            <p className="text-xl font-bold">Lacasaca</p>
            <p className="text-xs text-slate-300">Camisetas que cuentan historias</p>
          </button>
          <nav className="flex items-center gap-3 text-sm">
            <button onClick={() => navigate('catalog')}>Catálogo</button>
            <button onClick={() => navigate('cart')} className="rounded-full bg-white/10 px-3 py-1.5">Carrito ({cart.items.length})</button>
            {session ? <><button onClick={() => navigate('orders')}>Mis pedidos</button>{session.role === 'ADMIN' && <button onClick={() => navigate('admin')}>Admin</button>}<button onClick={logout}>Salir</button></> : <button onClick={() => navigate('auth')}>Entrar</button>}
          </nav>
        </div>
      </header>
      {route === 'catalog' && <CatalogPage onOpenProduct={(id) => navigate(`product/${id}`)} />}
      {route.startsWith('product/') && <ProductDetailPage productId={route.split('/')[1]} onCartChange={refreshCart} onBack={() => navigate('catalog')} />}
      {route === 'cart' && <CartView cart={cart} onChange={refreshCart} onCheckout={() => navigate('checkout')} />}
      {route === 'checkout' && <CheckoutView cart={cart} session={session} onCompleted={(id) => navigate(`order/${id}`)} />}
      {route === 'auth' && <AuthPage onAuthenticated={onAuth} />}
      {route === 'orders' && <OrdersPage />}
      {route.startsWith('order/') && <OrdersPage selectedId={route.split('/')[1]} />}
      {route === 'admin' && <AdminPage />}
    </main>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
