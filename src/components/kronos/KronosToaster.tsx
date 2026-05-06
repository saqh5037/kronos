"use client";

import { useEffect, useState } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning" | "loading";

export interface ToastOptions {
  id?: string;
  description?: string;
  duration?: number;
}

export interface ToastItem {
  id: string;
  title: string;
  variant: ToastVariant;
  description?: string;
  duration: number;
  createdAt: number;
}

const TOAST_EVENT = "kronos:toast";
const TOAST_DISMISS_EVENT = "kronos:toast:dismiss";
const DEFAULT_DURATION = 3500;

let counter = 0;
const newId = () => `kt-${Date.now()}-${counter++}`;

interface ToastDispatchPayload {
  variant: ToastVariant;
  title: string;
  options?: ToastOptions;
}

export function dispatchToast(payload: ToastDispatchPayload): string {
  if (typeof window === "undefined") return "";
  const id = payload.options?.id ?? newId();
  const detail: ToastItem = {
    id,
    title: payload.title,
    variant: payload.variant,
    description: payload.options?.description,
    duration: payload.options?.duration ?? DEFAULT_DURATION,
    createdAt: Date.now(),
  };
  // Defer to escape any current React render commit
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }));
  }, 0);
  return id;
}

export function dismissToast(id?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_DISMISS_EVENT, { detail: { id } }),
  );
}

export function KronosToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onAdd(e: Event) {
      const detail = (e as CustomEvent<ToastItem>).detail;
      setToasts((prev) => {
        const idx = prev.findIndex((t) => t.id === detail.id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = detail;
          return next;
        }
        return [...prev, detail].slice(-5);
      });
    }
    function onDismiss(e: Event) {
      const detail = (e as CustomEvent<{ id?: string }>).detail;
      setToasts((prev) =>
        detail.id ? prev.filter((t) => t.id !== detail.id) : [],
      );
    }
    window.addEventListener(TOAST_EVENT, onAdd);
    window.addEventListener(TOAST_DISMISS_EVENT, onDismiss);
    return () => {
      window.removeEventListener(TOAST_EVENT, onAdd);
      window.removeEventListener(TOAST_DISMISS_EVENT, onDismiss);
    };
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const ids = toasts
      .filter((t) => t.variant !== "loading" && t.duration > 0)
      .map((t) => {
        const elapsed = Date.now() - t.createdAt;
        const remaining = Math.max(200, t.duration - elapsed);
        return window.setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== t.id));
        }, remaining);
      });
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [toasts]);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="k-toaster"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: "min(92vw, 380px)",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`k-toast k-toast--${t.variant} k-toast--enter`}
          style={{ pointerEvents: "auto" }}
          onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        >
          <div className="k-toast__title">{t.title}</div>
          {t.description && (
            <div className="k-toast__desc">{t.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
