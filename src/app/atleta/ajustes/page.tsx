/**
 * Athlete settings.
 *
 * Audit 2026-09-15: "Account card says 'Atleta Demo · atleta@iron-hands.demo'
 * while every other screen says Emma Soto. Identity mismatch." — the card read
 * `session.user.name` (the login row) instead of the athlete profile. It also
 * shipped a theme toggle under `forcedTheme="dark"` (a dead control) and had no
 * notifications, devices, privacy or help, although the Explorar tile promises
 * "Cuenta y privacidad".
 *
 * The header is the same back link every other athlete screen uses, so this is
 * no longer a fifth header pattern.
 */

import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { getServerSession } from "next-auth";
import { Bell, ChevronRight, LifeBuoy, ShieldCheck } from "lucide-react";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import { SignOutButton } from "@/components/auth/SignOutButton";
import PushSubscribeButton from "@/components/atleta/PushSubscribeButton";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import Eyebrow from "@/components/kronos/Eyebrow";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { ajustesTour } from "@/components/tour/tours/ajustes";
import {
  DevicesCard,
  DevicesCardSkeleton,
} from "../salud/_components/DevicesCard";

export const metadata = { title: "Kronos — Ajustes" };

export default async function AjustesAtletaPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? null;

  // The athlete profile is the identity every other screen shows; the User row
  // is only the login. Reading the profile first is what fixes "Atleta Demo".
  let athleteName: string | null = null;
  let showCompleteProfile = false;
  if (session?.user?.id && session?.user?.tenantId) {
    const athlete = await db.athlete.findFirst({
      where: { userId: session.user.id, tenantId: session.user.tenantId },
      select: {
        firstName: true,
        lastName: true,
        onboardingCompletedAt: true,
        onboardingSkippedAt: true,
      },
    });
    if (athlete) {
      const full = `${athlete.firstName} ${athlete.lastName}`.trim();
      athleteName = full.length > 0 ? full : null;
      showCompleteProfile =
        !athlete.onboardingCompletedAt && !!athlete.onboardingSkippedAt;
    }
  }

  const displayName = athleteName ?? session?.user?.name ?? "Mi cuenta";
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="pb-28 px-4 pt-10">
      <div data-tour="ajustes.header" className="mb-6">
        <div className="pl-12 lg:pl-0">
          <AthleteBackLink href="/atleta/perfil" label="Perfil" />
        </div>
        <div className="flex items-end gap-3 mt-1">
          <div>
            <Eyebrow>Cuenta</Eyebrow>
            <h1 className="font-display font-extrabold text-2xl leading-none mt-1">
              Ajustes
            </h1>
          </div>
          <div className="ml-auto">
            <TourTriggerButton tourId={ajustesTour.id} />
          </div>
        </div>
      </div>

      {/* Identity */}
      <section data-tour="ajustes.user-card" className="k-card p-5 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg font-bold shrink-0"
            style={{
              background: "var(--k-accent)",
              color: "var(--k-accent-on)",
            }}
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base truncate">{displayName}</p>
            {userEmail && (
              <p className="text-xs truncate" style={{ color: "var(--k-t2)" }}>
                {userEmail}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section data-tour="ajustes.preferencias" className="k-card p-5 mb-4">
        <SectionTitle>Preferencias</SectionTitle>
        {showCompleteProfile && (
          <SettingLink
            href="/atleta/onboarding"
            title="Completar mi perfil"
            hint="Terminar el asistente de configuración"
            accent
          />
        )}
        <SettingLink
          href="/atleta/perfil"
          title="Unidades y nivel"
          hint="Kilos o libras, y tu nivel de entrenamiento"
        />
      </section>

      {/* Notifications — the existing push control, inline. */}
      <section className="k-card p-5 mb-4">
        <SectionTitle>Notificaciones</SectionTitle>
        <div className="flex items-start gap-3">
          <Bell
            size={18}
            aria-hidden
            style={{ color: "var(--k-t3)", flexShrink: 0, marginTop: 2 }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Avisos en este dispositivo</p>
            <p className="text-xs mb-3" style={{ color: "var(--k-t2)" }}>
              Recordatorios de clase, resultados y logros.
            </p>
            <PushSubscribeButton />
          </div>
        </div>
      </section>

      {/* Devices — the same real Whoop control as /atleta/salud. */}
      <section className="k-card p-5 mb-4">
        <SectionTitle>Dispositivos</SectionTitle>
        <Suspense fallback={<DevicesCardSkeleton />}>
          <DevicesCard bare />
        </Suspense>
      </section>

      {/* Privacy + help */}
      <section className="k-card p-5 mb-4">
        <SectionTitle>Privacidad y ayuda</SectionTitle>
        <SettingLink
          href="/legal/privacidad"
          title="Aviso de privacidad"
          hint="Qué datos guardamos y cómo ejercer tus derechos"
          icon={<ShieldCheck size={18} aria-hidden />}
        />
        <SettingLink
          href="/atleta/ayuda"
          title="Centro de ayuda"
          hint="Tutoriales y cómo contactar a tu coach"
          icon={<LifeBuoy size={18} aria-hidden />}
        />
      </section>

      {/* Session */}
      <section data-tour="ajustes.sesion" className="k-card p-5">
        <SectionTitle>Sesión</SectionTitle>
        <SignOutButton variant="danger" />
      </section>

      <p
        className="text-center text-[10px] mt-8"
        style={{ color: "var(--k-t3)" }}
      >
        Kronos · v1.0
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-mono text-[10px] font-bold uppercase tracking-wider mb-3"
      style={{ color: "var(--k-t3)" }}
    >
      {children}
    </p>
  );
}

function SettingLink({
  href,
  title,
  hint,
  accent,
  icon,
}: {
  href: string;
  title: string;
  hint: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href as Route}
      className="flex items-center gap-3 py-2 -mx-1 px-1 rounded-lg"
      style={{ minHeight: 44, textDecoration: "none" }}
    >
      {icon && (
        <span style={{ color: "var(--k-t3)", flexShrink: 0 }}>{icon}</span>
      )}
      <span className="flex-1 min-w-0">
        <span
          className="font-medium text-sm block"
          style={{ color: accent ? "var(--k-accent)" : "var(--k-t1)" }}
        >
          {title}
        </span>
        <span className="text-xs block" style={{ color: "var(--k-t2)" }}>
          {hint}
        </span>
      </span>
      <ChevronRight
        size={16}
        aria-hidden
        style={{ color: "var(--k-t3)", flexShrink: 0 }}
      />
    </Link>
  );
}
