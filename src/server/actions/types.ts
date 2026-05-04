/**
 * Uniform shapes for paginated/filtered server actions.
 *
 * Action signature pattern:
 *   listFooPaged(opts?: ListOpts<FooSort>) → Promise<ListResult<FooRow>>
 *
 * `S` is a string-literal union of allowed sort keys for the action — e.g.
 *   type AthleteSort = "name" | "createdAt" | "lastAttendance"
 */

export type SortDir = "asc" | "desc";

export type ListOpts<S extends string = string> = {
  dateFrom?: Date | null;
  dateTo?: Date | null;
  search?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
  sortBy?: S | null;
  sortDir?: SortDir | null;
};

export type ListResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 200;

export function normalizePagination(opts?: {
  page?: number;
  pageSize?: number;
}): { page: number; pageSize: number; skip: number; take: number } {
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(opts?.pageSize ?? DEFAULT_PAGE_SIZE)),
  );
  const page = Math.max(1, Math.floor(opts?.page ?? 1));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function dateRangeFilter(
  dateFrom?: Date | null,
  dateTo?: Date | null,
): { gte?: Date; lte?: Date } | undefined {
  if (!dateFrom && !dateTo) return undefined;
  const out: { gte?: Date; lte?: Date } = {};
  if (dateFrom) out.gte = dateFrom;
  if (dateTo) out.lte = dateTo;
  return out;
}
