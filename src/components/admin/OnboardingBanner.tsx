import Link from "next/link";
import { Icon } from "@/components/kronos/Icon";

type Step = { label: string; done: boolean };

type Props = {
  show: boolean;
  hasMovements?: boolean;
  hasSchedule?: boolean;
  hasWods?: boolean;
  hasPlan?: boolean;
  hasStaff?: boolean;
  hasPassword?: boolean;
};

export default function OnboardingBanner({
  show,
  hasMovements = false,
  hasSchedule = false,
  hasWods = false,
  hasPlan = false,
  hasStaff = false,
  hasPassword = false,
}: Props) {
  if (!show) return null;

  const steps: Step[] = [
    { label: "Box", done: true },
    { label: "Movimientos", done: hasMovements },
    { label: "Horarios", done: hasSchedule },
    { label: "WODs", done: hasWods },
    { label: "Plan", done: hasPlan },
    { label: "Equipo", done: hasStaff },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div
      className="rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      style={{
        background: "var(--k-accent-soft)",
        border: "1px solid var(--k-accent-line)",
      }}
    >
      <div className="flex-1 min-w-0">
        <div
          className="text-[10px] font-mono uppercase tracking-[0.22em]"
          style={{ color: "var(--k-accent)" }}
        >
          Configura tu box · {doneCount} de {steps.length}
        </div>
        <p className="mt-1 text-sm md:text-base font-medium">
          Completa el onboarding para que Kronos se sienta tuyo desde el día
          uno.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {steps.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-mono"
              style={{
                background: s.done ? "var(--k-accent)" : "var(--k-elevated)",
                color: s.done ? "var(--k-accent-on)" : "var(--k-t2)",
                border: s.done ? "none" : "1px solid var(--k-line-2)",
              }}
            >
              <Icon name={s.done ? "check" : "circle"} size={16} />
              {s.label}
              <span className="sr-only">
                {s.done ? " listo" : " pendiente"}
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <Link
          href="/admin/onboarding"
          className="k-btn-grad inline-flex min-h-11 items-center justify-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap text-center"
        >
          Continuar setup
          <Icon name="arrowRight" size={16} />
        </Link>
        {!hasPassword && (
          <Link
            href="/admin/ajustes/seguridad"
            className="text-[11px] underline text-center"
            style={{ color: "var(--k-t2)" }}
          >
            Setear contraseña para login rápido
          </Link>
        )}
      </div>
    </div>
  );
}
