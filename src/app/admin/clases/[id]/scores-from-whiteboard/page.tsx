import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/server/auth";
import { db as rawDb, withTenant } from "@/server/db";
import { formatDateWeekday, formatTime24 } from "@/lib/format";
import { scoreTypeLabel } from "@/lib/labels";
import Step1Upload from "./_steps/Step1Upload";
import Step2Review from "./_steps/Step2Review";
import Step3Confirm from "./_steps/Step3Confirm";
import type { WhiteboardRow } from "@/server/ocr/whiteboard";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string; uploadId?: string; count?: string }>;
};

/** The three steps, named — "PASO 1 DE 3" alone says nothing about 2 and 3. */
const STEPS = ["Foto", "Revisar", "Guardar"] as const;

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider">
      {STEPS.map((name, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const active = step === current;
        const done = step < current;
        return (
          <li key={name} className="flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1"
              style={{
                background: active
                  ? "var(--k-accent-soft)"
                  : "var(--k-elevated)",
                color: active
                  ? "var(--k-accent)"
                  : done
                    ? "var(--k-t1)"
                    : "var(--k-t2)",
                border: `1px solid ${
                  active ? "var(--k-accent-line)" : "var(--k-line-2)"
                }`,
              }}
            >
              {step}. {name}
            </span>
            {step < 3 ? (
              <span aria-hidden style={{ color: "var(--k-t3)" }}>
                ·
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function BackBar({ classId }: { classId: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Link
        href={`/admin/asistencia#clase-${classId}` as Route}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-[var(--k-t2)] hover:text-[var(--k-t1)]"
      >
        <ArrowLeft size={16} aria-hidden />
        Volver a asistencia
      </Link>
      <Link
        href="/admin/asistencia"
        className="k-btn-ghost inline-flex min-h-11 items-center rounded-full px-4 text-xs font-semibold"
      >
        Cancelar
      </Link>
    </div>
  );
}

export default async function ScoresFromWhiteboardPage({
  params,
  searchParams,
}: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH" && role !== "STAFF") {
    redirect("/admin");
  }

  const { id: classId } = await params;
  const { step, uploadId, count } = await searchParams;

  // Verify class belongs to tenant
  const db = withTenant(session.user.tenantId);
  const klass = await db.class.findUnique({
    where: { id: classId },
    include: { wod: true },
  });
  if (!klass) notFound();

  const classLabel = `${formatDateWeekday(klass.startsAt)} · ${formatTime24(
    klass.startsAt,
  )}`;

  // Step 3: done
  if (step === "done") {
    return (
      <main className="min-h-screen bg-[var(--k-bg)] p-4 max-w-4xl mx-auto">
        <BackBar classId={classId} />
        <Stepper current={3} />
        <Step3Confirm count={parseInt(count ?? "0")} />
      </main>
    );
  }

  // Step 2: review AI results
  if (step === "review" && uploadId) {
    const upload = await rawDb.whiteboardUpload.findUnique({
      where: { id: uploadId },
    });

    if (!upload || !upload.aiResult) {
      // Fallback: redirect to step 1
      redirect(`/admin/clases/${classId}/scores-from-whiteboard`);
    }

    // Load roster
    const bookings = await rawDb.booking.findMany({
      where: { classId },
      include: {
        athlete: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const roster = bookings.map((b) => ({
      athleteId: b.athlete.id,
      firstName: b.athlete.firstName,
      lastName: b.athlete.lastName,
    }));

    const aiRows = (upload.aiResult as { rows: WhiteboardRow[] }).rows;
    const wodScoreType = klass.wod?.scoreType ?? "TIME";

    return (
      <main className="min-h-screen bg-[var(--k-bg)] p-4 max-w-4xl mx-auto">
        <BackBar classId={classId} />
        <Stepper current={2} />
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[var(--k-t1)]">
            Scores desde pizarra
          </h1>
          <p className="text-[var(--k-t2)] text-sm mt-1">
            Clase del {classLabel}
            {klass.wod
              ? ` · ${klass.wod.name} · Se mide en ${scoreTypeLabel[
                  wodScoreType
                ].toLowerCase()}`
              : ""}
          </p>
        </div>
        <Step2Review
          uploadId={uploadId}
          classId={classId}
          aiRows={aiRows}
          roster={roster}
          wodScoreType={wodScoreType}
        />
      </main>
    );
  }

  // Step 1: upload (default)
  return (
    <main className="min-h-screen bg-[var(--k-bg)] p-4 max-w-4xl mx-auto">
      <BackBar classId={classId} />
      <Stepper current={1} />
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[var(--k-t1)]">
          Cargar scores de pizarra
        </h1>
        <p className="text-[var(--k-t2)] text-sm mt-1">
          Clase del {classLabel}
          {klass.wod ? ` · ${klass.wod.name}` : ""}
        </p>
      </div>
      <Step1Upload classId={classId} />
    </main>
  );
}
