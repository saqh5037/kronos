"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { db as prismaBase } from "../db";
import { boxSettingsSchema } from "@/lib/validations/box";
import { revalidatePath } from "next/cache";

export type BoxSettings = {
  id: string;
  slug: string;
  name: string;
  locale: string;
  currency: string;
  timezone: string;
  defaultClassCapacity: number;
  brandColor: string | null;
  logoUrl: string | null;
};

export async function getBox(): Promise<BoxSettings> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  // Box queries bypass withTenant — Box is the tenant itself, scoped by id
  const box = await prismaBase.box.findUnique({
    where: { id: session.user.tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      locale: true,
      currency: true,
      timezone: true,
      defaultClassCapacity: true,
      brandColor: true,
      logoUrl: true,
    },
  });
  if (!box) throw new Error("Box not found");
  return box;
}

export async function updateBox(data: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER") {
    throw new Error("Forbidden: solo OWNER puede modificar ajustes");
  }

  const parsed = boxSettingsSchema.parse(data);

  // Box.update intentionally bypasses the tenant extension because Box itself
  // is the tenant — withTenant would inject a tenantId filter on a model that
  // does not have that column. We scope by id (which equals the tenantId).
  const updated = await prismaBase.box.update({
    where: { id: session.user.tenantId },
    data: {
      name: parsed.name,
      locale: parsed.locale,
      currency: parsed.currency,
      timezone: parsed.timezone,
      defaultClassCapacity: parsed.defaultClassCapacity,
      brandColor: parsed.brandColor ?? null,
      logoUrl: parsed.logoUrl ?? null,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      locale: true,
      currency: true,
      timezone: true,
      defaultClassCapacity: true,
      brandColor: true,
      logoUrl: true,
    },
  });

  revalidatePath("/admin/ajustes");
  revalidatePath(`/tv/${updated.slug}`);
  return updated;
}
