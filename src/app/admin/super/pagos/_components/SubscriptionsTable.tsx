"use client";

import { useRouter } from "next/navigation";
import type { SubscriptionRow } from "@/server/actions/super-billing";
import { SubscriptionActions } from "./SubscriptionActions";

type Plan = { id: string; name: string; slug: string; priceMxnCents: number };

type Props = {
  rows: SubscriptionRow[];
  total: number;
  page: number;
  pageSize: number;
  plans: Plan[];
};

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "var(--k-accent)";
    case "TRIAL":
      return "var(--k-warning)";
    case "PAST_DUE":
    case "CANCELLED":
    case "EXPIRED":
      return "var(--k-danger)";
    default:
      return "var(--k-t2)";
  }
}

function statusBg(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "var(--k-accent-soft)";
    case "TRIAL":
      return "rgba(255,176,32,0.1)";
    case "PAST_DUE":
    case "CANCELLED":
    case "EXPIRED":
      return "rgba(255,90,90,0.1)";
    default:
      return "rgba(255,255,255,0.05)";
  }
}

function formatMxn(cents: number): string {
  if (cents === 0) return "Gratis";
  const pesos = cents / 100;
  return `$${pesos.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SubscriptionsTable({
  rows,
  total,
  page,
  pageSize,
  plans,
}: Props) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);

  const handleSuccess = () => {
    router.refresh();
  };

  if (rows.length === 0) {
    return (
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
            fontSize: 18,
            fontWeight: 700,
            color: "var(--k-t1)",
            marginBottom: 8,
          }}
        >
          Sin suscripciones
        </p>
        <p style={{ fontSize: 13, color: "var(--k-t2)" }}>
          No hay suscripciones que coincidan con los filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
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
            <tr
              style={{
                borderBottom: "1px solid var(--k-line)",
              }}
            >
              {[
                "Box",
                "Plan",
                "Estado",
                "MRR",
                "Inicio",
                "Fin período",
                "Acciones",
              ].map((h) => (
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
              ))}
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
                <td style={{ padding: "12px 16px" }}>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <span style={{ color: "var(--k-t1)", fontWeight: 600 }}>
                      {row.boxName}
                    </span>
                    <span style={{ color: "var(--k-t3)", fontSize: 11 }}>
                      /{row.boxSlug}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--k-t1)" }}>
                  {row.planName}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: statusColor(row.status),
                      background: statusBg(row.status),
                      padding: "2px 8px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.status}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    color: row.mrrCents > 0 ? "var(--k-accent)" : "var(--k-t3)",
                    fontWeight: row.mrrCents > 0 ? 700 : 400,
                  }}
                >
                  {formatMxn(row.mrrCents)}
                </td>
                <td style={{ padding: "12px 16px", color: "var(--k-t2)" }}>
                  {formatDate(row.startsAt)}
                </td>
                <td style={{ padding: "12px 16px", color: "var(--k-t2)" }}>
                  {formatDate(row.currentPeriodEnd)}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <SubscriptionActions
                    sub={row}
                    plans={plans}
                    onSuccess={handleSuccess}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            {total} suscripciones · página {page} de {totalPages}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {page > 1 && (
              <a
                href={`?tab=subs&page=${page - 1}`}
                style={{ ...paginationLinkStyle }}
              >
                ← Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?tab=subs&page=${page + 1}`}
                style={{ ...paginationLinkStyle }}
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

const paginationLinkStyle: React.CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--k-accent)",
  background: "var(--k-accent-soft)",
  border: "1px solid var(--k-accent-line)",
  borderRadius: 6,
  padding: "6px 12px",
  textDecoration: "none",
};
