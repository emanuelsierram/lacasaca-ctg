import React, { useState } from 'react';
import { api, type Cart, type PaymentMethod, type Session } from './api';
import { formatCOP } from './currency';

export function CheckoutView({ cart, session, onCompleted }: { cart: Cart; session: Session | null; onCompleted: (id: string, account?: Session, madeToOrder?: boolean) => void }) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WHATSAPP_TRANSFER');
  const [name, setName] = useState(session?.name ?? '');
  const [email, setEmail] = useState(session?.email ?? '');
  const [address, setAddress] = useState(session?.address ?? '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const isMadeToOrder = cart.items.length > 0 && cart.items.every((item) => item.availabilityType === 'MADE_TO_ORDER');
  const shippingCost = cart.items.length > 0 ? 9990 : 0;
  const total = cart.total + shippingCost;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (isMadeToOrder) {
      onCompleted('', undefined, true);
      return;
    }
    api.checkout({
      paymentMethod,
      guestCheckout: !session,
      customer: { name, email, address, phone }
    }).then((result) => onCompleted(result.orderId, result.account, isMadeToOrder)).catch((reason: Error) => setMessage(reason.message));
  };

  return <section className="mx-auto max-w-3xl px-6 py-10">
    <h1 className="mb-6 text-3xl font-bold">Checkout</h1>
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Nombre<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      </div>
      <label className="mt-4 block text-sm font-medium">Dirección de entrega<input required minLength={5} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Barrio, calle, número" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <label className="mt-4 block text-sm font-medium">Teléfono<input required minLength={6} value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      {isMadeToOrder ? <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Realiza tu pedido vía WhatsApp pagando solo el 30% del producto y paga el resto una vez recibas el producto.</div> : <fieldset className="mt-6"><legend className="text-sm font-semibold">Método de pago</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={`rounded-lg border p-3 ${paymentMethod === 'WHATSAPP_TRANSFER' ? 'border-slate-900' : 'border-slate-200'}`}><input type="radio" name="payment" checked={paymentMethod === 'WHATSAPP_TRANSFER'} onChange={() => setPaymentMethod('WHATSAPP_TRANSFER')} /> <span className="ml-2">Transferencia</span><span className="mt-1 block text-xs text-slate-500">Paga desde Bancolombia, Nequi, Daviplata y cualquier banco que utilice llaves Bre-B</span></label>
        <label className={`rounded-lg border p-3 ${paymentMethod === 'CASH_ON_DELIVERY' ? 'border-slate-900' : 'border-slate-200'}`}><input type="radio" name="payment" checked={paymentMethod === 'CASH_ON_DELIVERY'} onChange={() => setPaymentMethod('CASH_ON_DELIVERY')} /> <span className="ml-2">Efectivo contraentrega</span><span className="mt-1 block text-xs text-slate-500">Paga el valor total al recibir el producto.</span></label>
      </div></fieldset>}
      <div className="mt-6 space-y-2 rounded-lg bg-slate-100 p-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><strong>{formatCOP(cart.total)}</strong></div><div className="flex justify-between"><span>Envío</span><strong>{formatCOP(shippingCost)}</strong></div><div className="flex justify-between border-t border-slate-300 pt-2 text-lg"><span>Total</span><strong>{formatCOP(total)}</strong></div></div>
      {message && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      <button disabled={cart.items.length === 0} className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold text-white disabled:bg-slate-300 ${isMadeToOrder ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900'}`}>{isMadeToOrder ? 'Continuar WhatsApp' : 'Confirmar pedido'}</button>
    </form>
  </section>;
}
