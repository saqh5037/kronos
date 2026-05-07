import Link from "next/link";
import KCard from "@/components/kronos/KCard";

type Props = {
  totals: { booked: number; attended: number };
};

export function CoachAttendanceTodayCard({ totals }: Props) {
  const pct =
    totals.booked > 0 ? Math.round((totals.attended / totals.booked) * 100) : 0;

  return (
    <KCard animate={false} className="p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="font-display text-xl font-bold">Asistencia hoy</h2>
        <Link
          href="/admin/asistencia"
          className="text-sm text-[var(--k-warning)] hover:underline"
        >
          Detalle →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--k-t3)] mb-1">
            Reservados
          </p>
          <p className="font-display text-3xl font-extrabold">
            {totals.booked}
          </p>
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--k-t3)] mb-1">
            Asistidos
          </p>
          <p
            className="font-display text-3xl font-extrabold"
            style={{ color: "var(--k-accent)" }}
          >
            {totals.attended}
          </p>
          {totals.booked > 0 && (
            <p className="text-xs text-[var(--k-t3)] mt-0.5">{pct}%</p>
          )}
        </div>
      </div>
    </KCard>
  );
}
