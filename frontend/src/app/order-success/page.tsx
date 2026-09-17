import React from 'react';

export function OrderSuccessPage({ orderId, onOrders }: { orderId: string; onOrders: () => void }) {
  return <section className="mx-auto flex max-w-2xl justify-center px-6 py-16">
    <div className="w-full rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Pedido solicitado</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">¡Pedido solicitado con éxito!</h1>
      <p className="mx-auto mt-4 max-w-lg text-slate-600">En breve nos comunicaremos contigo vía WhatsApp para terminar con el proceso de pago.</p>
      <p className="mt-5 text-sm text-slate-500">Pedido: <strong className="text-slate-700">{orderId}</strong></p>
      <button type="button" onClick={onOrders} className="mt-8 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white">Ir a mis pedidos</button>
    </div>
  </section>;
}
