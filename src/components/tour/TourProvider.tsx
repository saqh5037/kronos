"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { reservarTour } from "./tours/reservar";
import type { TourDefinition } from "./types";
import { TourOverlay } from "./TourOverlay";

const REGISTRY: Record<string, TourDefinition> = {
  [reservarTour.id]: reservarTour,
};

type TourContextValue = {
  isOpen: boolean;
  activeTour: TourDefinition | null;
  stepIndex: number;
  startTour: (id: string) => void;
  endTour: (opts?: { completed?: boolean }) => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used inside <TourProvider>");
  }
  return ctx;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [activeTour, setActiveTour] = useState<TourDefinition | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const startTour = useCallback((id: string) => {
    const tour = REGISTRY[id];
    if (!tour) {
      console.warn(`[tour] unknown id: ${id}`);
      return;
    }
    setStepIndex(0);
    setActiveTour(tour);
  }, []);

  const endTour = useCallback(
    (opts?: { completed?: boolean }) => {
      if (activeTour && opts?.completed) {
        try {
          window.localStorage.setItem(
            activeTour.storageKey,
            new Date().toISOString(),
          );
        } catch {
          // localStorage blocked — silently ignore
        }
      }
      setActiveTour(null);
      setStepIndex(0);
    },
    [activeTour],
  );

  const next = useCallback(() => {
    if (!activeTour) return;
    setStepIndex((idx) => {
      const last = activeTour.steps.length - 1;
      if (idx >= last) {
        try {
          window.localStorage.setItem(
            activeTour.storageKey,
            new Date().toISOString(),
          );
        } catch {
          // ignore
        }
        setActiveTour(null);
        return 0;
      }
      return idx + 1;
    });
  }, [activeTour]);

  const prev = useCallback(() => {
    setStepIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (!activeTour) return;
      const clamped = Math.max(0, Math.min(activeTour.steps.length - 1, index));
      setStepIndex(clamped);
    },
    [activeTour],
  );

  useEffect(() => {
    if (!activeTour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        endTour({ completed: false });
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTour, endTour, next, prev]);

  const value = useMemo<TourContextValue>(
    () => ({
      isOpen: activeTour !== null,
      activeTour,
      stepIndex,
      startTour,
      endTour,
      next,
      prev,
      goTo,
    }),
    [activeTour, stepIndex, startTour, endTour, next, prev, goTo],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {activeTour ? (
        <TourOverlay tour={activeTour} stepIndex={stepIndex} />
      ) : null}
    </TourContext.Provider>
  );
}
