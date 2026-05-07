"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateBoxNotifications,
  type BoxNotificationSettings,
} from "@/server/actions/box-notifications";
import { kToast } from "@/lib/toast";
import KCard from "@/components/kronos/KCard";

type Props = {
  initial: BoxNotificationSettings;
};

export function NotificationsForm({ initial }: Props) {
  const router = useRouter();
  const [weeklyDigest, setWeeklyDigest] = useState(initial.weeklyDigestEnabled);
  const [transactional, setTransactional] = useState(
    initial.transactionalEmailsEnabled,
  );
  const [pending, setPending] = useState(false);

  const dirty =
    weeklyDigest !== initial.weeklyDigestEnabled ||
    transactional !== initial.transactionalEmailsEnabled;

  const handleSave = async () => {
    setPending(true);
    try {
      const res = await updateBoxNotifications({
        weeklyDigestEnabled: weeklyDigest,
        transactionalEmailsEnabled: transactional,
      });
      if (!res.ok) {
        kToast.error(res.message);
        return;
      }
      kToast.success("Preferencias guardadas");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <KCard animate={false} className="p-5 md:p-6">
        <SwitchRow
          label="Resumen semanal"
          description="Cada lunes a las 9am recibís un email con revenue del mes, atletas activos, atletas en riesgo y próxima facturación."
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
        />
      </KCard>

      <KCard animate={false} className="p-5 md:p-6">
        <SwitchRow
          label="Avisos críticos de cobro"
          description="Notificaciones cuando un cobro falla, tu trial está por terminar, o tu suscripción expira. Recomendamos mantenerlo activo."
          checked={transactional}
          onChange={setTransactional}
          warning={!transactional}
        />
      </KCard>

      <div className="flex items-center justify-end gap-3 pt-2">
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setWeeklyDigest(initial.weeklyDigestEnabled);
              setTransactional(initial.transactionalEmailsEnabled);
            }}
            disabled={pending}
            className="text-sm text-[var(--k-t3)] hover:text-[var(--k-t2)] disabled:opacity-50"
          >
            Descartar
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || pending}
          className="k-btn-grad px-5 py-2.5 rounded-full text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
  warning,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  warning?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-base">{label}</p>
        <p className="text-sm text-[var(--k-t2)] mt-1">{description}</p>
        {warning && (
          <p className="text-xs text-[var(--k-warning)] mt-2">
            ⚠ Si lo desactivas, no recibirás avisos cuando un cobro falle.
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors"
        style={{
          background: checked ? "var(--k-accent)" : "var(--k-elevated)",
          border: "1px solid var(--k-line-2)",
        }}
      >
        <span
          className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{
            transform: checked ? "translateX(22px)" : "translateX(3px)",
          }}
        />
      </button>
    </div>
  );
}
