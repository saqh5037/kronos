"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { authOptions } from "../auth";
import { db as rawDb, withTenant } from "../db";
import { getStorage } from "../storage";

const MAX_MEDIA_BYTES = 8 * 1024 * 1024;
const MAX_NOTES_LEN = 1000;
const MAX_DIVISION_LEN = 80;
const MAX_SCORE_SECONDS = 24 * 60 * 60;

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function requireAthleteSession() {
  const session = await requireSession();
  if (session.user.role !== "ATHLETE") {
    throw new Error("Solo atletas pueden inscribirse a eventos");
  }
  return session;
}

async function requireBoxStaffSession() {
  const session = await requireSession();
  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH" && role !== "STAFF") {
    throw new Error("Forbidden — OWNER/COACH/STAFF only");
  }
  return session;
}

async function getMyAthlete(userId: string, tenantId: string) {
  const db = withTenant(tenantId);
  return db.athlete.findFirst({ where: { userId } });
}

export type SportEventDTO = {
  id: string;
  slug: string;
  name: string;
  partnerName: string | null;
  description: string | null;
  coverUrl: string | null;
  startDate: Date;
  endDate: Date | null;
  scoreType: string;
  scoreUnit: string | null;
  divisions: string[];
  status: string;
  kitUrl: string | null;
};

export type EventEntryDTO = {
  id: string;
  eventId: string;
  athleteId: string;
  tenantId: string;
  division: string | null;
  scoreValue: number | null;
  scoreText: string | null;
  notes: string | null;
  mediaUrl: string | null;
  submittedAt: Date | null;
  createdAt: Date;
};

function toEventDTO(
  row: Awaited<ReturnType<typeof rawDb.sportEvent.findUnique>>,
): SportEventDTO | null {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    partnerName: row.partnerName,
    description: row.description,
    coverUrl: row.coverUrl,
    startDate: row.startDate,
    endDate: row.endDate,
    scoreType: row.scoreType,
    scoreUnit: row.scoreUnit,
    divisions: row.divisions,
    status: row.status,
    kitUrl: row.kitUrl,
  };
}

function toEntryDTO(
  row: Awaited<ReturnType<typeof rawDb.eventEntry.findUnique>>,
): EventEntryDTO | null {
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.eventId,
    athleteId: row.athleteId,
    tenantId: row.tenantId,
    division: row.division,
    scoreValue: row.scoreValue === null ? null : Number(row.scoreValue),
    scoreText: row.scoreText,
    notes: row.notes,
    mediaUrl: row.mediaUrl,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
  };
}

/**
 * Public read by accessToken — used by the QR landing at /eventos/[token].
 * Returns the event regardless of status (the landing decides what to render
 * for CLOSED/ARCHIVED). Returns null if the token doesn't match anything.
 */
export async function getEventByAccessToken(
  token: string,
): Promise<SportEventDTO | null> {
  if (!token || token.length < 8) return null;
  const row = await rawDb.sportEvent.findUnique({
    where: { accessToken: token },
  });
  return toEventDTO(row);
}

export type EventWithMyEntry = {
  event: SportEventDTO;
  entry: EventEntryDTO | null;
};

/**
 * Athlete-side detail: event + the caller's own entry (if registered).
 * Returns null if the slug doesn't exist or the athlete has no profile.
 */
export async function getEventBySlugForAthlete(
  slug: string,
): Promise<EventWithMyEntry | null> {
  const session = await requireAthleteSession();
  const me = await getMyAthlete(session.user.id, session.user.tenantId);
  if (!me) return null;

  const row = await rawDb.sportEvent.findUnique({ where: { slug } });
  const eventDto = toEventDTO(row);
  if (!eventDto || !row) return null;

  const entry = await rawDb.eventEntry.findUnique({
    where: { eventId_athleteId: { eventId: row.id, athleteId: me.id } },
  });

  return { event: eventDto, entry: toEntryDTO(entry) };
}

/**
 * Register the current athlete to an event by its QR access token.
 * Idempotent: if already registered, returns the existing entry without
 * raising. Returns the entry + event slug for the caller to redirect.
 */
export async function registerToEvent(token: string): Promise<{
  entryId: string;
  eventSlug: string;
  alreadyRegistered: boolean;
}> {
  const session = await requireAthleteSession();
  const me = await getMyAthlete(session.user.id, session.user.tenantId);
  if (!me) throw new Error("No tienes perfil de atleta en este box");

  const event = await rawDb.sportEvent.findUnique({
    where: { accessToken: token },
  });
  if (!event) throw new Error("Código de evento inválido");
  if (event.status !== "OPEN") {
    throw new Error("Este evento no está abierto para inscripciones");
  }

  try {
    const entry = await rawDb.eventEntry.create({
      data: {
        eventId: event.id,
        athleteId: me.id,
        tenantId: session.user.tenantId,
        registeredVia: "QR",
      },
    });
    revalidatePath("/atleta/eventos");
    return {
      entryId: entry.id,
      eventSlug: event.slug,
      alreadyRegistered: false,
    };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const existing = await rawDb.eventEntry.findUnique({
        where: {
          eventId_athleteId: { eventId: event.id, athleteId: me.id },
        },
      });
      if (existing) {
        return {
          entryId: existing.id,
          eventSlug: event.slug,
          alreadyRegistered: true,
        };
      }
    }
    throw err;
  }
}

