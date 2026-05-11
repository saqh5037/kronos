import {
  getBodyMetricsHistory,
  getLatestByType,
} from "@/server/actions/body-metrics";
import { listMyWellnessGoals } from "@/server/actions/goals";
import { SaludShell } from "./_components/SaludShell";

export const metadata = { title: "Kronos — Salud" };

export const dynamic = "force-dynamic";

export default async function SaludPage() {
  const [history, latest, goals] = await Promise.all([
    getBodyMetricsHistory("WEIGHT", 90),
    getLatestByType(),
    listMyWellnessGoals(),
  ]);

  return <SaludShell history={history} latest={latest} goals={goals} />;
}
