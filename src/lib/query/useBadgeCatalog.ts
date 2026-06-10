"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listBadgesWithProgress,
  type BadgeDetail,
} from "@/server/actions/badges";
import { queryKeys } from "./keys";

const STALE_TIME_6H = 1000 * 60 * 60 * 6;

interface UseBadgeCatalogOptions {
  tenantId: string;
  userId: string;
  initialData?: BadgeDetail[];
}

export function useBadgeCatalog({
  tenantId,
  userId,
  initialData,
}: UseBadgeCatalogOptions) {
  return useQuery({
    queryKey: queryKeys.badgeCatalog(tenantId, userId),
    queryFn: () => listBadgesWithProgress(),
    staleTime: STALE_TIME_6H,
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}
