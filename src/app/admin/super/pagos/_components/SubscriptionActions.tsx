"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useConfirm } from "@/lib/use-confirm";
import {
  superMarkSubscriptionPaid,
  superExtendTrial,
  superChangePlan,
  superCancelSubscription,
} from "@/server/actions/super-billing";
import type { SubscriptionRow } from "@/server/actions/super-billing";

type Plan = { id: string; name: string; slug: string; priceMxnCents: number };

type Props = {
  sub: SubscriptionRow;
  plans: Plan[];
  onSuccess?: () => void;
};

type MenuPosition = { top: number; right: number };

export function SubscriptionActions({ sub, plans, onSuccess }: Props) {
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Hydration-safe: portal only after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const openMenu = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right,
    });
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuPos(null);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, closeMenu]);

  const handleMarkPaid = async () => {
    closeMenu();
    const ok = await confirm({
      title: "Marcar como pagado",
      message: `Esto activará la suscripción de "${sub.boxName}" y registrará un pago manual por 1 mes. ¿Continuar?`,
      confirmLabel: "Marcar pagado",
      tone: "info",
    });
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await superMarkSubscriptionPaid(sub.id, {
        periodMonths: 1,
      });
      if (!result.ok) setError(result.message);
      else onSuccess?.();
    });
  };

  const handleExtendTrial = async () => {
    closeMenu();
    const ok = await confirm({
      title: "Extender trial",
      message: `Extender el trial de "${sub.boxName}" por 30 días adicionales. ¿Continuar?`,
      confirmLabel: "Extender 30 días",
      tone: "info",
    });
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await superExtendTrial(sub.boxId, { days: 30 });
      if (!result.ok) setError(result.message);
      else onSuccess?.();
    });
  };

  const handleChangePlan = async (newPlanId: string) => {
    closeMenu();
    const newPlan = plans.find((p) => p.id === newPlanId);
    if (!newPlan) return;
    const ok = await confirm({
      title: "Cambiar plan",
      message: `Cambiar a "${sub.boxName}" al plan "${newPlan.name}". ¿Continuar?`,
      confirmLabel: "Cambiar plan",
      tone: "warning",
    });
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await superChangePlan(sub.id, newPlanId);
      if (!result.ok) setError(result.message);
      else onSuccess?.();
    });
  };

  const handleCancel = async () => {
    closeMenu();
    const ok = await confirm({
      title: "Cancelar suscripción",
      message: `Esto cancelará la suscripción de "${sub.boxName}" de forma local (sin tocar MercadoPago). Esta acción no se puede deshacer fácilmente. ¿Continuar?`,
      confirmLabel: "Cancelar suscripción",
      tone: "danger",
    });
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await superCancelSubscription(sub.id);
      if (!result.ok) setError(result.message);
      else onSuccess?.();
    });
  };

  const otherPlans = plans.filter((p) => p.id !== sub.planId);

  const dropdownMenu =
    mounted && menuOpen && menuPos
      ? createPortal(
          <>
            {/* Backdrop — closes menu on outside click */}
            <div
              onClick={closeMenu}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9998,
              }}
            />
            {/* Menu — position: fixed escapes any overflow container */}
            <div
              style={{
                position: "absolute",
                top: menuPos.top,
                right: menuPos.right,
                background: "var(--k-elevated)",
                border: "1px solid var(--k-line-2)",
                borderRadius: 8,
                padding: "4px 0",
                minWidth: 220,
                zIndex: 9999,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              <MenuItem
                onClick={handleMarkPaid}
                label="Marcar pagado (1 mes)"
              />
              <MenuItem
                onClick={handleExtendTrial}
                label="Extender trial 30 días"
              />

              {otherPlans.length > 0 && (
                <>
                  <MenuDivider />
                  <MenuLabel label="Cambiar plan" />
                  {otherPlans.map((p) => (
                    <MenuItem
                      key={p.id}
                      onClick={() => handleChangePlan(p.id)}
                      label={p.name}
                      indent
                    />
                  ))}
                </>
              )}

              <MenuDivider />
              <MenuItem
                onClick={handleCancel}
                label="Cancelar suscripción"
                danger
                disabled={sub.status === "CANCELLED"}
              />
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={buttonRef}
        onClick={menuOpen ? closeMenu : openMenu}
        disabled={isPending}
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--k-accent)",
          background: "var(--k-accent-soft)",
          border: "1px solid var(--k-accent-line)",
          borderRadius: 6,
          padding: "4px 10px",
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "..." : "Acciones"}
      </button>

      {dropdownMenu}

      {error && (
        <p
          style={{
            position: "fixed",
            fontSize: 11,
            color: "var(--k-danger)",
            whiteSpace: "nowrap",
            background: "var(--k-elevated)",
            border: "1px solid var(--k-danger)",
            borderRadius: 6,
            padding: "4px 8px",
            zIndex: 10000,
            marginTop: 4,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  label,
  danger,
  disabled,
  indent,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: `6px ${indent ? "28px" : "16px"}`,
        fontFamily: "var(--k-font-display)",
        fontSize: 12,
        color: danger ? "var(--k-danger)" : "var(--k-t1)",
        background: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}

function MenuDivider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid var(--k-line)",
        margin: "4px 0",
      }}
    />
  );
}

function MenuLabel({ label }: { label: string }) {
  return (
    <p
      style={{
        fontFamily: "var(--k-font-display)",
        fontSize: 10,
        color: "var(--k-t3)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        padding: "4px 16px 2px",
        margin: 0,
      }}
    >
      {label}
    </p>
  );
}
