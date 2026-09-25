import React, { useEffect, useState } from "react";
import { api, type Session } from "../../api";

type AuthMode = "login" | "register" | "reset-request" | "reset-confirm";

export function AuthPage({
  onAuthenticated,
}: {
  onAuthenticated: (session: Session) => void;
}) {
  const [mode, setMode] = useState<AuthMode>(() =>
    new URLSearchParams(window.location.search).has("resetToken") ? "reset-confirm" : "login"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordVisibleConfirmation, setPasswordVisibleConfirmation] = useState(false);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.search).get("resetToken");
    if (resetToken) {
      setToken(resetToken);
    }

    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timeout = window.setTimeout(() => setResetCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [resetCooldown]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (mode === "reset-request") {
      if (resetCooldown > 0) return;
      api
        .requestPasswordReset(email)
        .then((result) => {
          setMessage(result.message);
          setResetCooldown(result.retryAfterSeconds ?? 60);
        })
        .catch((reason: Error & { retryAfterSeconds?: number }) => {
          setMessage(reason.message);
          if (reason.retryAfterSeconds) setResetCooldown(reason.retryAfterSeconds);
        });
      return;
    }
    if (mode === "reset-confirm") {
      if (password !== passwordConfirmation) {
        setMessage("Las contraseñas no coinciden");
        return;
      }
      api
        .confirmPasswordReset(token, password)
        .then((result) => {
          setMessage(result.message);
          setMode("login");
          setPassword("");
          setPasswordConfirmation("");
          setToken("");
        })
        .catch((reason: Error) => setMessage(reason.message));
      return;
    }
    const action =
      mode === "login"
        ? api.login({ email, password })
        : api.register({ name, email, password });
    action
      .then(onAuthenticated)
      .catch((reason: Error) => setMessage(reason.message));
  };

  return (
    <section className="mx-auto max-w-xl px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {mode !== "reset-confirm" && (
          <div className="mb-5 flex gap-2 rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === "login" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === "register" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              Registrarse
            </button>
          </div>
        )}
        <h1 className="mb-5 text-2xl font-bold">
          {mode === "reset-request"
            ? "Restablecer contraseña"
            : mode === "reset-confirm"
              ? "Crear nueva contraseña"
              : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
        </h1>
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <label className="block text-sm font-medium">
              Nombre
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
          )}
          {mode !== "reset-confirm" && (
            <label className="block text-sm font-medium">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
          )}
          {(mode === "login" ||
            mode === "register" ||
            mode === "reset-confirm") && (
            <label className="block text-sm font-medium">
              {mode === "reset-confirm" ? "Nueva contraseña" : "Contraseña"}
              <div className="relative mt-1">
                <input
                  required
                  minLength={mode === "login" ? 1 : 8}
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={passwordVisible}
                  title={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    {passwordVisible ? <><path d="M3 3l18 18" strokeLinecap="round" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" strokeLinecap="round" /><path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5.2 0 8.7 4 10 8a12.7 12.7 0 0 1-3.2 5.1M6.2 6.2C4.1 7.6 2.7 10 2 12c1.3 4 4.8 8 10 8 1 0 2-.2 2.9-.5" strokeLinecap="round" strokeLinejoin="round" /></> : <><path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>}
                  </svg>
                </button>
              </div>
              {mode !== "login" && (
                <span className="mt-1 block text-xs text-slate-500">
                  Mínimo 8 caracteres, una mayúscula, un número y un símbolo.
                </span>
              )}
            </label>
          )}
          {mode === "reset-confirm" && (
            <label className="block text-sm font-medium">
              Confirmar contraseña
              <div className="relative mt-1">
                <input
                  required
                  minLength={8}
                  type={passwordVisibleConfirmation ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisibleConfirmation((visible) => !visible)}
                  aria-label={passwordVisibleConfirmation ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                  aria-pressed={passwordVisibleConfirmation}
                  title={passwordVisibleConfirmation ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    {passwordVisibleConfirmation ? <><path d="M3 3l18 18" strokeLinecap="round" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" strokeLinecap="round" /><path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5.2 0 8.7 4 10 8a12.7 12.7 0 0 1-3.2 5.1M6.2 6.2C4.1 7.6 2.7 10 2 12c1.3 4.8 4.8 8 10 8 1 0 2-.2 2.9-.5" strokeLinecap="round" strokeLinejoin="round" /></> : <><path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>}
                  </svg>
                </button>
              </div>
            </label>
          )}
          {message && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={mode === "reset-request" && resetCooldown > 0}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white"
          >
            {mode === "reset-request"
              ? resetCooldown > 0
                ? `Reenviar en ${Math.floor(resetCooldown / 60)}:${String(resetCooldown % 60).padStart(2, "0")}`
                : "Enviar instrucciones"
              : mode === "reset-confirm"
                ? "Actualizar contraseña"
                : mode === "login"
                  ? "Entrar"
                  : "Crear cuenta"}
          </button>
        </form>
        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              setMode("reset-request");
              setMessage("");
            }}
            className="mt-4 text-sm font-semibold text-slate-600 underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}
        {(mode === "reset-request" || mode === "reset-confirm") && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className="mt-4 text-sm font-semibold text-slate-600 underline"
          >
            Volver a iniciar sesión
          </button>
        )}
      </div>
    </section>
  );
}
