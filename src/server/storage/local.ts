import { promises as fs } from "fs";
import path from "path";
import type { StorageDriver, UploadInput, UploadOutput } from "./types";

const PUBLIC_BASE = path.join(process.cwd(), "public", "uploads");

function publicUrlFromPathname(pathname: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/uploads/${pathname}`;
}

export class LocalStorageDriver implements StorageDriver {
  readonly driver = "local" as const;

  async put(input: UploadInput): Promise<UploadOutput> {
    const fullPath = path.join(PUBLIC_BASE, input.pathname);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, input.buffer);
    return {
      url: publicUrlFromPathname(input.pathname),
      pathname: input.pathname,
      driver: "local",
    };
  }

  async delete(pathname: string): Promise<void> {
    const fullPath = path.join(PUBLIC_BASE, pathname);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }

  async read(pathname: string): Promise<Buffer> {
    const fullPath = path.join(PUBLIC_BASE, pathname);
    return fs.readFile(fullPath);
  }
}
