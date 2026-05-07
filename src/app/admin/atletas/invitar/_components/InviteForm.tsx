"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseBulkInvitations } from "@/lib/athlete-invitation";
import { inviteAthletesFromText } from "@/server/actions/athlete-invitations";

const PLACEHOLDER = `alice@example.com,Alice Liddell,5551234
bob@example.com,Bob Marley
charlie@example.com`;

type SubmitState =
  | { kind: "idle" }
  | { kind: "ok"; created: number; skipped: number; errors: number }
  | { kind: "error"; message: string };

export function InviteForm() {
  const [text, setText] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const preview = parseBulkInvitations(text);

  const onSubmit = () => {
    startTransition(async () => {
      try {
        const res = await inviteAthletesFromText(text);
        if (!res.ok) {
          setState({ kind: "error", message: res.message });
          return;
        }
        setState({
          kind: "ok",
          created: res.created,
          skipped: res.skipped.length,
          errors: res.errors.length,
        });
        if (res.created > 0) setText("");
        router.refresh();
      } catch (err) {
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    });
  };

  const validCount = preview.valid.length;
  const errorCount = preview.errors.length;
  const dupCount = preview.duplicates.length;

  return (
    <div className="k-card p-5 space-y-4">
      <div>
        <label htmlFor="invite-bulk" className="k-eyebrow block mb-2">
          Lista de atletas
        </label>
        <textarea
          id="invite-bulk"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (state.kind !== "idle") setState({ kind: "idle" });
          }}
          rows={10}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="w-full font-mono text-sm rounded-lg p-3 bg-[var(--k-surface)] text-[var(--k-t1)] border border-[var(--k-line-2)] focus:outline-none focus:border-[var(--k-accent-line)]"
        />
        <p className="mt-2 text-xs text-[var(--k-t3)]">
          Formato: <code>email,nombre apellido,teléfono</code> · una por línea ·
          coma, tab o punto y coma como separadores · líneas con <code>#</code>{" "}
          se ignoran.
        </p>
      </div>

      {/* Preview */}
      {text.trim().length > 0 && (
        <div className="rounded-lg border border-[var(--k-line-2)] bg-[var(--k-elevated)] p-3 space-y-2">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="k-chip k-chip-recovery">
              {validCount} válido{validCount === 1 ? "" : "s"}
            </span>
            {dupCount > 0 && (
              <span className="k-chip k-chip-strain">
                {dupCount} duplicado{dupCount === 1 ? "" : "s"}
              </span>
            )}
            {errorCount > 0 && (
              <span className="k-chip k-chip-pr">
                {errorCount} con error{errorCount === 1 ? "" : "es"}
              </span>
            )}
          </div>

          {validCount > 0 && (
            <div className="overflow-hidden rounded">
              <table className="w-full text-xs">
                <thead className="text-[var(--k-t3)]">
                  <tr>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Nombre</th>
                    <th className="text-left p-2">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.valid.slice(0, 10).map((row) => (
                    <tr
                      key={row.email}
                      className="border-t border-[var(--k-line)]/40"
                    >
                      <td className="p-2 font-mono">{row.email}</td>
                      <td className="p-2">
                        {[row.firstName, row.lastName]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </td>
                      <td className="p-2">{row.phone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validCount > 10 && (
                <p className="text-[10px] text-[var(--k-t3)] mt-1 px-2 pb-2">
                  …y {validCount - 10} más
                </p>
              )}
            </div>
          )}

          {errorCount > 0 && (
            <ul className="text-xs text-[var(--k-danger)] space-y-1">
              {preview.errors.slice(0, 5).map((e) => (
                <li key={e.line}>
                  Línea {e.line}: <code className="font-mono">{e.input}</code>{" "}
                  no es un email válido
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Result */}
      {state.kind === "ok" && (
        <div className="rounded-lg border border-[var(--k-accent-line)] bg-[var(--k-accent-soft)] p-3 text-sm">
          ✓ {state.created} invitacion{state.created === 1 ? "" : "es"} enviada
          {state.created === 1 ? "" : "s"}.
          {state.skipped > 0 &&
            ` ${state.skipped} omitida${state.skipped === 1 ? "" : "s"}.`}
        </div>
      )}
      {state.kind === "error" && (
        <div className="rounded-lg border border-[var(--k-danger)]/50 bg-[var(--k-danger)]/10 p-3 text-sm text-[var(--k-danger)]">
          {state.message}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending || validCount === 0}
          className="k-btn-grad disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending
            ? "Enviando…"
            : `Enviar ${validCount} invitacion${validCount === 1 ? "" : "es"}`}
        </button>
      </div>
    </div>
  );
}
