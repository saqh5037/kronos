"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { updatePermission } from "@/server/actions/permissions";
import { Icon, type IconName } from "@/components/kronos/Icon";
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
  "MANAGE_ATHLETE_METRICS",
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
  MANAGE_ATHLETE_METRICS: "Registrar mediciones de atletas",
};

const ACTION_ICONS: Partial<Record<PermissionAction, IconName>> = {
  REGISTER_CASH_PAYMENT: "cash",
  APPLY_DISCOUNT: "discount",
  REFUND_PAYMENT: "refund",
  EDIT_PLAN_PRICING: "tag",
  DELETE_ATHLETE: "trash",
  MARK_OVERDUE: "alert",
  VIEW_FINANCIAL_REPORTS: "chart",
  EDIT_OTHERS_SCORES: "edit",
  MANAGE_ATHLETE_METRICS: "metrics",
};

/**
 * The actions that move money, and therefore the only ones an amount threshold
 * can mean anything for.
 *
 * The matrix used to render a `$` input on every row, so the owner was invited
 * to set a peso ceiling on "Eliminar atleta" and "Ver reportes financieros" —
 * a control with nothing behind it (audit 2026-09-15). Everything else shows a
 * dash and says why.
 */
const MONEY_ACTIONS = new Set<PermissionAction>([
  "REGISTER_CASH_PAYMENT",
  "APPLY_DISCOUNT",
  "REFUND_PAYMENT",
  "EDIT_PLAN_PRICING",
]);

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
    <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-surface)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--k-line)]">
              <th className="text-left p-4 text-[var(--k-t2)] font-mono text-[10px] uppercase tracking-wider">
                Acción
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  className="text-center p-4 text-[var(--k-t2)] font-mono text-[10px] uppercase tracking-wider w-28"
                >
                  {ROLE_LABELS[role]}
                </th>
              ))}
              <th className="text-center p-4 text-[var(--k-t2)] font-mono text-[10px] uppercase tracking-wider w-32">
                <span className="inline-flex items-center gap-1">
                  <Icon name="shield" size={16} /> Aprobación
                </span>
              </th>
              <th className="w-36 p-4 text-center font-mono text-[10px] tracking-wider text-[var(--k-t2)] uppercase">
                Umbral (MXN)
              </th>
              <th className="w-20 p-4 text-right font-mono text-[10px] tracking-wider text-[var(--k-t2)] uppercase">
                {ROLE_LABELS.OWNER}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--k-line)]">
            {ALL_ACTIONS.map((action, idx) => {
              const state = getState(action);

              return (
                <m.tr
                  key={action}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-[var(--k-elevated)] transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <Icon
                        name={ACTION_ICONS[action] ?? "settings"}
                        size={20}
                        style={{ color: "var(--k-t2)" }}
                      />
                      <span className="font-medium text-[var(--k-t1)] text-[13px]">
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
                          aria-pressed={checked}
                          aria-label={`${ACTION_LABELS[action]} · ${ROLE_LABELS[role]}`}
                          className="relative inline-flex min-h-11 min-w-11 items-center justify-center cursor-pointer"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                              checked
                                ? "bg-[var(--k-accent)] border-[var(--k-accent)]"
                                : "border-[var(--k-line-2)] bg-transparent hover:border-[var(--k-t3)]"
                            }`}
                          >
                            {checked && (
                              <m.svg
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
                                  stroke="var(--k-accent-on)"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </m.svg>
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
                      aria-pressed={state.requiresOwnerApproval}
                      aria-label={`${ACTION_LABELS[action]} · requiere aprobación del dueño`}
                      className="relative inline-flex min-h-11 min-w-11 items-center justify-center cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                          state.requiresOwnerApproval
                            ? "bg-[var(--k-accent)] border-[var(--k-accent)]"
                            : "border-[var(--k-line-2)] bg-transparent hover:border-[var(--k-t3)]"
                        }`}
                      >
                        {state.requiresOwnerApproval && (
                          <m.svg
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
                              stroke="var(--k-accent-on)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </m.svg>
                        )}
                      </div>
                    </button>
                  </td>

                  {/* Threshold — only where an amount exists to compare */}
                  <td className="p-4 text-center">
                    {MONEY_ACTIONS.has(action) ? (
                      <div className="relative inline-block">
                        <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-[var(--k-t2)]">
                          $
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          defaultValue={state.threshold ?? ""}
                          onBlur={(e) =>
                            updateThreshold(action, e.target.value)
                          }
                          placeholder="Sin límite"
                          aria-label={`${ACTION_LABELS[action]} · umbral en pesos`}
                          className="w-24 rounded-lg border border-[var(--k-line-2)] bg-[var(--k-elevated)] py-1.5 pr-2 pl-6 text-center text-sm text-[var(--k-t1)] transition-colors focus:border-[var(--k-accent-line)] focus:outline-none"
                          min={0}
                        />
                      </div>
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: "var(--k-t3)" }}
                        title="Esta acción no mueve dinero, así que no tiene umbral."
                      >
                        No aplica
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <span className="font-mono text-[10px] text-[var(--k-t2)]">
                      Siempre
                    </span>
                  </td>
                </m.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/*
        A grid of bare checkboxes does not say what ticking one does. The
        legend names each column in the owner's terms, so the matrix can be
        read without guessing (audit 2026-09-15, S7).
      */}
      <dl
        className="grid gap-x-6 gap-y-2 border-t p-4 text-xs sm:grid-cols-2"
        style={{ borderColor: "var(--k-line)" }}
      >
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-[var(--k-t2)]">
            {ROLE_LABELS.COACH} / {ROLE_LABELS.STAFF}
          </dt>
          <dd style={{ color: "var(--k-t3)" }}>
            marcado = ese rol puede hacer la acción sin pedir permiso.
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-[var(--k-t2)]">
            Aprobación
          </dt>
          <dd style={{ color: "var(--k-t3)" }}>
            marcado = la acción queda pendiente hasta que tú la autorices.
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-[var(--k-t2)]">Umbral</dt>
          <dd style={{ color: "var(--k-t3)" }}>
            monto a partir del cual hace falta tu autorización. Solo en acciones
            que mueven dinero.
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-[var(--k-t2)]">
            {ROLE_LABELS.OWNER}
          </dt>
          <dd style={{ color: "var(--k-t3)" }}>
            siempre puede todo; no se puede restringir.
          </dd>
        </div>
      </dl>
    </div>
  );
}
