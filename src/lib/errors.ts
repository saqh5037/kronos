/**
 * Custom error classes para diferenciar fallos de dominio en server actions.
 * Permite que la UI distinga errores recuperables (relogin, retry) de los no
 * recuperables (Box borrado, requiere soporte humano).
 */

export class UnauthorizedError extends Error {
  readonly kind = "UNAUTHORIZED" as const;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class BoxNotFoundError extends Error {
  readonly kind = "BOX_NOT_FOUND" as const;
  readonly tenantId: string;
  constructor(tenantId: string, message = "Box not found") {
    super(message);
    this.name = "BoxNotFoundError";
    this.tenantId = tenantId;
  }
}

export class DBError extends Error {
  readonly kind = "DB_ERROR" as const;
  readonly cause: unknown;
  constructor(cause: unknown, message = "Database error") {
    super(message);
    this.name = "DBError";
    this.cause = cause;
  }
}

export type AdminDashboardErrorKind =
  | UnauthorizedError["kind"]
  | BoxNotFoundError["kind"]
  | DBError["kind"];

export function isUnauthorizedError(e: unknown): e is UnauthorizedError {
  return e instanceof UnauthorizedError;
}

export function isBoxNotFoundError(e: unknown): e is BoxNotFoundError {
  return e instanceof BoxNotFoundError;
}

export function isDBError(e: unknown): e is DBError {
  return e instanceof DBError;
}
