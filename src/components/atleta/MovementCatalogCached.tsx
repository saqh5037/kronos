"use client";

/**
 * MovementCatalogCached — thin wrapper over MovementCatalog that backs the
 * catalog list with TanStack Query so it is persisted to IndexedDB and
 * refreshed in background on window focus / reconnect.
 *
 * The server component fetches the initial data (used for SSR/streaming), then
 * this component takes over on the client and keeps it fresh.
 */

import { useMovementCatalog } from "@/lib/query/useMovementCatalog";
import MovementCatalog from "./MovementCatalog";
import type { MovementRow } from "@/server/actions/movements";

interface Props {
  tenantId: string;
  userId: string;
  initialData: MovementRow[];
}

export default function MovementCatalogCached({
  tenantId,
  userId,
  initialData,
}: Props) {
  const { data } = useMovementCatalog({ tenantId, userId, initialData });

  return <MovementCatalog movements={data ?? initialData} />;
}
