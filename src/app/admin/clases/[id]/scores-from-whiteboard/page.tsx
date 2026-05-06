import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as rawDb, withTenant } from "@/server/db";
import Step1Upload from "./_steps/Step1Upload";
import Step2Review from "./_steps/Step2Review";
import Step3Confirm from "./_steps/Step3Confirm";
import type { WhiteboardRow } from "@/server/ocr/whiteboard";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string; uploadId?: string; count?: string }>;
};

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

  // Step 3: done
  if (step === "done") {
    return (
      <main className="min-h-screen bg-bg p-4">
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
      <main className="min-h-screen bg-bg p-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-text">
            Scores desde pizarra
          </h1>
          <p className="text-text-2 text-sm mt-1">
            Clase del{" "}
            {klass.startsAt.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {klass.wod
              ? ` · WOD: ${klass.wod.name} · Tipo: ${wodScoreType}`
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
    <main className="min-h-screen bg-bg p-4 flex items-start justify-center pt-16">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-text">
            Cargar scores de pizarra
          </h1>
          <p className="text-text-2 text-sm mt-1">
            Clase:{" "}
            {klass.startsAt.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {klass.wod ? ` · ${klass.wod.name}` : ""}
          </p>
        </div>
        <Step1Upload classId={classId} />
      </div>
    </main>
  );
}
