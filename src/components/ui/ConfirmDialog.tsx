"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export type ConfirmTone = "danger" | "warning" | "info";

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

const TONE_COLOR: Record<ConfirmTone, string> = {
  danger: "var(--pr)",
  warning: "var(--steel)",
  info: "var(--cyan)",
};

export function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onConfirm, onCancel]);

  const tone = options?.tone ?? "danger";
  const accent = TONE_COLOR[tone];

  return (
    <AnimatePresence>
      {open && options && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
            }}
          />
          <motion.div
            className="relative w-full max-w-sm rounded-2xl p-6"
            style={{
              background: "var(--card)",
              border: `1px solid ${accent}40`,
              boxShadow: `0 12px 40px ${accent}20, 0 0 0 1px var(--line)`,
            }}
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-16 rounded-full"
              style={{ background: accent, opacity: 0.6 }}
            />
            <h2
              id="confirm-title"
              className="font-display font-extrabold text-xl leading-tight"
              style={{ color: "var(--text)" }}
            >
              {options.title}
            </h2>
            {options.message && (
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--text-2)" }}
              >
                {options.message}
              </p>
            )}
            <div className="mt-6 flex gap-2 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                style={{
                  background: "var(--card-2)",
                  color: "var(--text-2)",
                  border: "1px solid var(--line)",
                }}
                autoFocus
              >
                {options.cancelLabel ?? "Cancelar"}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: accent,
                  color: "#0a0a0c",
                }}
              >
                {options.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
