import React, { useState } from 'react';
import { api } from '../../api';

export function ChangePasswordPage({ onCompleted }: { onCompleted: () => void }) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    api.setPassword(password).then(onCompleted).catch((reason: Error) => setMessage(reason.message));
  };

  return <section className="mx-auto max-w-xl px-6 py-10"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h1 className="mb-3 text-2xl font-bold">Crea tu contraseña</h1><p className="mb-5 text-sm text-slate-600">Tu pedido creó una cuenta con tu email. Define una contraseña para acceder a tus pedidos.</p><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">Nueva contraseña<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>{message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}<button className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">Guardar contraseña</button></form></div></section>;
}
