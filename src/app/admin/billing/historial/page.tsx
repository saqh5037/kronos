import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { listSaasInvoices, listSaasPlans } from "@/server/actions/saas-billing";
import { formatPriceMxn } from "@/lib/saas-billing";
import { summarizeInvoices } from "@/lib/saas-invoices-csv";
import { EmptyState } from "@/components/kronos/EmptyState";
import { ExportInvoicesButton } from "./_components/ExportInvoicesButton";
import { HistorialFilters } from "./_components/HistorialFilters";

export const metadata = { title: "Kronos — Historial de cobros" };
export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <Link
            href="/admin/billing"
            className="text-sm text-[var(--text-3)] hover:text-[var(--text)] mb-2 inline-block"
          >
            ← Suscripción
          </Link>
          <h1 className="font-display font-extrabold text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.02em]">
            Historial de cobros
          </h1>
        </div>
        {invoices.length > 0 && (
          <ExportInvoicesButton from={sp.from} to={sp.to} planSlug={sp.plan} />
        )}
      </div>

      <HistorialFilters
        plans={plans.map((p) => ({ slug: p.slug, name: p.name }))}
      />

      {invoices.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Sin resultados" : "Aún no hay cobros"}
          description={
            hasFilters
              ? "Ningún cobro coincide con los filtros aplicados. Probá ampliar el rango o cambiar el plan."
              : "Cuando se confirme el primer cobro de tu suscripción aparecerá acá con el detalle del período y monto."
          }
          tone="neutral"
        />
      ) : (
        <>
          <div className="k-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="text-left p-3 md:p-4 font-mono text-xs uppercase tracking-wider text-[var(--text-3)]">
                    Fecha
                  </th>
                  <th className="text-left p-3 md:p-4 font-mono text-xs uppercase tracking-wider text-[var(--text-3)]">
                    Plan
                  </th>
                  <th className="text-right p-3 md:p-4 font-mono text-xs uppercase tracking-wider text-[var(--text-3)]">
                    Monto
                  </th>
                  <th className="hidden md:table-cell text-left p-3 md:p-4 font-mono text-xs uppercase tracking-wider text-[var(--text-3)]">
                    Período
                  </th>
                  <th className="text-left p-3 md:p-4 font-mono text-xs uppercase tracking-wider text-[var(--text-3)]">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--card-2)]/40 transition-colors"
                  >
                    <td className="p-3 md:p-4 whitespace-nowrap">
                      {formatDate(inv.paidAt)}
                    </td>
                    <td className="p-3 md:p-4">{inv.planName}</td>
                    <td className="p-3 md:p-4 text-right whitespace-nowrap font-bold">
                      {formatPriceMxn(inv.amountMxnCents)}
                    </td>
                    <td className="hidden md:table-cell p-3 md:p-4 whitespace-nowrap text-[var(--text-2)] text-xs">
                      {formatDate(inv.periodStart)} →{" "}
                      {formatDate(inv.periodEnd)}
                    </td>
                    <td className="p-3 md:p-4">
                      {inv.status === "PAID" ? (
                        <span className="k-chip k-chip-recovery">Pagado</span>
                      ) : (
                        <span className="k-chip k-chip-strain">
                          Reembolsado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--line)] bg-[var(--card-2)]/30">
                  <td colSpan={2} className="p-3 md:p-4 font-bold text-sm">
                    Total
                    <span className="text-xs text-[var(--text-3)] font-normal ml-2">
                      ({summary.count} cobro{summary.count === 1 ? "" : "s"}
                      {summary.refundedCount > 0
                        ? ` · ${summary.refundedCount} reembolsado${summary.refundedCount === 1 ? "" : "s"}`
                        : ""}
                      )
                    </span>
                  </td>
                  <td
                    className="p-3 md:p-4 text-right font-bold text-base whitespace-nowrap"
                    style={{ color: "var(--moss)" }}
                  >
                    {formatPriceMxn(summary.totalCents)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
