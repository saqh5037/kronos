"use client";

import { useState } from "react";
import { exportSaasInvoicesCsv } from "@/server/actions/saas-billing";
import { kToast } from "@/lib/toast";

type Props = {
  from?: string;
  to?: string;
  planSlug?: string;
};

function endOfDayDate(input?: string): Date | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (isNaN(d.getTime())) return undefined;
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseDate(input?: string): Date | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

export function ExportInvoicesButton({ from, to, planSlug }: Props) {
  const [pending, setPending] = useState(false);

  const handleExport = async () => {
    setPending(true);
    try {
      const csv = await exportSaasInvoicesCsv({
        from: parseDate(from),
        to: endOfDayDate(to),
        planSlug: planSlug || undefined,
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `kronos-cobros-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      kToast.error(
        err instanceof Error ? err.message : "Error al exportar CSV",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={pending}
      className="k-btn-ghost px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Generando…" : "Descargar CSV"}
    </button>
  );
}
