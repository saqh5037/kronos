import { AsyncLocalStorage } from "async_hooks";

const tenantStorage = new AsyncLocalStorage<string>();

export function getCurrentTenantId(): string | null {
  return tenantStorage.getStore() ?? null;
}

export async function runWithTenant<T>(
  tenantId: string,
  fn: () => Promise<T>,
): Promise<T> {
  return tenantStorage.run(tenantId, fn);
}
