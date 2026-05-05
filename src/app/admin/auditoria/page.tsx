import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getOwnerLiveFeed } from "@/server/actions/owner-feed";
import AuditTimeline from "@/components/admin/AuditTimeline";
import AuditFilters from "@/components/admin/AuditFilters";

export const metadata = { title: "Kronos — Auditoría" };

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams?: Promise<{ days?: string; action?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    redirect("/admin");
  }

  const params = searchParams ? await searchParams : {};
  const days = Number(params?.days ?? 1);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await getOwnerLiveFeed({
    since,
    limit: 100,
  });

  const sensitiveCount = events.filter(
    (e) => e.severity === "sensitive",
  ).length;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <p className="k-eyebrow mb-2">Control</p>
      <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight mb-1 text-white">
        Feed de Auditoría
      </h1>
      <p className="text-white/50 mb-6 text-sm">
        Trazabilidad en tiempo real de todas las acciones del equipo.
      </p>

      <AuditFilters sensitiveCount={sensitiveCount} />

      {events.length === 0 ? (
        <div className="k-card p-12 text-center">
          <p className="text-4xl mb-3">✨</p>
          <p className="font-medium text-white">Sin eventos en este período</p>
          <p className="text-sm text-white/40 mt-1">
            Todo tranquilo. Amplía el rango de fechas para ver más actividad.
          </p>
        </div>
      ) : (
        <AuditTimeline events={events} />
      )}
    </div>
  );
}
