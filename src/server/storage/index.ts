import type { StorageDriver } from "./types";
import { LocalStorageDriver } from "./local";
import { S3StorageDriver } from "./s3";

let cached: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (cached) return cached;
  const driverName = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
  cached =
    driverName === "s3" ? new S3StorageDriver() : new LocalStorageDriver();
  return cached;
}

export function resetStorageCache(): void {
  cached = null;
}

export type { StorageDriver, UploadInput, UploadOutput } from "./types";
