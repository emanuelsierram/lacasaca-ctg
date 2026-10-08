import React, { useState } from "react";

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirmar",
  busyLabel = "Procesando...",
}: {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmLabel?: string;
  busyLabel?: string;
}) {
  const [busy, setBusy] = useState(false);

  const confirm = () => {
    setBusy(true);
    Promise.resolve()
      .then(onConfirm)
      .finally(() => {
        setBusy(false);
        onCancel();
      });
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h2 id="confirm-dialog-title" className="text-lg font-bold">
          {title}
        </h2>
        <p className="mt-2 text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-4 py-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
