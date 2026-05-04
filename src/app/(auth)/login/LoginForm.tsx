"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === "1";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("email", { email, redirect: false });
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div
        className="text-center p-6 rounded-xl border"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <p className="k-eyebrow mb-2" style={{ color: "var(--recovery)" }}>
          Liga enviada
        </p>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Revisa tu correo y haz clic en la liga para entrar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@tubox.com"
          required
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 border focus:outline-none focus:border-recovery/50 transition-colors"
          style={{ background: "var(--card)", borderColor: "var(--line)" }}
        />
        <button
          type="submit"
          disabled={loading}
          className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Enviar liga de acceso"}
        </button>
      </form>

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
      setLoading(false);
      return;
    }
    window.location.href = "/admin";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
        <span className="k-eyebrow" style={{ color: "var(--text-2)" }}>
          Solo desarrollo
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          required
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 border focus:outline-none focus:border-strain/50 transition-colors"
          style={{ background: "var(--card)", borderColor: "var(--line)" }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          required
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 border focus:outline-none focus:border-strain/50 transition-colors"
          style={{ background: "var(--card)", borderColor: "var(--line)" }}
        />
        <button
          type="submit"
          disabled={loading}
          className="k-btn-ghost w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar (dev)"}
        </button>
        {error && (
          <p className="text-xs text-center" style={{ color: "var(--pr)" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
