/**
 * EmptyProfileSection — first-run state for an athlete with zero PRs and zero
 * scores. In the streaming refactor PRsSection and ScoresSection each return
 * null when empty, so without this a brand-new athlete sees a gap between the
 * hero and the EXPLORAR hub. We re-fetch both (cheap DB calls — same tradeoff
 * the other perfil islands make) and only render when BOTH are empty.
 *
 * Replaces the old raw-path copy ("...en /atleta/wod") with a real <Link>.
 */

import Link from "next/link";
import { listMyPRs } from "@/server/actions/prs";
import { listMyScores } from "@/server/actions/scores";
import KCard from "@/components/kronos/KCard";

export async function EmptyProfileSection() {
  let prsCount = 0;
  let scoresCount = 0;
  try {
    const [prs, scores] = await Promise.all([listMyPRs(), listMyScores(1)]);
    prsCount = prs.length;
    scoresCount = scores.length;
  } catch {
    return null;
  }

  if (prsCount > 0 || scoresCount > 0) return null;

  return (
    <div className="px-3.5 mt-6">
      <KCard>
        <div className="py-6 px-4 flex flex-col items-center gap-3 text-center">
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            Aún no tienes scores ni PRs registrados.
          </p>
          <Link
            href="/atleta/wod"
            className="k-btn-grad"
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              fontFamily: "var(--k-font-display)",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Ver WOD de hoy
          </Link>
        </div>
      </KCard>
    </div>
  );
}
