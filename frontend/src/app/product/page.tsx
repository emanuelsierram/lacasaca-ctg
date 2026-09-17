import React, { useEffect, useState } from 'react';
import { api, type Product } from '../../api';
import { madeToOrderPrice } from '../../pricing';

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
const versions = ['Fan', 'Player'];
const tournaments = ['Liga', 'Copa', 'Champions League', 'Copa Libertadores', 'Mundial'];

type MadeToOrderAttributes = { size: string; version: string; longSleeves: boolean; tournament: string; dorsal: string };
const emptyMadeToOrder: MadeToOrderAttributes = { size: '', version: 'Fan', longSleeves: false, tournament: '', dorsal: '' };

export function ProductDetailPage({ productId, onCartChange, onBack }: { productId: string; onCartChange: () => void; onBack: () => void }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [madeToOrderAttributes, setMadeToOrderAttributes] = useState<MadeToOrderAttributes>(emptyMadeToOrder);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getProduct(productId).then((next) => {
      setProduct(next);
      setSelectedVariantId(next.variants.find((variant) => variant.isActive)?.id ?? '');
      setMadeToOrderAttributes(emptyMadeToOrder);
    }).catch((reason: Error) => setMessage(reason.message));
  }, [productId]);

  if (!product) return <section className="mx-auto max-w-3xl px-6 py-12 text-center">{message || 'Cargando producto...'}</section>;
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const isMadeToOrder = product.availabilityType === 'MADE_TO_ORDER';
  const selectedVariant = activeVariants.find((variant) => variant.id === selectedVariantId);
  const baseVariant = activeVariants[0] ?? selectedVariant;
  const madeToOrderComplete = isMadeToOrder && Boolean(madeToOrderAttributes.size);
  const available = isMadeToOrder ? madeToOrderComplete : Boolean(selectedVariant && selectedVariant.stock > 0);
  const price = isMadeToOrder && baseVariant ? madeToOrderPrice(baseVariant.price, madeToOrderAttributes) : selectedVariant?.price ?? 0;
  const updateAttribute = (field: keyof MadeToOrderAttributes, value: string | boolean) => setMadeToOrderAttributes((current) => ({ ...current, [field]: value }));
  const addToCart = () => {
    const variant = isMadeToOrder ? baseVariant : selectedVariant;
    if (!variant || !available) { setMessage('Selecciona una talla para continuar.'); return; }
    const attributes = isMadeToOrder ? { size: madeToOrderAttributes.size, version: madeToOrderAttributes.version, 'long-sleeves': madeToOrderAttributes.longSleeves, tournament: madeToOrderAttributes.tournament, dorsal: madeToOrderAttributes.dorsal } : undefined;
    api.addToCart(variant.id, 1, attributes).then(() => { setMessage('Producto agregado al carrito.'); onCartChange(); }).catch((reason: Error) => setMessage(reason.message));
  };

  return <section className="mx-auto max-w-6xl px-6 py-10"><button onClick={onBack} className="mb-4 text-sm font-semibold text-slate-600">← Volver al catálogo</button><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="grid gap-8 p-6 md:grid-cols-2 md:p-8"><div className="flex min-h-[320px] items-end rounded-2xl bg-gradient-to-br from-amber-100 via-slate-100 to-sky-200 p-8"><span className="text-8xl">⚽</span></div><div className="flex flex-col justify-center"><div className="mb-4 flex items-center gap-3"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-amber-800">{product.category}</span><span className={`text-sm font-semibold ${available ? 'text-emerald-600' : 'text-red-600'}`}>{available ? (isMadeToOrder ? 'Disponible sobre pedido' : 'Disponible') : 'Agotada'}</span></div><h1 className="text-3xl font-bold">{product.name}</h1><p className="mt-3 text-slate-600">{product.description}</p>{isMadeToOrder ? <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Talla (obligatoria)<select required value={madeToOrderAttributes.size} onChange={(event) => updateAttribute('size', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">Selecciona</option>{sizes.map((size) => <option key={size}>{size}</option>)}</select></label><label className="text-sm font-medium">Versión<select value={madeToOrderAttributes.version} onChange={(event) => updateAttribute('version', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">Selecciona</option>{versions.map((version) => <option key={version}>{version}</option>)}</select></label><label className="text-sm font-medium">Manga larga<select value={madeToOrderAttributes.longSleeves ? 'true' : 'false'} onChange={(event) => updateAttribute('longSleeves', event.target.value === 'true')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="false">No</option><option value="true">Sí</option></select></label><label className="text-sm font-medium">Torneo<select value={madeToOrderAttributes.tournament} onChange={(event) => updateAttribute('tournament', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">Ninguno</option>{tournaments.map((tournament) => <option key={tournament}>{tournament}</option>)}</select></label><label className="text-sm font-medium sm:col-span-2">Dorsal<input value={madeToOrderAttributes.dorsal} onChange={(event) => updateAttribute('dorsal', event.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div> : <div className="mt-6"><p className="text-sm font-medium">Talla</p><div className="mt-3 flex flex-wrap gap-3">{activeVariants.map((variant) => <button key={variant.id} type="button" onClick={() => setSelectedVariantId(variant.id)} className={`rounded-xl border px-4 py-2 ${selectedVariantId === variant.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'}`}>{String(variant.attributes.size ?? 'Única')}</button>)}</div></div>}<div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-200 pt-5"><div><p className="text-sm text-slate-500">Precio</p><p className="text-3xl font-bold">${price.toFixed(2)}</p>{isMadeToOrder && <p className="text-xs text-slate-500">Los recargos se calculan según tus opciones.</p>}</div><button type="button" disabled={!available} onClick={addToCart} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{available ? 'Agregar al carrito' : 'Selecciona una talla'}</button></div>{message && <p className="mt-3 text-sm text-slate-600">{message}</p>}</div></div></div></section>;
}
