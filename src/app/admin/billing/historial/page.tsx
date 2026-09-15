import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, Receipt } from "lucide-react";
import { authOptions } from "@/server/auth";
import { listSaasInvoices, listSaasPlans } from "@/server/actions/saas-billing";
import { summarizeInvoices } from "@/lib/saas-invoices-csv";
import { formatDateLong, formatDateShort, formatMXN } from "@/lib/format";
import { saasInvoiceStatusLabel } from "@/lib/labels";
import { EmptyState } from "@/components/kronos/EmptyState";
import { ExportInvoicesButton } from "./_components/ExportInvoicesButton";
import { HistorialFilters } from "./_components/HistorialFilters";

export const metadata = { title: "Kronos — Historial de cobros" };
export const dynamic = "force-dynamic";

/** "$999 MXN" / "Gratis" — cents in, one money format out. */
function money(cents: number): string {
  return cents === 0 ? "Gratis" : formatMXN(cents / 100);
}

function parseDate(input?: string): Date | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

type SearchParams = {
  from?: string;
  to?: string;
  plan?: string;
};

export default async function InvoiceHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin");

  const sp = (await searchParams) ?? {};
  const fromDate = parseDate(sp.from);
  const toDate = parseDate(sp.to);
  const filters = {
    from: fromDate,
    to: toDate ? endOfDay(toDate) : undefined,
    planSlug: sp.plan || undefined,
  };
  const hasFilters = Boolean(fromDate || toDate || sp.plan);

  const [invoices, plans] = await Promise.all([
    listSaasInvoices(filters),
    listSaasPlans(),
  ]);
  const summary = summarizeInvoices(invoices);

  /* Filtering an empty table is busywork — the controls only appear when
     there is something to filter, or when a filter is what emptied it. */
  const showFilters = invoices.length > 0 || hasFilters;

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/billing"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-[var(--k-t3)] hover:text-[var(--k-t1)]"
          >
            <ArrowLeft size={14} strokeWidth={2.2} aria-hidden />
            Suscripción
          </Link>
          <h1 className="font-display text-[28px] leading-[1.1] font-extrabold tracking-[-0.02em] md:text-[36px]">
            Historial de cobros
          </h1>
        </div>
        {invoices.length > 0 && (
          <ExportInvoicesButton from={sp.from} to={sp.to} planSlug={sp.plan} />
        )}
      </div>

      {showFilters ? (
        <HistorialFilters
          plans={plans.map((p) => ({ slug: p.slug, name: p.name }))}
        />
      ) : null}

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt size={20} strokeWidth={1.8} aria-hidden />}
          title={hasFilters ? "Sin resultados" : "Aún no hay cobros"}
          description={
            hasFilters
              ? "Ningún cobro coincide con los filtros. Prueba a ampliar el rango o cambiar el plan."
              : "Cuando se confirme el primer cobro de tu suscripción aparecerá aquí con el detalle del período y el monto."
          }
          tone="neutral"
        />
      ) : (
        <div className="k-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--k-line)]">
                <th className="p-3 text-left font-mono text-xs tracking-wider text-[var(--k-t3)] uppercase md:p-4">
                  Fecha
                </th>
                <th className="p-3 text-left font-mono text-xs tracking-wider text-[var(--k-t3)] uppercase md:p-4">
                  Plan
                </th>
                <th className="p-3 text-right font-mono text-xs tracking-wider text-[var(--k-t3)] uppercase md:p-4">
                  Monto
                </th>
                <th className="hidden p-3 text-left font-mono text-xs tracking-wider text-[var(--k-t3)] uppercase md:table-cell md:p-4">
                  Período
                </th>
                <th className="p-3 text-left font-mono text-xs tracking-wider text-[var(--k-t3)] uppercase md:p-4">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-[var(--k-line)] transition-colors last:border-b-0 hover:bg-[var(--k-elevated)]/40"
                >
                  <td className="p-3 whitespace-nowrap md:p-4">
                    {formatDateLong(inv.paidAt)}
                  </td>
                  <td className="p-3 md:p-4">{inv.planName}</td>
                  <td className="font-display p-3 text-right font-bold whitespace-nowrap md:p-4">
                    {money(inv.amountMxnCents)}
                  </td>
                  <td className="hidden p-3 text-xs whitespace-nowrap text-[var(--k-t2)] md:table-cell md:p-4">
                    {formatDateShort(inv.periodStart)} –{" "}
                    {formatDateShort(inv.periodEnd)}
                  </td>
                  <td className="p-3 md:p-4">
                    <span
                      className={`k-chip ${
                        inv.status === "PAID" ? "k-chip-moss" : "k-chip-ghost"
                      }`}
                    >
                      {saasInvoiceStatusLabel[inv.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--k-line)] bg-[var(--k-elevated)]/30">
                <td colSpan={2} className="p-3 text-sm font-bold md:p-4">
                  Total
                  <span className="ml-2 text-xs font-normal text-[var(--k-t3)]">
                    ({summary.count} cobro{summary.count === 1 ? "" : "s"}
                    {summary.refundedCount > 0
                      ? ` · ${summary.refundedCount} reembolsado${summary.refundedCount === 1 ? "" : "s"}`
                      : ""}
                    )
                  </span>
                </td>
                <td
                  className="font-display p-3 text-right text-base font-bold whitespace-nowrap md:p-4"
                  style={{ color: "var(--k-accent)" }}
                >
                  {money(summary.totalCents)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
