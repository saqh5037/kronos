import { listBadgesWithProgress } from "@/server/actions/badges";
import { EmptyStateCTA } from "@/components/kronos/EmptyStateCTA";
import { getCachedSession } from "@/server/session";
import LogrosCatalogCached from "@/components/atleta/LogrosCatalogCached";

export async function LogrosContent() {
  const session = await getCachedSession();
  const tenantId = session?.user?.tenantId ?? "";
  const userId = session?.user?.id ?? "";
  const all = await listBadgesWithProgress();

  if (all.length === 0) {
    return (
      <div className="px-4">
        <EmptyStateCTA
          title="Aún no hay logros disponibles"
          description="Los logros se desbloquean cuando alcanzas metas de entrenamiento. Mientras tanto, sigue registrando tus WODs y PRs."
          ctaLabel="Ver WOD de hoy"
          ctaHref="/atleta/wod"
          secondaryLabel="Explorar movimientos"
          secondaryHref="/atleta/movimientos"
        />
      </div>
    );
  }

  return (
    <LogrosCatalogCached
      tenantId={tenantId}
      userId={userId}
      initialData={all}
    />
  );
}

export function LogrosContentSkeleton() {
  return (
    <div className="px-4 mt-4 space-y-4">
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="k-card k-skeleton"
            style={{ minHeight: 168, borderRadius: 12 }}
          />
        ))}
      </div>
    </div>
  );
}
