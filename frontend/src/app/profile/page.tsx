import React, { useState } from "react";
import { api, type Session } from "../../api";

export function ProfilePage({ session, onUpdated, onDeleted }: { session: Session; onUpdated: (session: Session) => void; onDeleted: () => void }) {
  const [form, setForm] = useState({ name: session.name, email: session.email, address: session.address ?? "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setSaving(true);
    api.updateProfile(form)
      .then((updated) => {
        onUpdated(updated);
        setMessage("Tu información se actualizó correctamente.");
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setSaving(false));
  };

  const removeAccount = () => {
    if (!window.confirm("¿Seguro que quieres eliminar tu cuenta? Esta acción cerrará tu sesión.")) return;
    setDeleting(true);
    api.deleteProfile()
      .then(onDeleted)
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setDeleting(false));
  };

  return (
    <section className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Mi cuenta</p>
          <h1 className="text-3xl font-bold text-slate-900">Perfil de usuario</h1>
          <p className="mt-2 text-slate-500">Actualiza tus datos para tus próximos pedidos.</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Nombre
            <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input required type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Dirección de entrega
            <textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} rows={3} className="mt-1 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5" />
          </label>
          {message && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
        <div className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="font-semibold text-slate-900">Eliminar cuenta</h2>
          <p className="mt-1 text-sm text-slate-500">Tu cuenta se desactivará y ya no podrás iniciar sesión con ella.</p>
          <button type="button" onClick={removeAccount} disabled={deleting} className="mt-4 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-60">
            {deleting ? "Eliminando..." : "Eliminar mi cuenta"}
          </button>
        </div>
      </div>
    </section>
  );
}
