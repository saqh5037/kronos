/**
 * Helpers compartidos por scripts/seed-week.ts y e2e/box-week-simulation.spec.ts.
 *
 * - Fixtures de nombres realistas (no Lorem)
 * - Cálculo de "próximo lunes" en timezone arbitrario
 * - Cliente mínimo para mail.tm (API pública gratuita) — crea inbox temporal,
 *   espera el email de invitación, devuelve el token del link.
 *
 * mail.tm docs: https://docs.mail.tm
 */

import { randomBytes } from "node:crypto";

export const SEED_EMAIL_PREFIX = "seed-atleta-";
export const SEED_EMAIL_DOMAIN_LOCAL = "kronos-seed.local";

export type AthleteFixture = {
  firstName: string;
  lastName: string;
  phone: string;
};

const MEXICAN_FIRST_NAMES = [
  "Sofía",
  "Luis",
  "Valentina",
  "Diego",
  "Camila",
  "Mateo",
  "Ximena",
  "Andrés",
  "Renata",
  "Emilio",
  "Regina",
  "Santiago",
];

const MEXICAN_LAST_NAMES = [
  "Hernández",
  "Ramírez",
  "Torres",
  "Castillo",
  "Vargas",
  "Mendoza",
  "Aguilar",
  "Romero",
  "Ortega",
  "Cruz",
  "Reyes",
  "Salazar",
];

export function pickAthleteFixtures(count: number): AthleteFixture[] {
  const out: AthleteFixture[] = [];
  const usedFirst = new Set<number>();
  const usedLast = new Set<number>();
  for (let i = 0; i < count; i++) {
    let fi = (i * 37) % MEXICAN_FIRST_NAMES.length;
    while (usedFirst.has(fi) && usedFirst.size < MEXICAN_FIRST_NAMES.length) {
      fi = (fi + 1) % MEXICAN_FIRST_NAMES.length;
    }
    usedFirst.add(fi);
    let li = (i * 53) % MEXICAN_LAST_NAMES.length;
    while (usedLast.has(li) && usedLast.size < MEXICAN_LAST_NAMES.length) {
      li = (li + 1) % MEXICAN_LAST_NAMES.length;
    }
    usedLast.add(li);
    out.push({
      firstName: MEXICAN_FIRST_NAMES[fi]!,
      lastName: MEXICAN_LAST_NAMES[li]!,
      phone: `55${String(1000_0000 + Math.floor(Math.random() * 9_000_0000))}`,
    });
  }
  return out;
}

/**
 * Próximo lunes a las 00:00 en el timezone del box. Si hoy es lunes, devuelve hoy.
 *
 * Implementación simple — Node 18+ tiene Intl.DateTimeFormat con timezones, pero
 * para evitar drift por DST hacemos cálculo UTC con offset estático: el box guarda
 * America/Mexico_City (UTC-6 sin DST desde 2022). Aproximación buena para
 * seeding; si el box es de otro pais con DST agresivo, el día puede saltar 1h.
 */
export function getNextMondayUtc(
  timezone: string,
  now: Date = new Date(),
): Date {
  // Día de la semana en UTC: 0=Sun, 1=Mon, ..., 6=Sat
  const day = now.getUTCDay();
  // Días hasta el próximo lunes (0 si ya es lunes)
  const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  // Normaliza a 00:00 UTC; cuando combinemos con horas locales del box,
  // ajustamos con el offset del timezone abajo en buildClassStartsAt.
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

/**
 * Dado un lunes UTC 00:00, devuelve el DateTime UTC que corresponde a
 * (dayOffset, hourLocal) en el timezone del box.
 *
 * Asume timezone con offset estático (America/Mexico_City = UTC-6).
 * Para timezones DST-aggressive, sería mejor `luxon` o `date-fns-tz`, pero
 * para seeding interno este shim alcanza.
 */
const STATIC_OFFSETS_MINUTES: Record<string, number> = {
  "America/Mexico_City": -360, // UTC-6
  "America/Argentina/Buenos_Aires": -180, // UTC-3
  "America/New_York": -300, // UTC-5 (no DST aware)
  UTC: 0,
};

export function buildClassStartsAt(
  mondayUtcMidnight: Date,
  dayOffset: number,
  hourLocal: number,
  timezone: string,
): Date {
  const offsetMin = STATIC_OFFSETS_MINUTES[timezone] ?? -360;
  const d = new Date(mondayUtcMidnight);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hourLocal - offsetMin / 60, 0, 0, 0);
  return d;
}

