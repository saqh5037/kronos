/**
 * CLI helper para generar el magic link de firma piloto-beta (F1.8).
 *
 * Uso (dev local — necesita .env.local):
 *   pnpm tsx --env-file=.env.local scripts/generate-pilot-beta-link.ts <slug>
 *
 * Uso (prod EC2 — usa .env del proyecto):
 *   pnpm tsx --env-file=.env scripts/generate-pilot-beta-link.ts <slug>
 *
 * Ejemplo:
 *   pnpm tsx --env-file=.env.local scripts/generate-pilot-beta-link.ts hyrox-polanco
 *
 * Output:
 *   - Box info (id, name, discipline, ciudad, estado de firma)
 *   - Magic link URL completa con token (7 días de validez)
 *
 * Requiere env PILOT_BETA_TOKEN_SECRET (mín 16 chars).
 */

import { db } from "@/server/db";
import { signPilotBetaToken } from "@/lib/pilot-beta-token";

const DEFAULT_EXPIRY_SEC = 7 * 24 * 60 * 60; // 7 días

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("✗ Uso: pnpm tsx scripts/generate-pilot-beta-link.ts <slug>");
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const box = await db.box.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      country: true,
      subscriptionStatus: true,
      trialStartedAt: true,
      trialEndsAt: true,
      pilotBetaSignedAt: true,
      pilotExclusivityExpiresAt: true,
      discipline: { select: { slug: true, name: true } },
      users: {
        where: { role: "OWNER" },
        select: { email: true, name: true },
        take: 1,
      },
    },
  });

  if (!box) {
    console.error(`✗ No existe Box con slug="${slug}"`);
    console.error("  Listar boxes existentes:");
    console.error(
      '    psql $DATABASE_URL -c "SELECT slug, name FROM \\"Box\\" ORDER BY \\"createdAt\\" DESC LIMIT 10;"',
    );
    await db.$disconnect();
    process.exit(1);
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📦  ${box.name}`);
  console.log(`    slug: ${box.slug}`);
  console.log(`    id:   ${box.id}`);
  console.log(`    geo:  ${box.city ?? "—"}, ${box.country}`);
  console.log(
    `    disciplina: ${box.discipline?.name ?? "—"} (${box.discipline?.slug ?? "no asignada"})`,
  );
  console.log(
    `    owner: ${box.users[0]?.email ?? "—"} (${box.users[0]?.name ?? "sin nombre"})`,
  );
  console.log("");
  console.log(`    estado: ${box.subscriptionStatus}`);
  if (box.trialEndsAt) {
    const daysLeft = Math.ceil(
      (box.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    );
    console.log(
      `    trial:  ${daysLeft} días restantes (vence ${box.trialEndsAt.toISOString().slice(0, 10)})`,
    );
  }
  if (box.pilotExclusivityExpiresAt) {
    const daysLeft = Math.ceil(
      (box.pilotExclusivityExpiresAt.getTime() - Date.now()) /
        (24 * 60 * 60 * 1000),
    );
    console.log(`    exclusividad: ${daysLeft} días restantes`);
  }
  console.log(
    `    firma piloto-beta: ${
      box.pilotBetaSignedAt
        ? `✓ ${box.pilotBetaSignedAt.toISOString().slice(0, 10)}`
        : "⏳ pendiente"
    }`,
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  if (box.pilotBetaSignedAt) {
    console.log(
      "ℹ  Este Box ya firmó — generar link igual para test (la página mostrará pantalla 'ya firmado').",
    );
    console.log("");
  }

  let token: string;
  try {
    token = signPilotBetaToken({
      boxId: box.id,
      expiresInSec: DEFAULT_EXPIRY_SEC,
    });
  } catch (e) {
    console.error(
      "✗ Error firmando token. Verifica que PILOT_BETA_TOKEN_SECRET esté en .env (mín 16 chars).",
    );
    console.error("  Detalle:", e instanceof Error ? e.message : String(e));
    await db.$disconnect();
    process.exit(1);
  }

  const url = `${baseUrl}/piloto-beta?token=${token}`;
  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRY_SEC * 1000);

  console.log(
    "🔗  Magic link (válido 7 días, hasta " +
      expiresAt.toISOString().slice(0, 10) +
      "):",
  );
  console.log("");
  console.log("   " + url);
  console.log("");
  console.log("📋  Test rápido:");
  console.log("   open '" + url + "'");
  console.log("");

  await db.$disconnect();
}

main().catch((e) => {
  console.error("✗ Error inesperado:", e);
  process.exit(1);
});
