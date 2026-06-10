"use client";

/**
 * LogrosCatalogCached — thin wrapper over the badge grid that backs the list
 * with TanStack Query for IndexedDB persistence and background refresh.
 *
 * Rendered by LogrosContent (server component) which provides initialData so
 * the first paint is instant (SSR hydration), and this component keeps the
 * data fresh via refetchOnWindowFocus / refetchOnReconnect.
 */

import { useBadgeCatalog } from "@/lib/query/useBadgeCatalog";
import type { BadgeDetail } from "@/server/actions/badges";
import type { ReactNode } from "react";

interface Props {
  tenantId: string;
  userId: string;
  initialData: BadgeDetail[];
  /**
   * Render prop — receives the current (possibly refreshed) badge list.
   * The server component owns the visual structure; this component only
   * manages the data layer.
   */
  children: (badges: BadgeDetail[]) => ReactNode;
}

export default function LogrosCatalogCached({
  tenantId,
  userId,
  initialData,
  children,
}: Props) {
  const { data } = useBadgeCatalog({ tenantId, userId, initialData });
  return <>{children(data ?? initialData)}</>;
}
