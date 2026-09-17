import React, { useEffect, useState } from 'react';
import { api, type Product } from '../../api';

const categories = ['ALL', 'ACTUALES', 'RETROS', 'SELECCIONES', 'FEMENINO', 'NINOS'] as const;

export function CatalogPage({ onOpenProduct }: { onOpenProduct: (id: string) => void }) {
  const [search, setSearch] = useState('');
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

  return <section className="mx-auto max-w-6xl px-6 py-10"><div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Colección 2026</p><h1 className="text-4xl font-bold text-slate-950">Camisetas con historia</h1><p className="mt-2 max-w-xl text-slate-600">Encuentra tu próxima camiseta de fútbol, desde clásicos retro hasta las selecciones actuales.</p></div><label className="w-full max-w-md"><span className="mb-2 block text-sm font-medium text-slate-700">Buscar producto</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Barcelona, retro, selección..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900" /></label></div><div className="mb-7 flex flex-wrap gap-2">{categories.map((option) => <button key={option} type="button" onClick={() => setCategory(option)} className={`rounded-full border px-3 py-2 text-sm font-medium ${category === option ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{option === 'ALL' ? 'Todas' : option}</button>)}</div>{error ? <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error}. Verifica que el backend esté iniciado.</div> : products.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No encontramos productos para esta búsqueda.</div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => { const activeVariants = product.variants.filter((variant) => variant.isActive); const hasStock = activeVariants.some((variant) => variant.stock > 0); const firstVariant = activeVariants[0]; return <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex h-44 items-end bg-gradient-to-br from-amber-100 via-slate-100 to-sky-200 p-5"><span className="text-5xl">⚽</span></div><div className="space-y-4 p-5"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-amber-800">{product.category}</span><span className={`text-xs font-semibold ${hasStock ? 'text-emerald-600' : 'text-red-600'}`}>{hasStock ? 'Disponible' : 'Agotada'}</span></div><div><h2 className="text-xl font-bold">{product.name}</h2><p className="mt-2 text-sm text-slate-600">{product.description}</p></div><div className="flex items-center justify-between"><span className="text-xl font-bold">${firstVariant?.price.toFixed(2) ?? '0.00'}</span><span className="text-xs text-slate-500">{product.availabilityType === 'IMMEDIATE' ? 'Entrega inmediata' : 'Sobre pedido'}</span></div><div className="flex items-center justify-between gap-2"><span className="text-sm text-slate-600">{activeVariants.length} variantes</span><button type="button" onClick={() => onOpenProduct(product.id)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Ver detalle</button></div></div></article>; })}</div>}</section>;
}
