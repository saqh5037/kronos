import { listSupportBoxAthletes } from "@/server/actions/support";
import { SupportAtletasTable } from "./SupportAtletasTable";

type BoxInfo = {
  sessionId: string;
  boxId: string;
  boxName: string;
  agentEmail: string;
  expiresAt: Date;
};

const STATUS_LABELS: Record<string, string> = {
  TRIAL: "Trial",
  ACTIVE: "Activo",
  PAST_DUE: "Vencido",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL: "var(--k-warning)",
  ACTIVE: "var(--k-accent)",
  PAST_DUE: "var(--k-danger)",
  CANCELLED: "var(--k-danger)",
  EXPIRED: "var(--k-t3)",
};

type Props = {
  session: BoxInfo;
  boxSlug: string;
  subscriptionStatus: string;
  athleteCount: number;
  ownerEmail: string | null;
};

export async function SupportBoxView({
  session,
  boxSlug,
  subscriptionStatus,
  athleteCount,
  ownerEmail,
}: Props) {
  const athletesResult = await listSupportBoxAthletes({
    page: 1,
    pageSize: 25,
  });

  const initialRows = athletesResult.ok ? athletesResult.result.rows : [];
  const initialTotal = athletesResult.ok ? athletesResult.result.total : 0;

  return (
    <div>
      {/* Box summary card */}
      <div
        className="k-card mb-6 p-5"
        style={{ borderTop: "3px solid var(--k-warning)" }}
      >
        <p className="k-eyebrow mb-3" style={{ color: "var(--k-warning)" }}>
          Box en sesión de soporte
        </p>
        <h2
          className="mb-2 font-display text-2xl font-bold"
          style={{ color: "var(--k-t1)" }}
        >
          {session.boxName}
        </h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span style={{ color: "var(--k-t2)" }}>
            Slug:{" "}
            <span className="font-mono" style={{ color: "var(--k-t1)" }}>
              {boxSlug}
            </span>
          </span>
          <span>
            Suscripción:{" "}
            <span
              className="font-semibold"
              style={{
                color: STATUS_COLORS[subscriptionStatus] ?? "var(--k-t2)",
              }}
            >
              {STATUS_LABELS[subscriptionStatus] ?? subscriptionStatus}
            </span>
          </span>
          <span style={{ color: "var(--k-t2)" }}>
            Atletas:{" "}
            <span
              className="font-mono font-bold"
              style={{ color: "var(--k-t1)" }}
            >
              {athleteCount}
            </span>
          </span>
          {ownerEmail && (
            <span style={{ color: "var(--k-t2)" }}>
              Owner: <span style={{ color: "var(--k-t1)" }}>{ownerEmail}</span>
            </span>
          )}
          <span style={{ color: "var(--k-t3)" }}>
            Agente:{" "}
            <span style={{ color: "var(--k-t2)" }}>{session.agentEmail}</span>
          </span>
        </div>
      </div>

      {/* Athletes table */}
      <section>
        <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
          Atletas del box
        </p>
        <SupportAtletasTable
          initialRows={initialRows}
          initialTotal={initialTotal}
        />
      </section>
    </div>
  );
}
