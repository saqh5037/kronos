"use client";

import { useState } from "react";
import { exportSaasInvoicesCsv } from "@/server/actions/saas-billing";
import { kToast } from "@/lib/toast";

export function ExportInvoicesButton() {
  const [pending, setPending] = useState(false);

  const handleExport = async () => {
    setPending(true);
    try {
      const csv = await exportSaasInvoicesCsv();
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
