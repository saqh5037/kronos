"use client";

/**
 * QueryProvider — TanStack Query + IndexedDB persistence for the athlete surface.
 *
 * Mount ONLY inside the /atleta layout tree (not in the root layout).
 *
 * Security contract (see 2026-05-17 cross-tenant leak incident):
 *  - Storage key is `kronos-rq-${userId}`, so different users never share an
 *    IndexedDB entry.
 *  - `buster` equals userId: if the persisted cache was written by a different
 *    userId, TanStack Query discards it automatically on restore.
 *  - On logout, call `clearQueryCacheAndStorage(userId)` BEFORE signOut() to
 *    proactively remove the IndexedDB entry for this user.
 */

import { QueryClient, QueryCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type {
  Persister,
  PersistedClient,
} from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";
import { useRef, type ReactNode } from "react";

const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;

/**
 * Builds a Persister that stores the full QueryClient state in a single
 * IndexedDB key scoped to this user.
 */
function makeIdbPersister(userId: string): Persister {
  const storageKey = `kronos-rq-${userId}`;

  return {
    persistClient: async (client: PersistedClient) => {
      await set(storageKey, client);
    },
    restoreClient: async (): Promise<PersistedClient | undefined> => {
      const stored = await get<PersistedClient>(storageKey);
      return stored ?? undefined;
    },
    removeClient: async () => {
      await del(storageKey);
    },
  };
}

interface QueryProviderProps {
  userId: string;
  children: ReactNode;
}

export function QueryProvider({ userId, children }: QueryProviderProps) {
  // Stable refs — survive re-renders without recreating the client
  const clientRef = useRef<QueryClient | null>(null);
  const persisterRef = useRef<Persister | null>(null);

  if (!clientRef.current) {
    clientRef.current = new QueryClient({
      queryCache: new QueryCache(),
      defaultOptions: {
        queries: {
          gcTime: TWENTY_FOUR_HOURS,
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
          retry: 1,
        },
      },
    });
  }

  // Recreate persister when userId changes (e.g. hot-reload in dev)
  if (!persisterRef.current) {
    persisterRef.current = makeIdbPersister(userId);
  }

  return (
    <PersistQueryClientProvider
      client={clientRef.current}
      persistOptions={{
        persister: persisterRef.current,
        maxAge: TWENTY_FOUR_HOURS,
        buster: userId,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

/**
 * Call BEFORE signOut() on logout to prevent the next user from
 * seeing residual data from the IndexedDB store of the previous user.
 *
 * Usage (in LogoutClient.tsx):
 *   await clearQueryCacheAndStorage(userId);
 *   await signOut({ callbackUrl, redirect: true });
 */
export async function clearQueryCacheAndStorage(userId: string): Promise<void> {
  try {
    await del(`kronos-rq-${userId}`);
  } catch {
    // Non-critical — proceed with signOut even if IDB removal fails
  }
}
