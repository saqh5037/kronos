"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { kToast } from "@/lib/toast";
import MagicLinkWaiting from "@/components/auth/MagicLinkWaiting";

const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === "1";

type Mode = "magic" | "password";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("magic");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("email", { email, redirect: false });
      // Si el signIn callback retornó un redirect a /signup?reason=no_account,
      // significa que el email no tiene cuenta en Kronos. UX: mandar a
      // /atleta-signup precargando el email (la mayoría de los visitors
      // sin cuenta van a ser atletas, y desde ahí pueden saltar a /signup
      // si son box owner).
      const url = res?.url ?? "";
      if (url.includes("reason=no_account")) {
        window.location.href = `/atleta-signup?email=${encodeURIComponent(email)}`;
        return;
      }
      if (res?.error) {
        kToast.error("No se pudo enviar el código");
        setError("Algo no funcionó. Prueba de nuevo en un momento.");
        return;
      }
      kToast.success("Código enviado", {
        description: "Revisa tu correo — código de 6 dígitos.",
      });
      setSent(true);
    } catch {
      kToast.error("No se pudo enviar el código");
    } finally {
      setLoading(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("password", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Email o contraseña inválidos");
      setLoading(false);
      return;
    }
    kToast.success("Sesión iniciada");
    window.location.href = "/admin";
  }

  if (sent) {
    return (
      <div className="k-card p-6">
        <MagicLinkWaiting email={email} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {mode === "magic" ? (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@tubox.com"
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors"
            style={{
              background: "var(--k-surface)",
              borderColor: "var(--k-line-2)",
              color: "var(--k-t1)",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {loading ? "Enviando…" : "Enviar código"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError(null);
            }}
            className="text-xs underline mt-1"
            style={{ color: "var(--k-t2)" }}
          >
            Usar contraseña
          </button>
        </form>
      ) : (
        <form onSubmit={handlePassword} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@tubox.com"
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors"
            style={{
              background: "var(--k-surface)",
              borderColor: "var(--k-line-2)",
              color: "var(--k-t1)",
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="contraseña"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors"
            style={{
              background: "var(--k-surface)",
              borderColor: "var(--k-line-2)",
              color: "var(--k-t1)",
            }}
          />
          {error && (
            <p
              className="text-xs text-center"
              style={{ color: "var(--k-danger)" }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("magic");
              setError(null);
            }}
            className="text-xs underline mt-1"
            style={{ color: "var(--k-t2)" }}
          >
            ¿Olvidaste tu contraseña? Pide un código
          </button>
        </form>
      )}

      {DEV_LOGIN_ENABLED && <DevLoginForm />}
    </div>
  );
}

function DevLoginForm() {
  const [email, setEmail] = useState("coach@iron-hands.demo");
  const [password, setPassword] = useState("dev");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("dev-login", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Credenciales inválidas");
      kToast.error("Credenciales inválidas");
      setLoading(false);
      return;
    }
    kToast.success("Sesión iniciada");
    window.location.href = "/admin";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--k-line)" }} />
        <span className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          Solo desarrollo
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--k-line)" }} />
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          required
          className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors"
          style={{
            background: "var(--k-surface)",
            borderColor: "var(--k-line-2)",
            color: "var(--k-t1)",
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          required
          className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors"
          style={{
            background: "var(--k-surface)",
            borderColor: "var(--k-line-2)",
            color: "var(--k-t1)",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="k-btn-ghost w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar (dev)"}
        </button>
        {error && (
          <p
            className="text-xs text-center"
            style={{ color: "var(--k-danger)" }}
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
