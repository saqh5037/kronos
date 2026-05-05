"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadWhiteboardPhoto } from "@/server/actions/uploads";
import { processWhiteboardUpload } from "@/server/actions/scores";

type Props = { classId: string };

export default function Step1Upload({ classId }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Selecciona una imagen");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classId", classId);

      const { uploadId } = await uploadWhiteboardPhoto(formData);
      await processWhiteboardUpload(uploadId);

      router.push(`?step=review&uploadId=${uploadId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al procesar la imagen",
      );
      setLoading(false);
    }
  }

  return (
    <div className="k-card p-6 max-w-lg mx-auto space-y-6">
      <div>
        <p className="k-eyebrow mb-1">Paso 1 de 3</p>
        <h2 className="text-xl font-display font-bold text-white">
          Foto de la pizarra
        </h2>
        <p className="text-sm text-white/60 mt-1">
          Toma una foto clara de la pizarra con los scores del WOD.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview pizarra"
              className="max-h-64 mx-auto rounded-lg object-contain"
            />
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">📸</div>
              <p className="text-white/60 text-sm">
                Toca para seleccionar o tomar foto
              </p>
              <p className="text-white/40 text-xs">Max 8 MB · JPG, PNG, HEIC</p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {error && (
          <p className="text-sm text-[--pr] bg-[--pr]/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {preview && (
          <button
            type="submit"
            disabled={loading}
            className="k-btn-grad w-full py-3 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Procesando con IA..." : "Procesar pizarra"}
          </button>
        )}
      </form>
    </div>
  );
}