const submitSchema = z.object({
  entryId: z.string().min(1),
  division: z.string().trim().min(1).max(MAX_DIVISION_LEN),
  scoreSeconds: z.number().int().min(0).max(MAX_SCORE_SECONDS),
  scoreText: z.string().trim().max(40),
  notes: z
    .string()
    .trim()
    .max(MAX_NOTES_LEN)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

/**
 * Submit (or overwrite) the result for an EventEntry owned by the current
 * athlete. Accepts FormData with: entryId, division, scoreSeconds, scoreText,
 * notes (optional), media (optional File, max 8 MB image).
 */
export async function submitEventResult(
  formData: FormData,
): Promise<{ ok: true; entryId: string }> {
  const session = await requireAthleteSession();
  const me = await getMyAthlete(session.user.id, session.user.tenantId);
  if (!me) throw new Error("No tienes perfil de atleta en este box");

  const parsed = submitSchema.parse({
    entryId: formData.get("entryId"),
    division: formData.get("division"),
    scoreSeconds: Number(formData.get("scoreSeconds")),
    scoreText: formData.get("scoreText"),
    notes: formData.get("notes") ?? undefined,
  });

  const entry = await rawDb.eventEntry.findUnique({
    where: { id: parsed.entryId },
    include: { event: true },
  });
  if (!entry) throw new Error("Inscripción no encontrada");
  if (entry.athleteId !== me.id) {
    throw new Error("No puedes modificar la inscripción de otro atleta");
  }
  if (entry.event.status !== "OPEN") {
    throw new Error("Este evento ya no acepta resultados");
  }
  if (
    entry.event.divisions.length > 0 &&
    !entry.event.divisions.includes(parsed.division)
  ) {
    throw new Error("División no válida para este evento");
  }

  const mediaFile = formData.get("media");
  let mediaUrl: string | null = entry.mediaUrl;
  let mediaPathname: string | null = entry.mediaPathname;

  if (mediaFile instanceof File && mediaFile.size > 0) {
    if (!mediaFile.type.startsWith("image/")) {
      throw new Error("Solo se aceptan imágenes (image/*)");
    }
    if (mediaFile.size > MAX_MEDIA_BYTES) {
      throw new Error("La imagen no puede superar 8 MB");
    }
    const buffer = Buffer.from(await mediaFile.arrayBuffer());
    const pathname = `events/${entry.eventId}/${entry.id}-${Date.now()}-${safeName(mediaFile.name)}`;
    const storage = getStorage();
    const stored = await storage.put({
      buffer,
      contentType: mediaFile.type || "image/jpeg",
      pathname,
    });
    mediaUrl = stored.url;
    mediaPathname = stored.pathname;
  }

  await rawDb.eventEntry.update({
    where: { id: entry.id },
    data: {
      division: parsed.division,
      scoreValue: new Prisma.Decimal(parsed.scoreSeconds),
      scoreText: parsed.scoreText,
      notes: parsed.notes,
      mediaUrl,
      mediaPathname,
      submittedAt: new Date(),
    },
  });

  revalidatePath("/atleta/eventos");
  revalidatePath(`/atleta/eventos/${entry.event.slug}`);
  revalidatePath("/admin/eventos");
  return { ok: true, entryId: entry.id };
}

export type MyEventEntryRow = EventEntryDTO & {
  event: SportEventDTO;
};

/**
 * List events where the current athlete has an EventEntry. Includes the event
 * payload so the list view can render cards without extra queries.
 */
export async function listMyEventEntries(): Promise<MyEventEntryRow[]> {
  const session = await requireAthleteSession();
  const me = await getMyAthlete(session.user.id, session.user.tenantId);
  if (!me) return [];

  const rows = await rawDb.eventEntry.findMany({
    where: { athleteId: me.id },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => {
    const dto = toEntryDTO(r)!;
    const event = toEventDTO(r.event)!;
    return { ...dto, event };
  });
}

export type BoxEntryRow = EventEntryDTO & {
  athleteName: string;
  athletePhotoUrl: string | null;
};

/**
 * For OWNER/COACH/STAFF surfaces: list all entries for a given event from
 * athletes belonging to the caller's box. Tenant-scoped by `EventEntry.tenantId`.
 */
export async function listBoxEntriesForEvent(
  eventSlug: string,
): Promise<{ event: SportEventDTO | null; rows: BoxEntryRow[] }> {
  const session = await requireBoxStaffSession();
  const event = await rawDb.sportEvent.findUnique({
    where: { slug: eventSlug },
  });
  const eventDto = toEventDTO(event);
  if (!event || !eventDto) return { event: null, rows: [] };

  const rows = await rawDb.eventEntry.findMany({
    where: { eventId: event.id, tenantId: session.user.tenantId },
    include: {
      athlete: { select: { firstName: true, lastName: true, photoUrl: true } },
    },
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
  });

  return {
    event: eventDto,
    rows: rows.map((r) => {
      const dto = toEntryDTO(r)!;
      const fullName = `${r.athlete.firstName} ${r.athlete.lastName}`.trim();
      return {
        ...dto,
        athleteName: fullName.length > 0 ? fullName : "Atleta",
        athletePhotoUrl: r.athlete.photoUrl,
      };
    }),
  };
}

/**
 * Public list of OPEN events. Used as a fallback on /atleta/eventos when the
 * athlete is not yet registered to anything — gives them a way to see what's
 * out there without needing the QR.
 */
export async function listOpenEvents(): Promise<SportEventDTO[]> {
  const rows = await rawDb.sportEvent.findMany({
    where: { status: "OPEN" },
    orderBy: { startDate: "asc" },
  });
  return rows.map((r) => toEventDTO(r)!).filter((x): x is SportEventDTO => !!x);
}
