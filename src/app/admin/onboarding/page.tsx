import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { getBox, getBoxSchedule } from "@/server/actions/box";
import { getOnboardingStatus } from "@/server/actions/onboarding";
import { getBenchmarkWodPresets } from "@/lib/wod-presets-data";
import {
  isBoxNotFoundError,
  isDBError,
  isUnauthorizedError,
  type AdminDashboardErrorKind,
} from "@/lib/errors";
import * as Sentry from "@sentry/nextjs";
import AdminErrorState from "../_components/AdminErrorState";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "Kronos — Configura tu box" };

const LOG_PREFIX = "[onboarding:server]";

function isNextRedirectError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin");

  let errorKind: AdminDashboardErrorKind | null = null;
  let errorDetail: string | null = null;

  try {
    const [box, schedule, status] = await Promise.all([
      getBox(),
      getBoxSchedule(),
      getOnboardingStatus(),
    ]);
    const wodPresets = getBenchmarkWodPresets();

    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <OnboardingWizard
            box={box}
            schedule={schedule}
            status={status}
            wodPresets={wodPresets}
          />
        </div>
      </div>
    );
  } catch (err) {
    if (isNextRedirectError(err)) throw err;

    if (isUnauthorizedError(err)) {
      errorKind = "UNAUTHORIZED";
    } else if (isBoxNotFoundError(err)) {
      errorKind = "BOX_NOT_FOUND";
    } else if (isDBError(err)) {
      errorKind = "DB_ERROR";
    } else if (err instanceof Error && err.message === "Unauthorized") {
      errorKind = "UNAUTHORIZED";
    } else if (err instanceof Error && err.message === "Box not found") {
      errorKind = "BOX_NOT_FOUND";
    } else {
      errorKind = "DB_ERROR";
    }

    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    errorDetail = `${err instanceof Error ? err.name : "Unknown"}: ${message}\n${stack}`;

    console.error(
      `${LOG_PREFIX} ${errorKind} — userId=${session.user.id ?? "?"} tenantId=${session.user.tenantId ?? "?"} role=${session.user.role ?? "?"} message="${message}"`,
    );
    if (stack) console.error(`${LOG_PREFIX} stack:\n${stack}`);

    Sentry.captureException(err, {
      tags: {
        feature: "admin_onboarding",
        kind: errorKind,
        userId: session.user.id ?? "unknown",
        tenantId: session.user.tenantId ?? "unknown",
      },
    });
  }

  return (
    <AdminErrorState
      kind={errorKind}
      userEmail={session.user.email ?? null}
      userId={session.user.id ?? null}
      devDetail={process.env.NODE_ENV === "development" ? errorDetail : null}
    />
  );
}
