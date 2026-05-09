"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { completeOnboarding } from "@/server/actions/atleta-onboarding";
import type { Unit, Level } from "@/lib/atleta-prefs";
import { kToast } from "@/lib/toast";

type Props = {
  initialUnit: Unit | null;
  initialLevel: Level | null;
  isPersonalBox: boolean;
};

export default function ProfileConfigBlock({
  initialUnit,
  initialLevel,
  isPersonalBox,
}: Props) {
  const [unit, setUnit] = useState<Unit>(initialUnit ?? "kg");
  const [level, setLevel] = useState<Level>(initialLevel ?? "scaled");
  const [joinSlug, setJoinSlug] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [pending, startTransition] = useTransition();

  function persistPrefs(nextUnit: Unit, nextLevel: Level) {
    startTransition(async () => {
      const r = await completeOnboarding({ unit: nextUnit, level: nextLevel });
      if (!r.ok) {
        kToast.error(r.message);
        return;
      }
      kToast.success("Preferencias actualizadas");
    });
  }

  function submitJoin() {
    if (joinSlug.trim().length === 0) return;
    startTransition(async () => {
      const r = await completeOnboarding({ joinBoxSlug: joinSlug.trim() });
      if (!r.ok) {
        kToast.error(r.message);
        return;
      }
      kToast.success(
        r.joinedBoxRequested && r.joinBoxName
          ? `Le avisamos al coach de ${r.joinBoxName}`
          : "Solicitud enviada",
      );
      setJoinSlug("");
      setShowJoin(false);
    });
  }

  return (
    <div className="p-4 space-y-5">
      <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
        CONFIGURACIÓN
      </p>

      <div className="space-y-2">
        <label
          className="text-[10px] font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Unidad
        </label>
        <Segmented
          options={[
            { value: "kg", label: "Kg" },
            { value: "lb", label: "Lb" },
          ]}
          value={unit}
          disabled={pending}
          onChange={(v) => {
            const nextUnit = v as Unit;
            setUnit(nextUnit);
            persistPrefs(nextUnit, level);
          }}
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-[10px] font-mono uppercase tracking-wider"
          style={{ color: "var(--k-t3)" }}
        >
          Nivel
        </label>
        <Segmented
          options={[
            { value: "beginner", label: "Empezando" },
            { value: "scaled", label: "Scaled" },
            { value: "rx", label: "RX" },
          ]}
          value={level}
          disabled={pending}
          onChange={(v) => {
            const nextLevel = v as Level;
            setLevel(nextLevel);
            persistPrefs(unit, nextLevel);
          }}
        />
      </div>

      {isPersonalBox ? (
        <div
          className="rounded-xl p-3"
          style={{ background: "var(--k-surface)", border: "1px solid var(--k-line-2)" }}
        >
          {!showJoin ? (
            <button
              type="button"
              onClick={() => setShowJoin(true)}
              className="text-sm font-mono uppercase tracking-wider"
              style={{ color: "var(--k-accent)", letterSpacing: "0.05em" }}
            >
              Unirme a un box →
            </button>
          ) : (
            <div className="space-y-2">
              <label
                className="text-[10px] font-mono uppercase tracking-wider block"
                style={{ color: "var(--k-t3)" }}
              >
                Código del box
              </label>
              <input
                type="text"
                value={joinSlug}
                onChange={(e) => setJoinSlug(e.target.value.toLowerCase())}
                placeholder="ej: iron-hands"
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                style={{
                  background: "var(--k-elevated)",
                  borderColor: "var(--k-line-2)",
                  color: "var(--k-t1)",
                }}
              />
              <p className="text-[11px]" style={{ color: "var(--k-t3)" }}>
                Le mandamos un email al coach para que te apruebe.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={submitJoin}
                  disabled={pending || joinSlug.trim().length === 0}
                  className="k-btn-grad px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {pending ? "Enviando…" : "Enviar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowJoin(false);
                    setJoinSlug("");
                  }}
                  disabled={pending}
                  className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider"
                  style={{ color: "var(--k-t3)" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div
        className="pt-2"
        style={{ borderTop: "1px dashed var(--k-line)" }}
      >
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          disabled={pending}
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "var(--k-danger)", letterSpacing: "0.08em" }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

type SegOption = { value: string; label: string };

function Segmented({
  options,
  value,
  onChange,
  disabled,
}: {
  options: SegOption[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex gap-1 p-1 rounded-lg"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-line-2)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className="flex-1 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-colors"
            style={{
              background: active ? "var(--k-accent)" : "transparent",
              color: active ? "var(--k-accent-on)" : "var(--k-t2)",
              fontWeight: active ? 700 : 500,
              letterSpacing: "0.05em",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
