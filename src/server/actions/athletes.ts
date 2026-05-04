"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import { athleteSchema } from "@/lib/validations/athlete";
import { revalidatePath } from "next/cache";

export async function listAthletes() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const db = withTenant(session.user.tenantId);
  return db.athlete.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      phone: true,
      createdAt: true,
    },
  });
}

export async function createAthlete(data: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const parsed = athleteSchema.parse(data);
  const db = withTenant(session.user.tenantId);

  // tenantId is explicitly passed — withTenant also injects it at query level
  const athlete = await db.athlete.create({
    data: { ...parsed, tenantId: session.user.tenantId },
  });
  revalidatePath("/admin/atletas");
  return athlete;
}
