import Link from "next/link";
import KCard from "@/components/kronos/KCard";
import { formatPriceMxn } from "@/lib/saas-billing";

type Props = {
  nextBilling: {
    date: Date;
    planName: string;
    amountMxnCents: number;
  } | null;
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(d: Date): number {
  const ms = d.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function UpcomingBillingCard({ nextBilling }: Props) {
  if (!nextBilling) {
    return (
      <KCard animate={false} className="p-5 md:p-6">
        <h2 className="font-display text-xl font-bold mb-3">Suscripción</h2>
        <p className="text-sm text-[var(--k-t2)] mb-4">
          Tu Box no tiene una suscripción activa. Activá un plan para mantener
          el servicio sin interrupciones.
        </p>
        <Link
          href="/admin/billing/checkout"
          className="inline-block k-btn-grad px-4 py-2 rounded-full text-sm font-bold"
        >
          Elegir plan
        </Link>
      </KCard>
    );
  }

  const days = daysUntil(nextBilling.date);

  return (
    <KCard animate={false} className="p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="font-display text-xl font-bold">Próxima facturación</h2>
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--k-t3)]">
          {nextBilling.planName}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <p className="text-2xl font-display font-extrabold">
            {formatPriceMxn(nextBilling.amountMxnCents)}
          </p>
          <p className="text-xs text-[var(--k-t3)] mt-0.5">
            {formatDate(nextBilling.date)}
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-2xl font-display font-extrabold"
            style={{ color: "var(--k-warning)" }}
          >
            {days}
          </p>
          <p className="text-xs text-[var(--k-t3)]">
            día{days === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--border)] flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/billing/historial"
          className="text-[var(--k-warning)] hover:underline"
        >
          Ver historial →
        </Link>
        <Link
          href="/admin/billing"
          className="text-[var(--k-t2)] hover:text-[var(--text)]"
        >
          Gestionar suscripción
        </Link>
      </div>
    </KCard>
  );
}
