import React, { useState } from 'react';
import { api, type Session } from '../../api';

type AuthMode = 'login' | 'register' | 'reset-request' | 'reset-confirm';

export function AuthPage({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (mode === 'reset-request') {
      api.requestPasswordReset(email).then((result) => {
        setMessage(result.message);
        if (result.resetToken) { setResetToken(result.resetToken); setToken(result.resetToken); setMode('reset-confirm'); }
      }).catch((reason: Error) => setMessage(reason.message));
      return;
    }
    if (mode === 'reset-confirm') {
      api.confirmPasswordReset(token, password).then((result) => { setMessage(result.message); setMode('login'); setPassword(''); setToken(''); }).catch((reason: Error) => setMessage(reason.message));
      return;
    }
    const action = mode === 'login' ? api.login({ email, password }) : api.register({ name, email, password });
    action.then(onAuthenticated).catch((reason: Error) => setMessage(reason.message));
  };

  return <section className="mx-auto max-w-xl px-6 py-10"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex gap-2 rounded-full bg-slate-100 p-1"><button type="button" onClick={() => setMode('login')} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Iniciar sesión</button><button type="button" onClick={() => setMode('register')} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Registrarse</button></div><h1 className="mb-5 text-2xl font-bold">{mode === 'reset-request' ? 'Restablecer contraseña' : mode === 'reset-confirm' ? 'Crear nueva contraseña' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1><form onSubmit={submit} className="space-y-4">{mode === 'register' && <label className="block text-sm font-medium">Nombre<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>}{mode !== 'reset-confirm' && <label className="block text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>}{mode === 'reset-confirm' && <label className="block text-sm font-medium">Token de recuperación<input required value={token} onChange={(event) => setToken(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />{resetToken && <span className="mt-1 block break-all text-xs text-amber-700">Token de desarrollo: {resetToken}</span>}</label>}{(mode === 'login' || mode === 'register' || mode === 'reset-confirm') && <label className="block text-sm font-medium">{mode === 'reset-confirm' ? 'Nueva contraseña' : 'Contraseña'}<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /><span className="mt-1 block text-xs text-slate-500">Mínimo 8 caracteres, una mayúscula, un número y un símbolo.</span></label>}{message && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}<button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">{mode === 'reset-request' ? 'Enviar instrucciones' : mode === 'reset-confirm' ? 'Actualizar contraseña' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}</button></form>{(mode === 'login' || mode === 'register') && <button type="button" onClick={() => { setMode('reset-request'); setMessage(''); }} className="mt-4 text-sm font-semibold text-slate-600 underline">¿Olvidaste tu contraseña?</button>}{(mode === 'reset-request' || mode === 'reset-confirm') && <button type="button" onClick={() => { setMode('login'); setMessage(''); }} className="mt-4 text-sm font-semibold text-slate-600 underline">Volver a iniciar sesión</button>}</div></section>;
}
