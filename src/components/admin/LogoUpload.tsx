"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadBoxLogo } from "@/server/actions/uploads";

export function LogoUpload({
  currentUrl,
  onUploaded,
}: {
  currentUrl?: string | null;
  onUploaded?: (url: string) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentUrl ?? null,
  );

  function handlePick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Solo imágenes (PNG, JPG, SVG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Máximo 2 MB");
      return;
    }

    // Optimistic local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      try {
        const result = await uploadBoxLogo(fd);
        setPreviewUrl(result.url);
        URL.revokeObjectURL(localPreview);
        onUploaded?.(result.url);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo subir el logo",
        );
        setPreviewUrl(currentUrl ?? null);
      }
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden"
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-line-2)",
          }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Logo del Box"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <span
              className="text-xs uppercase font-bold tracking-wide"
              style={{ color: "var(--k-t3)" }}
            >
              Sin logo
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handlePick}
            disabled={pending}
            className="k-btn-ghost px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {pending ? "Subiendo…" : previewUrl ? "Cambiar logo" : "Subir logo"}
          </button>
          <span className="text-xs" style={{ color: "var(--k-t3)" }}>
            PNG, JPG o SVG. Máximo 2 MB. Cuadrado se ve mejor.
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && (
        <p className="text-xs font-medium" style={{ color: "var(--k-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
