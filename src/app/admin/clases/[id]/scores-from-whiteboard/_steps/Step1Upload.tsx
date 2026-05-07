"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { uploadWhiteboardPhoto } from "@/server/actions/uploads";
import { processWhiteboardUpload } from "@/server/actions/scores";

type Props = { classId: string };

export default function Step1Upload({ classId }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setError(null);
  }

  const addRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

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
    <div className="k-card p-6 max-w-lg mx-auto space-y-6 relative overflow-hidden">
      <div>
        <p className="k-eyebrow mb-1">Paso 1 de 3</p>
        <h2 className="text-xl font-display font-bold text-text">
          Foto de la pizarra
        </h2>
        <p className="text-sm text-text-2 mt-1">
          Toma una foto clara de la pizarra con los scores del WOD.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors overflow-hidden ${
            dragOver
              ? "border-[var(--k-accent)] bg-[var(--k-accent-soft)]"
              : preview
                ? "border-white/20"
                : "border-white/20 hover:border-white/40"
          }`}
          onClick={(e) => {
            addRipple(e);
            fileRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const dt = new DataTransfer();
              dt.items.add(file);
              if (fileRef.current) {
                fileRef.current.files = dt.files;
              }
              setPreview(URL.createObjectURL(file));
              setError(null);
            }
          }}
          animate={
            dragOver
              ? {
                  boxShadow: [
                    "0 0 0px rgba(74,124,89,0)",
                    "0 0 20px rgba(74,124,89,0.3)",
                    "0 0 0px rgba(74,124,89,0)",
                  ],
                }
              : {}
          }
          transition={
            dragOver
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : {}
          }
        >
          {/* Ripple effects */}
          <AnimatePresence>
            {ripples.map((ripple) => (
              <motion.span
                key={ripple.id}
                initial={{ width: 0, height: 0, opacity: 0.5 }}
                animate={{ width: 300, height: 300, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute rounded-full bg-white/10 pointer-events-none"
                style={{
                  left: ripple.x - 150,
                  top: ripple.y - 150,
                }}
              />
            ))}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview pizarra"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-text-3 text-xs mt-3"
                >
                  Toca para cambiar la imagen
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-5xl"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  📸
                </motion.div>
                <div>
                  <p className="text-text-2 text-sm font-medium">
                    {dragOver
                      ? "Suelta la imagen aquí"
                      : "Toca para seleccionar o tomar foto"}
                  </p>
                  <p className="text-text-3 text-xs mt-1">
                    Max 8 MB · JPG, PNG, HEIC
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-text-3 text-xs mt-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 1V13M1 7H13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  También puedes arrastrar y soltar
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-sm text-[var(--k-warning)] bg-[rgba(255, 90, 90, 0.1)] rounded-lg px-4 py-3 border border-[rgba(255, 90, 90, 0.3)] flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 5V8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="11" r="0.75" fill="currentColor" />
              </svg>
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {preview && (
            <motion.button
              key="submit"
              type="submit"
              disabled={loading}
              className="k-btn-grad w-full py-3 text-sm font-semibold disabled:opacity-50"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando con IA...
                </span>
              ) : (
                "Procesar pizarra"
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