export const WOD_HOURS_LOCAL = [6, 7, 9, 17, 18];
export const OPEN_BOX_HOURS_LOCAL = [8, 9, 10];

// ─── mail.tm client ────────────────────────────────────────────────────────────

const MAILTM_BASE = "https://api.mail.tm";

export type MailTmInbox = {
  address: string;
  password: string;
  jwt: string;
  accountId: string;
};

export async function createMailTmInbox(suffix: string): Promise<MailTmInbox> {
  // 1. Get a domain
  const domainsRes = await fetch(`${MAILTM_BASE}/domains`);
  if (!domainsRes.ok) {
    throw new Error(`mail.tm domains failed: ${domainsRes.status}`);
  }
  const domainsJson = (await domainsRes.json()) as {
    "hydra:member": { domain: string; isActive: boolean }[];
  };
  const domain = domainsJson["hydra:member"].find((d) => d.isActive)?.domain;
  if (!domain) throw new Error("mail.tm: no active domain available");

  const address = `kronos-${suffix}-${Date.now()}@${domain}`;
  const password = randomBytes(12).toString("hex");

  // 2. Create account
  const acctRes = await fetch(`${MAILTM_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!acctRes.ok && acctRes.status !== 422) {
    throw new Error(`mail.tm account create failed: ${acctRes.status}`);
  }
  const acctJson = (await acctRes.json()) as { id?: string };

  // 3. Get JWT
  const tokenRes = await fetch(`${MAILTM_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!tokenRes.ok) {
    throw new Error(`mail.tm token failed: ${tokenRes.status}`);
  }
  const tokenJson = (await tokenRes.json()) as { token: string };

  return {
    address,
    password,
    jwt: tokenJson.token,
    accountId: acctJson.id ?? "",
  };
}

/**
 * Polls mail.tm hasta que llega un email con asunto que matchee /invitamos/i
 * o body con `/invitacion/<token>`. Devuelve el token raw.
 */
export async function waitForInvitationToken(
  inbox: MailTmInbox,
  timeoutMs = 60_000,
  pollIntervalMs = 4_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const listRes = await fetch(`${MAILTM_BASE}/messages?page=1`, {
      headers: { Authorization: `Bearer ${inbox.jwt}` },
    });
    if (listRes.ok) {
      const json = (await listRes.json()) as {
        "hydra:member": { id: string; subject?: string }[];
      };
      for (const msg of json["hydra:member"]) {
        const detailRes = await fetch(`${MAILTM_BASE}/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${inbox.jwt}` },
        });
        if (!detailRes.ok) continue;
        const detail = (await detailRes.json()) as {
          html?: string[];
          text?: string;
        };
        const haystack = [...(detail.html ?? []), detail.text ?? ""].join("\n");
        const match = haystack.match(/\/invitacion\/([a-f0-9]+)/i);
        if (match?.[1]) return match[1];
      }
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  throw new Error(
    `mail.tm: invitation email not received for ${inbox.address} within ${timeoutMs}ms`,
  );
}

// ─── Logging ───────────────────────────────────────────────────────────────────

export const log = {
  info: (msg: string) => console.log(`\x1b[2m›\x1b[0m ${msg}`),
  ok: (msg: string) => console.log(`\x1b[32m✓\x1b[0m ${msg}`),
  warn: (msg: string) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`),
  err: (msg: string) => console.error(`\x1b[31m✗\x1b[0m ${msg}`),
  step: (n: number, total: number, msg: string) =>
    console.log(`\n\x1b[1m[${n}/${total}]\x1b[0m ${msg}`),
};
