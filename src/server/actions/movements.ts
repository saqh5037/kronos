"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { movementSchema } from "@/lib/validations/movement";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export async function listMovements(search?: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  return db.movement.findMany({
    where: search
      ? { name: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      videoUrl: true,
      standardDescription: true,
      equipment: true,
    },
  });
}

export async function createMovement(data: unknown) {
  const session = await requireSession();
  const parsed = movementSchema.parse(data);

  const movement = await rawDb.movement.create({
    data: {
      tenantId: session.user.tenantId,
      name: parsed.name,
      videoUrl: parsed.videoUrl,
      standardDescription: parsed.standardDescription,
      equipment: parsed.equipment,
    },
  });

  revalidatePath("/admin/wods");
  return movement;
}
