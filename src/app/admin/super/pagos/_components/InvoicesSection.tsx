"use client";

import { useState, useTransition } from "react";
import type { CrossTenantInvoiceRow } from "@/server/actions/super-billing";
import { exportCrossTenantInvoicesCsv } from "@/server/actions/super-billing";

type Props = {
  rows: CrossTenantInvoiceRow[];
  total: number;
  page: number;
  pageSize: number;
};

function formatMxn(cents: number): string {
  const pesos = cents / 100;
  return `$${pesos.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function InvoicesSection({ rows, total, page, pageSize }: Props) {
  const [isPending, startTransition] = useTransition();
  const [exportError, setExportError] = useState<string | null>(null);
  const totalPages = Math.ceil(total / pageSize);

  const handleExport = () => {
    setExportError(null);
    startTransition(async () => {
      try {
        const csv = await exportCrossTenantInvoicesCsv();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kronos-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        setExportError("Error al exportar. Intenta de nuevo.");
      }
    });
  };

  return (
    <div>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <p
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            color: "var(--k-t3)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: 0,
          }}
        >
          Historial de pagos ({total})
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {exportError && (
            <span style={{ fontSize: 11, color: "var(--k-danger)" }}>
              {exportError}
            </span>
          )}
          <button
            onClick={handleExport}
            disabled={isPending || rows.length === 0}
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--k-accent)",
              background: "var(--k-accent-soft)",
              border: "1px solid var(--k-accent-line)",
              borderRadius: 6,
              padding: "6px 12px",
              cursor:
                isPending || rows.length === 0 ? "not-allowed" : "pointer",
              opacity: isPending || rows.length === 0 ? 0.5 : 1,
            }}
          >
            {isPending ? "Exportando..." : "Exportar CSV"}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div
          className="k-card"
          style={{
            padding: 48,
            textAlign: "center",
            background: "var(--k-elevated)",
            borderColor: "var(--k-line-2)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--k-t1)",
              marginBottom: 8,
            }}
          >
            Sin facturas
          </p>
          <p style={{ fontSize: 13, color: "var(--k-t2)" }}>
            Aún no hay facturas registradas en la plataforma.
          </p>
        </div>
      ) : (
        <div className="k-card" style={{ overflow: "auto", borderRadius: 12 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--k-line)" }}>
                {["Box", "Plan", "Monto", "Estado", "Pagado", "Período"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "var(--k-t3)",
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom:
                      i < rows.length - 1 ? "1px solid var(--k-line)" : "none",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--k-t1)",
                      fontWeight: 600,
                    }}
                  >
                    {row.boxName}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--k-t2)" }}>
                    {row.planName}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--k-accent)",
                      fontWeight: 700,
                    }}
                  >
                    {formatMxn(row.amountMxnCents)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color:
                          row.status === "PAID"
                            ? "var(--k-accent)"
                            : "var(--k-danger)",
                        background:
                          row.status === "PAID"
                            ? "var(--k-accent-soft)"
                            : "rgba(255,90,90,0.1)",
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {row.status === "PAID" ? "Pagado" : "Reembolsado"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--k-t2)" }}>
                    {formatDate(row.paidAt)}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--k-t3)",
                      fontSize: 11,
                    }}
                  >
                    {formatDate(row.periodStart)} — {formatDate(row.periodEnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 4px",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--k-t3)" }}>
            {total} facturas · página {page} de {totalPages}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {page > 1 && (
              <a
                href={`?tab=invoices&invPage=${page - 1}`}
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--k-accent)",
                  background: "var(--k-accent-soft)",
                  border: "1px solid var(--k-accent-line)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  textDecoration: "none",
                }}
              >
                ← Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?tab=invoices&invPage=${page + 1}`}
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--k-accent)",
                  background: "var(--k-accent-soft)",
                  border: "1px solid var(--k-accent-line)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  textDecoration: "none",
                }}
              >
                Siguiente →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
