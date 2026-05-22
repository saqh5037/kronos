"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTour } from "./TourProvider";
import { reservarTour } from "./tours/reservar";

const AUTO_START_MAP: Record<string, { tourId: string; storageKey: string }> = {
  "/atleta/reservar": {
    tourId: reservarTour.id,
    storageKey: reservarTour.storageKey,
  },
};

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

    const timer = window.setTimeout(() => {
      startTour(entry.tourId);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [pathname, startTour, isOpen]);

  return null;
}
