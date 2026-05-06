"use client";

import { kToast } from "@/lib/toast";

export default function ToastDemoPage() {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <div className="min-h-screen p-8" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="font-display text-2xl font-bold">
            Kronos Toasts — demo cinematic
          </h1>
          <p
            className="text-xs font-mono mt-1"
            style={{ color: "var(--text-3)" }}
          >
            dev only · /dev/toast-demo
          </p>
        </header>

        <section className="k-card p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            type="button"
            className="k-btn-ghost"
            onClick={() => kToast.success("Reserva confirmada")}
          >
            Success
          </button>
          <button
            type="button"
            className="k-btn-ghost"
            onClick={() =>
              kToast.error("No se pudo guardar el score", {
                description: "Verifica conexión e intenta de nuevo.",
              })
            }
          >
            Error
          </button>
          <button
            type="button"
            className="k-btn-ghost"
            onClick={() => kToast.info("Reserva cancelada")}
          >
            Info
          </button>
          <button
            type="button"
            className="k-btn-ghost"
            onClick={() => kToast.warning("Capacidad casi llena")}
          >
            Warning
          </button>
          <button
            type="button"
            className="k-btn-ghost"
            onClick={() => {
              const id = kToast.loading("Procesando…");
              setTimeout(() => {
                kToast.dismiss(id);
                kToast.success("Listo");
              }, 1800);
            }}
          >
            Loading → Success
          </button>
          <button
            type="button"
            className="k-btn-ghost"
            onClick={() =>
              kToast.success("🏆 ¡Nuevo PR!", {
                description: "Back Squat — 102.5 kg (+4.2%)",
                duration: 5000,
              })
            }
          >
            PR Achievement
          </button>
        </section>
      </div>
    </div>
  );
}
