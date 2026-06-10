"use client";

import { useQuery } from "@tanstack/react-query";
import { listMovements, type MovementRow } from "@/server/actions/movements";
import { queryKeys } from "./keys";

const STALE_TIME_1H = 1000 * 60 * 60;

interface UseMovementCatalogOptions {
  tenantId: string;
  userId: string;
  initialData?: MovementRow[];
}

export function useMovementCatalog({
  tenantId,
  userId,
  initialData,
}: UseMovementCatalogOptions) {
  return useQuery({
    queryKey: queryKeys.movementCatalog(tenantId, userId),
    queryFn: () => listMovements(),
    staleTime: STALE_TIME_1H,
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}
