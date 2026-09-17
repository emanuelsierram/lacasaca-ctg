import React, { useEffect, useState } from 'react';
import { api } from '../../api';

type OrderSummary = { id: string; status: string; total: number; createdAt: string };

export function OrdersPage({ selectedId }: { selectedId?: string }) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selected, setSelected] = useState<Awaited<ReturnType<typeof api.getOrder>> | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.listOrders().then((result) => setOrders(result.items)).catch((reason: Error) => setMessage(reason.message));
  }, []);
  useEffect(() => {
    if (selectedId) api.getOrder(selectedId).then(setSelected).catch((reason: Error) => setMessage(reason.message));
  }, [selectedId]);

  const cancel = (id: string) => api.cancelOrder(id).then(() => { setMessage('Pedido cancelado e inventario reintegrado.'); return api.listOrders(); }).then((result) => setOrders(result.items)).catch((reason: Error) => setMessage(reason.message));

  return <section className="mx-auto max-w-6xl px-6 py-10"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Cuenta</p><h1 className="text-3xl font-bold">Mis pedidos</h1><p className="mt-2 text-slate-600">Consulta el estado, pago y detalle de tus compras.</p></div>{message && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"><div className="space-y-3">{orders.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">Aún no tienes pedidos.</div> : orders.map((order) => <button key={order.id} onClick={() => { window.location.hash = `order/${order.id}`; }} className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm ${selected?.id === order.id ? 'border-slate-900' : 'border-slate-200'}`}><div className="flex justify-between gap-3"><strong>{order.id}</strong><span className="text-sm font-semibold text-amber-700">{order.status}</span></div><p className="mt-2 text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()} · ${order.total.toFixed(2)}</p></button>)}</div>{selected && <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-slate-500">Pedido</p><h2 className="text-2xl font-bold">{selected.id}</h2></div><div className="text-right"><p className="font-semibold">{selected.status}</p><p className="text-sm text-slate-500">Pago: {selected.paymentStatus}</p></div></div><div className="mt-6 space-y-3">{selected.items.map((item, index) => <div key={`${item.productName}-${index}`} className="flex justify-between border-b border-slate-100 py-3"><div><p className="font-semibold">{item.productName}</p><p className="text-sm text-slate-500">{item.quantity} × ${item.unitPriceSnapshot.toFixed(2)}</p></div><strong>${item.subtotal.toFixed(2)}</strong></div>)}</div><div className="mt-5 flex items-center justify-between text-lg font-bold"><span>Total</span><span>${selected.total.toFixed(2)}</span></div>{['PENDIENTE', 'EN_PREPARACION'].includes(selected.status) && <button onClick={() => cancel(selected.id)} className="mt-5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700">Cancelar pedido</button>}</article>}</div></section>;
}
