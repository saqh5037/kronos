"use client";

import { useState } from "react";

type Props = {
  code: string | null;
};

export function SupportCodeCard({ code }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="k-card mb-6"
      style={{ borderTop: "3px solid var(--k-warning)" }}
    >
      <div className="p-5">
        <p className="k-eyebrow mb-3" style={{ color: "var(--k-warning)" }}>
          Soporte
        </p>

        {code ? (
          <div className="flex flex-wrap items-center gap-4">
            <span
              className="font-mono text-3xl font-bold tracking-widest"
              style={{
                fontFamily: "var(--k-font-display)",
                color: "var(--k-t1)",
                letterSpacing: "0.15em",
              }}
            >
              {code}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="k-btn-ghost px-4 py-2 text-sm font-semibold"
              style={
                copied
                  ? {
                      background: "var(--k-accent-soft)",
                      color: "var(--k-accent)",
                      border: "1px solid var(--k-accent-line)",
                    }
                  : undefined
              }
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--k-t3)" }}>
            Tu código de soporte se genera automáticamente la primera vez que el
            equipo lo necesite.
          </p>
        )}

        <p className="mt-3 text-xs" style={{ color: "var(--k-t2)" }}>
          Dáselo a nuestro equipo cuando llames para que puedan ayudarte con tu
          cuenta. No lo compartas con nadie más.
        </p>
      </div>
    </div>
  );
}
