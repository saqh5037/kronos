import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { LocalStorageDriver } from "@/server/storage/local";

describe("LocalStorageDriver — UPLOAD_BASE_DIR support", () => {
  let tmpDir: string;
  const originalEnv = process.env.UPLOAD_BASE_DIR;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "kronos-storage-test-"));
    process.env.UPLOAD_BASE_DIR = tmpDir;
  });

  afterEach(async () => {
    if (originalEnv === undefined) delete process.env.UPLOAD_BASE_DIR;
    else process.env.UPLOAD_BASE_DIR = originalEnv;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("escribe a UPLOAD_BASE_DIR cuando está set", async () => {
    const driver = new LocalStorageDriver();
    await driver.put({
      buffer: Buffer.from("hello"),
      contentType: "text/plain",
      pathname: "test/file.txt",
    });
    const written = await fs.readFile(path.join(tmpDir, "test/file.txt"), "utf-8");
    expect(written).toBe("hello");
  });

  it("crea directorios intermedios si no existen", async () => {
    const driver = new LocalStorageDriver();
    await driver.put({
      buffer: Buffer.from("data"),
      contentType: "image/png",
      pathname: "avatars/tenant1/user1/photo.png",
    });
    const stat = await fs.stat(
      path.join(tmpDir, "avatars/tenant1/user1/photo.png"),
    );
    expect(stat.isFile()).toBe(true);
  });

  it("delete elimina el archivo", async () => {
    const driver = new LocalStorageDriver();
    await driver.put({
      buffer: Buffer.from("delete-me"),
      contentType: "text/plain",
      pathname: "del.txt",
    });
    await driver.delete("del.txt");
    await expect(fs.access(path.join(tmpDir, "del.txt"))).rejects.toThrow();
  });

  it("delete no falla si el archivo no existe (idempotente)", async () => {
    const driver = new LocalStorageDriver();
    await expect(driver.delete("does-not-exist.txt")).resolves.toBeUndefined();
  });

  it("read devuelve el buffer escrito", async () => {
    const driver = new LocalStorageDriver();
    await driver.put({
      buffer: Buffer.from("bytes"),
      contentType: "application/octet-stream",
      pathname: "bin/data.bin",
    });
    const read = await driver.read("bin/data.bin");
    expect(read.toString()).toBe("bytes");
  });

  it("fallback a public/uploads cuando UPLOAD_BASE_DIR no está set", async () => {
    delete process.env.UPLOAD_BASE_DIR;
    const driver = new LocalStorageDriver();
    const localTmp = await fs.mkdtemp(
      path.join(os.tmpdir(), "kronos-fallback-"),
    );
    const fakeCwd = process.cwd;
    process.cwd = () => localTmp;
    try {
      await driver.put({
        buffer: Buffer.from("fallback"),
        contentType: "text/plain",
        pathname: "fb.txt",
      });
      const written = await fs.readFile(
        path.join(localTmp, "public/uploads/fb.txt"),
        "utf-8",
      );
      expect(written).toBe("fallback");
    } finally {
      process.cwd = fakeCwd;
      await fs.rm(localTmp, { recursive: true, force: true });
    }
  });

  it("URL devuelta es relativa /uploads/{pathname}", async () => {
    const driver = new LocalStorageDriver();
    const out = await driver.put({
      buffer: Buffer.from("x"),
      contentType: "text/plain",
      pathname: "url-test.txt",
    });
    expect(out.url).toContain("/uploads/url-test.txt");
    expect(out.driver).toBe("local");
  });
});
