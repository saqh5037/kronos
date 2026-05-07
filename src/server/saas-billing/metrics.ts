/**
 * Pure helpers para métricas de gasto del Box en Kronos.
 * Sin acceso a DB — recibe rows ya consultados.
 */

export type InvoiceForMetrics = {
  paidAt: Date;
  amountMxnCents: number;
  status: "PAID" | "REFUNDED";
};

export type MonthBucket = {
  month: string; // "YYYY-MM"
  cents: number;
  count: number;
};

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Agrupa invoices PAID por mes (YYYY-MM). Ignora REFUNDED.
 * Retorna ordenado ASC (mes más antiguo primero).
 */
export function groupInvoicesByMonth(
  invoices: InvoiceForMetrics[],
): MonthBucket[] {
  const buckets = new Map<string, MonthBucket>();

  for (const inv of invoices) {
    if (inv.status !== "PAID") continue;
    const key = monthKey(inv.paidAt);
    const existing = buckets.get(key);
    if (existing) {
      existing.cents += inv.amountMxnCents;
      existing.count += 1;
    } else {
      buckets.set(key, {
        month: key,
        cents: inv.amountMxnCents,
        count: 1,
      });
    }
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}

export function computeLifetimeSpent(invoices: InvoiceForMetrics[]): number {
  let total = 0;
  for (const inv of invoices) {
    if (inv.status !== "PAID") continue;
    total += inv.amountMxnCents;
  }
  return total;
}

export function computeArrProjectedCents(currentMrrCents: number): number {
  return Math.max(0, currentMrrCents) * 12;
}

/**
 * Filtra y completa la historia mensual a últimos N meses.
 * Si un mes no tuvo invoices, agrega bucket con cents=0 para que el sparkline
 * sea consistente. Mes actual incluido.
 */
export function fillMonthlyHistory(
  buckets: MonthBucket[],
  monthsBack: number,
  now: Date = new Date(),
): MonthBucket[] {
  const map = new Map(buckets.map((b) => [b.month, b]));
  const out: MonthBucket[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    const key = monthKey(d);
    const existing = map.get(key);
    out.push(existing ?? { month: key, cents: 0, count: 0 });
  }
  return out;
}
