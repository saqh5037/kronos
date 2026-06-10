"use client";

import { useQuery } from "@tanstack/react-query";
import { getTodayWOD, type TodayWOD } from "@/server/actions/scores";
import { queryKeys } from "./keys";

const STALE_TIME_5MIN = 1000 * 60 * 5;

interface UseTodayWodOptions {
  tenantId: string;
  userId: string;
  /** ISO date string (YYYY-MM-DD) — used as part of the cache key so data
   *  from a previous day is never restored. Computed server-side and passed
   *  as a prop to avoid Date.now() in client render (hydration rule). */
  dateKey: string;
  initialData?: TodayWOD;
}

export function useTodayWod({
  tenantId,
  userId,
  dateKey,
  initialData,
}: UseTodayWodOptions) {
  return useQuery({
    queryKey: queryKeys.todayWod(tenantId, userId, dateKey),
    queryFn: () => getTodayWOD(),
    staleTime: STALE_TIME_5MIN,
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}
