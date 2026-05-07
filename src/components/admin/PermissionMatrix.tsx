"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { updatePermission } from "@/server/actions/permissions";
import type { PermissionAction, Role } from "@prisma/client";

const ALL_ACTIONS: PermissionAction[] = [
  "REGISTER_CASH_PAYMENT",
  "APPLY_DISCOUNT",
  "REFUND_PAYMENT",
  "EDIT_PLAN_PRICING",
  "DELETE_ATHLETE",
  "MARK_OVERDUE",
  "VIEW_FINANCIAL_REPORTS",
  "EDIT_OTHERS_SCORES",
];

const ACTION_LABELS: Record<PermissionAction, string> = {
  REGISTER_CASH_PAYMENT: "Registrar pago en efectivo",
  APPLY_DISCOUNT: "Aplicar descuento",
  REFUND_PAYMENT: "Anular / reembolsar pago",
  EDIT_PLAN_PRICING: "Editar precios de planes",
  DELETE_ATHLETE: "Eliminar atleta",
  MARK_OVERDUE: "Marcar como vencido",
  VIEW_FINANCIAL_REPORTS: "Ver reportes financieros",
  EDIT_OTHERS_SCORES: "Editar scores de otros",
};

const ACTION_ICONS: Partial<Record<PermissionAction, string>> = {
  REGISTER_CASH_PAYMENT: "💵",
  APPLY_DISCOUNT: "✂️",
  REFUND_PAYMENT: "↩️",
  EDIT_PLAN_PRICING: "🏷️",
  DELETE_ATHLETE: "🗑️",
  MARK_OVERDUE: "⚠️",
  VIEW_FINANCIAL_REPORTS: "📊",
  EDIT_OTHERS_SCORES: "✏️",
};

const ROLES: Role[] = ["COACH", "STAFF"];

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Dueño",
  COACH: "Coach",
  STAFF: "Staff",
  ATHLETE: "Atleta",
};

type Permission = {
  action: PermissionAction;
  allowedRoles: Role[];
  requiresOwnerApproval: boolean;
  threshold: number | null;
};

export default function PermissionMatrix({
  permissions,
}: {
  permissions: Permission[];
}) {
  const permMap = new Map(permissions.map((p) => [p.action, p]));
  const [optimistic, setOptimistic] = useState<Map<string, Permission>>(
    new Map(),
  );

  function getState(action: PermissionAction): Permission {
    return (
      optimistic.get(action) ??
      permMap.get(action) ?? {
        action,
        allowedRoles: [],
        requiresOwnerApproval: false,
        threshold: null,
      }
    );
  }

  async function toggleRole(action: PermissionAction, role: Role) {
    const current = getState(action);
    const newRoles = current.allowedRoles.includes(role)
      ? current.allowedRoles.filter((r) => r !== role)
      : [...current.allowedRoles, role];

    setOptimistic(
      new Map(optimistic.set(action, { ...current, allowedRoles: newRoles })),
    );
    await updatePermission(
      action,
      newRoles,
      current.threshold,
      current.requiresOwnerApproval,
    );
  }

  async function toggleApproval(action: PermissionAction) {
    const current = getState(action);
    setOptimistic(
      new Map(
        optimistic.set(action, {
          ...current,
          requiresOwnerApproval: !current.requiresOwnerApproval,
        }),
      ),
    );
    await updatePermission(
      action,
      current.allowedRoles,
      current.threshold,
      !current.requiresOwnerApproval,
    );
  }

  async function updateThreshold(action: PermissionAction, value: string) {
    const current = getState(action);
    const num = value ? Number(value) : null;
    setOptimistic(
      new Map(optimistic.set(action, { ...current, threshold: num })),
    );
    await updatePermission(
      action,
      current.allowedRoles,
      num,
      current.requiresOwnerApproval,
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="text-left p-4 text-text-3 font-mono text-[10px] uppercase tracking-wider">
                Acción
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  className="text-center p-4 text-text-3 font-mono text-[10px] uppercase tracking-wider w-28"
                >
                  {ROLE_LABELS[role]}
                </th>
              ))}
              <th className="text-center p-4 text-text-3 font-mono text-[10px] uppercase tracking-wider w-32">
                <span className="inline-flex items-center gap-1">
                  <span>🛡️</span> Aprobación
                </span>
              </th>
              <th className="text-center p-4 text-text-3 font-mono text-[10px] uppercase tracking-wider w-36">
                Umbral (MXN)
              </th>
              <th className="w-20 p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {ALL_ACTIONS.map((action, idx) => {
              const state = getState(action);

              return (
                <motion.tr
                  key={action}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-[var(--k-elevated)] transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">
                        {ACTION_ICONS[action] ?? "⚙️"}
                      </span>
                      <span className="font-medium text-text text-[13px]">
                        {ACTION_LABELS[action]}
                      </span>
                    </div>
                  </td>

                  {ROLES.map((role) => {
                    const checked = state.allowedRoles.includes(role);
                    return (
                      <td key={role} className="p-4 text-center">
                        <button
                          onClick={() => toggleRole(action, role)}
                          className="relative inline-flex items-center justify-center cursor-pointer"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                              checked
                                ? "bg-[var(--k-accent)] border-[var(--k-accent)]"
                                : "border-white/20 bg-transparent hover:border-white/40"
                            }`}
                          >
                            {checked && (
                              <motion.svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                }}
                              >
                                <path
                                  d="M2.5 6.5L5 9L9.5 3.5"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </motion.svg>
                            )}
                          </div>
                        </button>
                      </td>
                    );
                  })}

                  {/* Owner approval toggle */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleApproval(action)}
                      className="relative inline-flex items-center justify-center cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                          state.requiresOwnerApproval
                            ? "bg-[var(--k-warning)] border-[var(--k-warning)]"
                            : "border-white/20 bg-transparent hover:border-white/40"
                        }`}
                      >
                        {state.requiresOwnerApproval && (
                          <motion.svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                            }}
                          >
                            <path
                              d="M2.5 6.5L5 9L9.5 3.5"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </motion.svg>
                        )}
                      </div>
                    </button>
                  </td>

                  {/* Threshold */}
                  <td className="p-4 text-center">
                    <div className="relative inline-block">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3 text-xs">
                        $
                      </span>
                      <input
                        type="number"
                        defaultValue={state.threshold ?? ""}
                        onBlur={(e) => updateThreshold(action, e.target.value)}
                        placeholder="—"
                        className="w-24 bg-[var(--k-elevated)] text-text text-sm rounded-lg pl-6 pr-2 py-1.5 border border-white/10 text-center focus:outline-none focus:border-[var(--k-t2)] transition-colors"
                        min={0}
                      />
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <span className="text-[10px] text-text-3 font-mono">
                      OWNER
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
