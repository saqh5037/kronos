"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  rangeFromParams,
  type DateRange,
  type RangePresetKey,
} from "@/lib/dates";

function buildQuery(
  current: URLSearchParams,
  patch: Record<string, string | null>,
): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  const str = next.toString();
  return str ? `?${str}` : "";
}

export function useUrlPatch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useCallback(
    (patch: Record<string, string | null>) => {
      const qs = buildQuery(searchParams, patch);
      // typedRoutes: dynamic href derived from runtime params, cast is safe.
      router.replace(`${pathname}${qs}` as never, { scroll: false });
    },
    [router, pathname, searchParams],
  );
}

export function useSearchParamState(
  key: string,
  defaultValue: string = "",
): [string, (next: string) => void] {
  const searchParams = useSearchParams();
  const patch = useUrlPatch();
  const value = searchParams.get(key) ?? defaultValue;
  const setValue = useCallback(
    (next: string) => patch({ [key]: next || null }),
    [patch, key],
  );
  return [value, setValue];
}

/**
 * Debounced text input bound to a URL param. Returns a local mirror that
 * commits to the URL after `delay` ms — keeps typing snappy without flooding
 * the router with re-renders.
 */
export function useDebouncedSearchParam(
  key: string,
  delay = 300,
): [string, (next: string) => void] {
  const [committed, setCommitted] = useSearchParamState(key);
  const [draft, setDraft] = useState(committed);

  useEffect(() => {
    setDraft(committed);
  }, [committed]);

  useEffect(() => {
    if (draft === committed) return;
    const t = setTimeout(() => setCommitted(draft), delay);
    return () => clearTimeout(t);
  }, [draft, committed, delay, setCommitted]);

  return [draft, setDraft];
}

export function useDateRange(): [
  DateRange,
  (next: { preset?: RangePresetKey | null; from?: Date; to?: Date }) => void,
] {
  const searchParams = useSearchParams();
  const patch = useUrlPatch();

  const range = useMemo(
    () =>
      rangeFromParams({
        preset: searchParams.get("preset"),
        from: searchParams.get("from"),
        to: searchParams.get("to"),
      }),
    [searchParams],
  );

  const setRange = useCallback(
    (next: { preset?: RangePresetKey | null; from?: Date; to?: Date }) => {
      if (next.preset) {
        patch({ preset: next.preset, from: null, to: null });
      } else if (next.from && next.to) {
        patch({
          preset: null,
          from: next.from.toISOString().slice(0, 10),
          to: next.to.toISOString().slice(0, 10),
        });
      } else if (next.preset === null) {
        patch({ preset: null });
      }
    },
    [patch],
  );

  return [range, setRange];
}

export function usePagination(defaultPageSize = 25): {
  page: number;
  pageSize: number;
  setPage: (n: number) => void;
  setPageSize: (n: number) => void;
} {
  const searchParams = useSearchParams();
  const patch = useUrlPatch();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const pageSize =
    Number(searchParams.get("pageSize") ?? defaultPageSize) || defaultPageSize;

  return {
    page,
    pageSize,
    setPage: (n) => patch({ page: n > 1 ? String(n) : null }),
    setPageSize: (n) =>
      patch({
        pageSize: n !== defaultPageSize ? String(n) : null,
        page: null,
      }),
  };
}
