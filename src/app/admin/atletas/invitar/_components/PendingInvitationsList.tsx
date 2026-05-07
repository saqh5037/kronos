"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  revokeInvitation,
  resendInvitation,
  type PendingInvitationRow,
} from "@/server/actions/athlete-invitations";

const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });

function daysUntil(date: Date, nowMs: number): number {
  return Math.ceil((new Date(date).getTime() - nowMs) / (1000 * 60 * 60 * 24));
}

export function PendingInvitationsList({
  rows,
}: {
  rows: PendingInvitationRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  const onRevoke = (id: string) => {
    startTransition(async () => {
      await revokeInvitation(id);
      router.refresh();
    });
  };
  const onResend = (id: string) => {
    startTransition(async () => {
      await resendInvitation(id);
      router.refresh();
    });
  };

  if (rows.length === 0) {
    return (
      <div className="k-card p-5">
        <p className="k-eyebrow mb-3">Pendientes</p>
        <p className="text-sm text-[var(--k-t3)]">
          No hay invitaciones pendientes. Las que envíes aparecerán acá.
        </p>
      </div>
    );
  }

  return (
    <div className="k-card p-5">
      <p className="k-eyebrow mb-3">Pendientes ({rows.length})</p>
      <ul className="space-y-2">
        {rows.map((row) => {
          const days = nowMs !== null ? daysUntil(row.expiresAt, nowMs) : null;
          const isExpired = row.status === "EXPIRED";
          return (
            <li
              key={row.id}
              className="rounded-lg border border-[var(--k-line-2)] bg-[var(--k-elevated)] p-3"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm truncate">{row.email}</p>
                  {(row.firstName || row.lastName) && (
                    <p className="text-xs text-[var(--k-t2)] mt-0.5">
                      {[row.firstName, row.lastName].filter(Boolean).join(" ")}
                    </p>
                  )}
                  <p className="text-[11px] text-[var(--k-t3)] mt-1">
                    Enviada {fmtDate(row.createdAt)} ·{" "}
                    {isExpired ? (
                      <span className="text-[var(--k-danger)]">Expirada</span>
                    ) : days !== null ? (
                      <span>
                        Expira en {days} día{days === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span>Pendiente</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onResend(row.id)}
                    disabled={pending}
                    className="k-btn-ghost text-xs disabled:opacity-50"
                    title="Reenviar email"
                  >
                    Reenviar
                  </button>
                  <button
                    type="button"
                    onClick={() => onRevoke(row.id)}
                    disabled={pending}
                    className="k-btn-ghost text-xs disabled:opacity-50"
                    style={{ color: "var(--k-danger)" }}
                    title="Revocar invitación"
                  >
                    Revocar
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
