"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from "@/server/actions/alerts";
import { hashStringToColor, getInitials } from "@/lib/hash-color";
import type { AlertRuleRow } from "@/server/actions/alerts";
import type { AuditAction, AlertChannel } from "@prisma/client";

type Owner = { id: string; name: string | null; email: string };

type Props = {
  rules: AlertRuleRow[];
  owners: Owner[];
  actionOptions: { value: AuditAction; label: string }[];
};

const CHANNEL_CONFIG: Record<
  AlertChannel,
  { icon: string; label: string; chipClass: string }
> = {
  EMAIL: { icon: "📧", label: "Email", chipClass: "k-chip-steel" },
  PUSH: { icon: "📱", label: "Push", chipClass: "k-chip-moss" },
  IN_APP: { icon: "🔔", label: "In-App", chipClass: "k-chip-ghost" },
  BOTH: {
    icon: "🌟",
    label: "Email + Push",
    chipClass:
      "bg-gradient-to-r from-[var(--k-accent)] to-[var(--k-warning)] text-text border-transparent",
  },
};

function AvatarStack({ ids, owners }: { ids: string[]; owners: Owner[] }) {
  const matched = ids
    .map((id) => owners.find((o) => o.id === id))
    .filter(Boolean) as Owner[];

  const display = matched.slice(0, 3);
  const extra = matched.length - 3;

  return (
    <div className="flex items-center">
      {display.map((o, i) => (
        <div
          key={o.id}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-text border-2 border-[var(--card)]"
          style={{
            backgroundColor: hashStringToColor(o.id),
            marginLeft: i > 0 ? -8 : 0,
            zIndex: display.length - i,
          }}
          title={o.name ?? o.email}
        >
          {getInitials(o.name ?? o.email)}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="w-6 h-6 rounded-full bg-[var(--k-elevated)] border-2 border-[var(--card)] flex items-center justify-center text-[9px] font-medium text-text-2"
          style={{ marginLeft: -8, zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

export default function AlertRulesPanel({
  rules: initialRules,
  owners,
  actionOptions,
}: Props) {
  const [rules, setRules] = useState(initialRules);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle(id: string, enabled: boolean) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !enabled } : r)),
    );
    await updateAlertRule(id, { enabled: !enabled });
  }

  async function handleDelete(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    await deleteAlertRule(id);
  }

  async function handleCreate(fd: FormData) {
    setLoading(true);
    const action = fd.get("action") as AuditAction;
    const channel = fd.get("channel") as AlertChannel;
    const thresholdVal = fd.get("threshold");
    const threshold = thresholdVal ? Number(thresholdVal) : null;
    const recipientIds = fd.getAll("recipientIds") as string[];

    await createAlertRule({ action, channel, threshold, recipientIds });
    setShowForm(false);
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {/* Header + Create button */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-3 font-mono uppercase tracking-wider">
          {rules.length} regla{rules.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="k-btn-grad px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 2V10M2 6H10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Nueva alerta
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form action={handleCreate} className="k-card p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono font-bold tracking-wider text-text-3 uppercase block mb-1.5">
                    Acción
                  </label>
                  <select
                    name="action"
                    required
                    className="w-full bg-[var(--k-elevated)] text-text text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-[var(--k-t2)]"
                  >
                    {actionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold tracking-wider text-text-3 uppercase block mb-1.5">
                    Canal
                  </label>
                  <select
                    name="channel"
                    className="w-full bg-[var(--k-elevated)] text-text text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-[var(--k-t2)]"
                  >
                    <option value="EMAIL">📧 Email</option>
                    <option value="BOTH">🌟 Email + Push</option>
                    <option value="PUSH">📱 Push</option>
                    <option value="IN_APP">🔔 In-App</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold tracking-wider text-text-3 uppercase block mb-1.5">
                    Umbral mínimo (MXN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      name="threshold"
                      placeholder="Opcional"
                      min={0}
                      className="w-full bg-[var(--k-elevated)] text-text text-sm rounded-lg pl-7 pr-3 py-2 border border-white/10 focus:outline-none focus:border-[var(--k-t2)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold tracking-wider text-text-3 uppercase block mb-1.5">
                    Destinatarios
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {owners.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-1.5 text-xs text-text-2 cursor-pointer bg-[var(--k-elevated)] rounded-lg px-2 py-1.5 border border-white/5"
                      >
                        <input
                          type="checkbox"
                          name="recipientIds"
                          value={u.id}
                          defaultChecked
                          className="accent-[var(--k-accent)]"
                        />
                        <span>{u.name ?? u.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="k-btn-ghost px-4 py-2 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="k-btn-grad px-5 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {loading ? "Creando..." : "Crear regla"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rule cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {rules.map((rule) => {
            const actionLabel =
              actionOptions.find((o) => o.value === rule.action)?.label ??
              rule.action;
            const channel = CHANNEL_CONFIG[rule.channel];

            return (
              <motion.div
                key={rule.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="k-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Top row: action + channel */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text">
                        {actionLabel}
                      </span>
                      <span
                        className={`k-chip text-[9px] py-0.5 px-1.5 ${channel.chipClass}`}
                      >
                        {channel.icon} {channel.label}
                      </span>
                    </div>

                    {/* Middle row: threshold + recipients */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {rule.threshold !== null && (
                        <span className="text-xs text-text-3">
                          Si supera{" "}
                          <strong className="text-text">
                            ${rule.threshold.toLocaleString("es-MX")} MXN
                          </strong>
                        </span>
                      )}
                      <AvatarStack ids={rule.recipientIds} owners={owners} />
                    </div>
                  </div>

                  {/* Right: toggle + delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(rule.id, rule.enabled)}
                      className="relative w-11 h-6 rounded-full transition-colors"
                      style={{
                        background: rule.enabled
                          ? "var(--k-accent)"
                          : "var(--track)",
                      }}
                    >
                      <motion.div
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                        animate={{ x: rule.enabled ? 20 : 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-text-3 hover:text-[var(--k-warning)] transition-colors p-1"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2 4H12M4.5 4V2.5C4.5 2.22386 4.72386 2 5 2H9C9.27614 2 9.5 2.22386 9.5 2.5V4M6 7V10M8 7V10"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {rules.length === 0 && !showForm && (
        <div className="k-card p-10 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-medium text-text">Sin reglas de alerta</p>
          <p className="text-sm text-text-3 mt-1">
            Crea una regla para empezar a recibir notificaciones sobre eventos
            críticos.
          </p>
        </div>
      )}
    </div>
  );
}
