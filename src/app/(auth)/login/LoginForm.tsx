"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
  );
}
