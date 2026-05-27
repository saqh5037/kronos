import Link from "next/link";
import { getCachedSession } from "@/server/session";
import { db } from "@/server/db";

/**
 * Dismissible banner — shown ONLY when the athlete explicitly skipped the
 * onboarding wizard but has not yet completed it.
 *
 * Server component: reads DB directly (same pattern as layout.tsx gate).
 * Does NOT use withTenant() because this is a single-field check keyed by
 * userId + tenantId — the documented exception for lightweight identity checks.
 */
export async function CompleteProfileBannerSection() {
  const session = await getCachedSession();
  if (!session?.user?.id || !session?.user?.tenantId) return null;

  const athlete = await db.athlete.findFirst({
    where: {
      userId: session.user.id,
      tenantId: session.user.tenantId,
    },
    select: {
      onboardingCompletedAt: true,
      onboardingSkippedAt: true,
    },
  });

  // Only show when skipped but not completed
  if (
    !athlete ||
    athlete.onboardingCompletedAt ||
    !athlete.onboardingSkippedAt
  ) {
    return null;
  }

  return (
    <div
      className="mx-3.5 mt-3 mb-1 rounded-2xl p-3.5 flex items-center gap-3"
      style={{
        background:
          "linear-gradient(135deg, var(--k-elevated) 0%, var(--k-surface) 100%)",
        border: "1px solid var(--k-accent-line)",
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "var(--k-accent-soft)",
          border: "1px solid var(--k-accent-line)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--k-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-[13px]"
          style={{ color: "var(--k-t1)" }}
        >
          Completa tu perfil
        </p>
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: "var(--k-t3)" }}
        >
          Personaliza tu plan y recomendaciones
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/atleta/onboarding"
        className="k-btn-grad text-[11px] px-3 py-1.5 rounded-lg font-semibold shrink-0 whitespace-nowrap"
      >
        Continuar
      </Link>
    </div>
  );
}
