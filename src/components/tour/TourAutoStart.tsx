"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTour } from "./TourProvider";
import { reservarTour } from "./tours/reservar";
import { wodTour } from "./tours/wod";
import { perfilTour } from "./tours/perfil";
import { homeTour } from "./tours/home";
import { skillsTour } from "./tours/skills";
import { saludTour } from "./tours/salud";
import { historialTour } from "./tours/historial";

type AutoStartEntry = {
  tourId: string;
  storageKey: string;
  /** First-step anchor; we wait for it to mount before auto-starting. */
  firstAnchor: string;
};

const AUTO_START_MAP: Record<string, AutoStartEntry> = {
  "/atleta/reservar": {
    tourId: reservarTour.id,
    storageKey: reservarTour.storageKey,
    firstAnchor: reservarTour.steps[0].anchor,
  },
  "/atleta/wod": {
    tourId: wodTour.id,
    storageKey: wodTour.storageKey,
    firstAnchor: wodTour.steps[0].anchor,
  },
  "/atleta/perfil": {
    tourId: perfilTour.id,
    storageKey: perfilTour.storageKey,
    firstAnchor: perfilTour.steps[0].anchor,
  },
  "/atleta": {
    tourId: homeTour.id,
    storageKey: homeTour.storageKey,
    firstAnchor: homeTour.steps[0].anchor,
  },
  "/atleta/skills": {
    tourId: skillsTour.id,
    storageKey: skillsTour.storageKey,
    firstAnchor: skillsTour.steps[0].anchor,
  },
  "/atleta/salud": {
    tourId: saludTour.id,
    storageKey: saludTour.storageKey,
    firstAnchor: saludTour.steps[0].anchor,
  },
  "/atleta/historial": {
    tourId: historialTour.id,
    storageKey: historialTour.storageKey,
    firstAnchor: historialTour.steps[0].anchor,
  },
};

const POLL_INTERVAL_MS = 200;
const POLL_TIMEOUT_MS = 4000;

export function TourAutoStart() {
  const pathname = usePathname();
  const { startTour, isOpen } = useTour();

  useEffect(() => {
    if (!pathname) return;
    if (isOpen) return;
    const entry = AUTO_START_MAP[pathname];
    if (!entry) return;

    try {
      if (window.localStorage.getItem(entry.storageKey)) return;
    } catch {
      return;
    }

    // Poll for the first anchor up to POLL_TIMEOUT_MS. If it never appears
    // (empty state, redirect, conditional render), bail silently — the user
    // can still launch the tour manually via the "?" button.
    const startedAt = Date.now();
    let cancelled = false;

    const tryStart = () => {
      if (cancelled) return;
      const target = document.querySelector(
        `[data-tour="${entry.firstAnchor}"]`,
      );
      if (target) {
        startTour(entry.tourId);
        return;
      }
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) return;
      window.setTimeout(tryStart, POLL_INTERVAL_MS);
    };

    const initial = window.setTimeout(tryStart, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(initial);
    };
  }, [pathname, startTour, isOpen]);

  return null;
}
