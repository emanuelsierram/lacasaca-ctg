import React, { useEffect, useState } from 'react';
import { api, type Product } from '../../api';

const categories = ['ALL', 'ACTUALES', 'RETROS', 'SELECCIONES', 'FEMENINO', 'NINOS'] as const;

export function CatalogPage({ search, onOpenProduct }: { search: string; onOpenProduct: (id: string) => void }) {
  const [category, setCategory] = useState<(typeof categories)[number]>('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setError('');
      api.listProducts({ search, category }).then((result) => setProducts(result.items)).catch((reason: Error) => setError(reason.message));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [category, search]);

  return <section className="mx-auto max-w-6xl px-6 py-10">
    <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Colección 2026</p><h1 className="text-4xl font-bold text-slate-950">Camisetas con historia</h1><p className="mt-2 max-w-xl text-slate-600">Encuentra tu próxima camiseta de fútbol, desde clásicos retro hasta las selecciones actuales.</p></div>
    <div className="mb-7 flex flex-wrap gap-2">{categories.map((option) => <button key={option} type="button" onClick={() => setCategory(option)} className={`rounded-full border px-3 py-2 text-sm font-medium ${category === option ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{option === 'ALL' ? 'Todas' : option}</button>)}</div>
    {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error}. Verifica que el backend esté iniciado.</div> : products.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No encontramos productos para esta búsqueda.</div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => {
      const activeVariants = product.variants.filter((variant) => variant.isActive);
      const isMadeToOrder = product.availabilityType === 'MADE_TO_ORDER';
      const available = isMadeToOrder || activeVariants.some((variant) => variant.stock > 0);
      const firstVariant = activeVariants[0];
      const sizes = [...new Set(activeVariants.map((variant) => String(variant.attributes.size ?? '')).filter(Boolean))];
      return <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="relative flex h-44 items-end bg-gradient-to-br from-amber-100 via-slate-100 to-sky-200 p-5">{isMadeToOrder && <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold uppercase text-white">Pedido</span>}</div><div className="space-y-4 p-5"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-amber-800">{product.category}</span>{!isMadeToOrder && <span className={`text-xs font-semibold ${available ? 'text-emerald-600' : 'text-red-600'}`}>{available ? 'Disponible' : 'Agotada'}</span>}</div><div><h2 className="text-xl font-bold">{product.name}</h2><p className="mt-2 text-sm text-slate-600">{product.description}</p></div><div className="flex items-center justify-between"><span className="text-xl font-bold">${firstVariant?.price.toFixed(2) ?? '0.00'}</span><span className="text-xs text-slate-500">{isMadeToOrder ? 'Sobre pedido' : 'Entrega inmediata'}</span></div><div className="flex items-center justify-between gap-2"><span className="text-sm text-slate-600">{!isMadeToOrder && `Talla: ${sizes.join(', ') || 'Única'}`}</span><button type="button" onClick={() => onOpenProduct(product.id)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Ver detalle</button></div></div></article>;
  })}</div>}
  </section>;
}
