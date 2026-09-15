/**
 * TodaySection — the "Hoy" card, first thing on the athlete home.
 *
 * Audit 2026-09-15, P0 #8: the first viewport had zero actions, today's WOD
 * appeared only as a leaderboard header ~1,100 px down, and the first reachable
 * button was **Cancelar** — a destructive action a 5:40 am mis-tap would fire.
 *
 * This card answers "what do I do now" in one glance:
 *   today's WOD name + type chip · your class time (or "sin clase reservada")
 *   · ONE lime CTA.
 *
 * The CTA is the single next action:
 *   - already logged today  → "Ver ranking"          → /atleta/leaderboard
 *   - WOD today             → "Registrar resultado"  → /atleta/wod
 *   - no class booked       → "Reservar"             → /atleta/reservar
 *
 * Cancelling lives in the class card further down (BookingSection), as a
 * secondary ghost action — never in the first viewport.
 */

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CalendarPlus, ClipboardCheck, Trophy } from "lucide-react";
import {
  getAthleteHomeCached,
  getTodayWODWithScoresCached,
  listAvailableClassesCached,
} from "../request-cache";
import { wodTypeLabel } from "@/lib/labels";
import { formatTime24 } from "@/lib/format";
import { formatScore } from "@/lib/scores";
import type { WODType } from "@prisma/client";
import type { ScoreType } from "@/lib/validations/wod";

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function TodaySection() {
  const [home, today, classes] = await Promise.all([
    getAthleteHomeCached(),
    getTodayWODWithScoresCached().catch(() => null),
    listAvailableClassesCached(),
  ]);

  if (!home) return null;

  const now = new Date();
  const wod = today?.wod ?? null;
  const myScore = today?.myScore ?? null;

  // My booked class today, if any. `nextBooking` may be tomorrow's, so match
  // on the class list rather than assuming.
  const myClassToday =
    classes.find(
      (c) =>
        c.myBookingStatus === "BOOKED" && isSameLocalDay(c.startsAt, now),
    ) ?? null;

  const hasLoggedToday = myScore !== null;

  const cta = hasLoggedToday
    ? {
        href: "/atleta/leaderboard" as Route,
        label: "Ver ranking",
        icon: <Trophy width={15} height={15} aria-hidden />,
      }
    : wod
      ? {
          href: "/atleta/wod" as Route,
          label: "Registrar resultado",
          icon: <ClipboardCheck width={15} height={15} aria-hidden />,
        }
      : {
          href: "/atleta/reservar" as Route,
          label: "Reservar",
          icon: <CalendarPlus width={15} height={15} aria-hidden />,
        };

  // No class booked and no WOD programmed → the action is to book.
  const primary =
    !myClassToday && !wod
      ? {
          href: "/atleta/reservar" as Route,
          label: "Reservar",
          icon: <CalendarPlus width={15} height={15} aria-hidden />,
        }
      : cta;

  return (
    <section
      data-tour="home.today"
      aria-label="Hoy"
      style={{ padding: "0 14px", marginTop: 12 }}
    >
      <div
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-accent-line)",
          borderRadius: 18,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "var(--k-accent-glow)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "var(--k-accent)",
              textTransform: "uppercase",
            }}
          >
            Hoy
          </span>
          {wod?.wodType && (
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--k-t2)",
                background: "var(--k-elevated)",
                border: "1px solid var(--k-line)",
                borderRadius: 999,
                padding: "4px 9px",
              }}
            >
              {wodTypeLabel[wod.wodType as WODType] ?? wod.wodType}
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color: "var(--k-t1)",
              margin: 0,
            }}
          >
            {wod ? wod.wodName : "Sin WOD programado"}
          </h2>
          <p
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: myClassToday ? "var(--k-t2)" : "var(--k-t3)",
              margin: 0,
            }}
          >
            {myClassToday
              ? `Tu clase · ${formatTime24(myClassToday.startsAt)}${
                  myClassToday.coach?.name
                    ? ` · ${myClassToday.coach.name}`
                    : ""
                }`
              : "Sin clase reservada"}
          </p>
          {hasLoggedToday && myScore && wod && (
            <p
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--k-accent)",
                margin: 0,
              }}
            >
              Ya registraste{" "}
              {formatScore(myScore.value, wod.scoreType as ScoreType)}
              {today?.board.myRank ? ` · #${today.board.myRank}` : ""}
            </p>
          )}
        </div>

        <Link
          href={primary.href}
          className="k-tap"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 48,
            borderRadius: 12,
            background: "var(--k-accent)",
            color: "var(--k-accent-on)",
            fontFamily: "var(--k-font-display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          {primary.icon}
          {primary.label}
          <ArrowRight width={15} height={15} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
