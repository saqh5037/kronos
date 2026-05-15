"use client";

import { useState } from "react";
import PushSubscribeButton from "@/components/atleta/PushSubscribeButton";

type Step9NotificationsProps = {
  onPrev: () => void;
  onNext: () => void;
  pending: boolean;
};

export function Step9Notifications({
  onPrev,
  onNext,
  pending,
}: Step9NotificationsProps) {
  const [showedPreviews, setShowedPreviews] = useState(false);

  const sampleNotifications = [
    {
      title: "Tu WOD está listo",
      description: "Entrena hoy: Cindy — 20 min AMRAP",
      icon: "💪",
    },
    {
      title: "Reserva confirmada",
      description: "Mañana a las 18:30 — CrossFit 101",
      icon: "✅",
    },
    {
      title: "Nuevo PR detectado",
      description: "¡Levantaste 10 kg más en Squat!",
      icon: "🔥",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          Mantenerte informado
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          Recibe notificaciones sobre tus entrenamientos y logros.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold" style={{ color: "var(--k-t2)" }}>
          Ejemplos de notificaciones:
        </p>
        {sampleNotifications.map((notif, i) => (
          <div
            key={i}
            className="flex gap-3 p-3 rounded-lg"
            style={{
              background: "var(--k-surface)",
              borderLeft: "3px solid var(--k-accent)",
            }}
          >
            <span className="text-lg flex-shrink-0">{notif.icon}</span>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--k-t1)" }}
              >
                {notif.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--k-t2)" }}>
                {notif.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!showedPreviews && (
        <button
          type="button"
          onClick={() => setShowedPreviews(true)}
          disabled={pending}
          className="w-full py-2 px-3 text-xs rounded-lg font-semibold transition-all disabled:opacity-50"
          style={{
            background: "var(--k-accent-soft)",
            color: "var(--k-accent)",
            border: "1px solid var(--k-accent-line)",
          }}
        >
          Ver cómo se verían
        </button>
      )}

      <div className="space-y-3 pt-2">
        <PushSubscribeButton />
        <p className="text-xs text-center" style={{ color: "var(--k-t3)" }}>
          Puedes cambiar esto después en Ajustes
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={pending}
          className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
        >
          Continuar
        </button>
        <button
          type="button"
          onClick={onPrev}
          disabled={pending}
          className="text-xs underline disabled:opacity-50"
          style={{ color: "var(--k-t3)" }}
        >
          ← Atrás
        </button>
      </div>
    </div>
  );
}
