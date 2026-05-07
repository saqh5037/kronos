import Link from "next/link";

type Props = {
  show: boolean;
};

export default function OnboardingBanner({ show }: Props) {
  if (!show) return null;
  return (
    <div
      className="rounded-2xl p-4 md:p-5 flex items-center justify-between gap-4 flex-wrap"
      style={{
        background: "var(--k-accent-soft)",
        border: "1px solid var(--k-line-2)",
      }}
    >
      <div className="flex-1 min-w-0">
        <div
          className="text-[10px] font-mono uppercase tracking-[0.22em]"
          style={{ color: "var(--k-accent)" }}
        >
          Configurá tu box
        </div>
        <p className="mt-1 text-sm md:text-base font-medium">
          Completá el onboarding para que Kronos se sienta tuyo desde el día
          uno.
        </p>
      </div>
      <Link
        href="/admin/onboarding"
        className="k-btn-grad px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap"
      >
        Continuar setup →
      </Link>
    </div>
  );
}
