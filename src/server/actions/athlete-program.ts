"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { isPersonalBoxSlug } from "@/lib/personal-box";

const dayInputSchema = z.object({
  scheduledFor: z.coerce.date(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional(),
  type: z
    .enum(["FORTIME", "AMRAP", "EMOM", "TABATA", "STRENGTH", "CUSTOM"])
    .default("CUSTOM"),
  scoreType: z.enum(["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"]).default("REPS"),
});

export type ProgramDayInput = z.infer<typeof dayInputSchema>;

export type ScheduledProgramWod = {
  id: string;
  scheduledFor: Date;
  name: string;
  description: string | null;
  type: string;
  scoreType: string;
};

async function requirePersonalSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) {
    throw new Error("Unauthorized");
  }
  const box = await rawDb.box.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });
  if (!box || !isPersonalBoxSlug(box.slug)) {
    throw new Error("not-personal");
  }
  const athlete = await rawDb.athlete.findFirst({
    where: { userId: session.user.id, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!athlete) throw new Error("Athlete profile not found");
  return {
    tenantId: session.user.tenantId,
    athleteId: athlete.id,
  };
}

export async function listMyScheduledProgramWods(opts?: {
  fromDate?: Date;
  toDate?: Date;
}): Promise<ScheduledProgramWod[]> {
  const { tenantId, athleteId } = await requirePersonalSession();
  const db = withTenant(tenantId);
  const from = opts?.fromDate ?? startOfWeek(new Date());
  const to = opts?.toDate ?? addDays(from, 14);

  const rows = await db.wOD.findMany({
    where: {
      ownerAthleteId: athleteId,
      scheduledFor: { gte: from, lte: to },
      isActive: true,
    },
    orderBy: { scheduledFor: "asc" },
    select: {
      id: true,
      scheduledFor: true,
      name: true,
      description: true,
      type: true,
      scoreType: true,
    },
  });
  return rows
    .filter(
      (r): r is typeof r & { scheduledFor: Date } => r.scheduledFor !== null,
    )
    .map((r) => ({
      id: r.id,
      scheduledFor: r.scheduledFor,
      name: r.name,
      description: r.description,
      type: r.type as string,
      scoreType: r.scoreType as string,
    }));
}

export type CreateProgramResult =
  | { ok: true; createdCount: number }
  | { ok: false; error: string };

export async function createProgramDays(
  days: unknown[],
): Promise<CreateProgramResult> {
  let session: { tenantId: string; athleteId: string };
  try {
    session = await requirePersonalSession();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unauthorized",
    };
  }

  const parsed = z.array(dayInputSchema).max(14).safeParse(days);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION" };
  }

  const created = await rawDb.$transaction(
    parsed.data.map((d) =>
      rawDb.wOD.create({
        data: {
          tenantId: session.tenantId,
          ownerAthleteId: session.athleteId,
          scheduledFor: d.scheduledFor,
          name: d.name,
          description: d.description ?? null,
          type: d.type,
          scoreType: d.scoreType,
        },
      }),
    ),
  );

  revalidatePath("/atleta/programa");
  revalidatePath("/atleta");
  return { ok: true, createdCount: created.length };
}

export async function deleteProgramWod(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  let session: { tenantId: string; athleteId: string };
  try {
    session = await requirePersonalSession();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unauthorized",
    };
  }

  const wod = await rawDb.wOD.findUnique({ where: { id } });
  if (!wod || wod.tenantId !== session.tenantId) {
    return { ok: false, error: "not-found" };
  }
  if (wod.ownerAthleteId !== session.athleteId) {
    return { ok: false, error: "forbidden" };
  }

  // Soft delete to preserve scores
  await rawDb.wOD.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/atleta/programa");
  return { ok: true };
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as start
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
