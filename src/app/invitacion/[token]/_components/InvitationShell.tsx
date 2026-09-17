import Link from "next/link";
import KronosLogo from "@/components/brand/KronosLogo";

export function InvitationActions() {
  return (
    <div className="flex flex-col gap-3">
      <Link href="/atleta-signup" className="k-btn-grad w-full text-center">
        Crear cuenta gratis
      </Link>
      <Link href="/login" className="k-btn-ghost w-full text-center">
        Ya tengo cuenta
      </Link>
    </div>
  );
}

export function Layout({
  children,
  boxName,
  brandColor,
}: {
  children: React.ReactNode;
  boxName?: string;
  brandColor?: string | null;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--k-bg)]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <KronosLogo variant="lockup-h" size={34} />
          <p className="text-xs text-center text-[var(--k-t3)] max-w-[22rem]">
            Kronos es la app donde tu box lleva las clases y tú llevas tus PRs,
            tu racha y tus resultados.
          </p>
          {boxName && (
            <p
              className="k-eyebrow text-center"
              style={{ color: brandColor ?? "var(--k-t3)" }}
            >
              {boxName}
            </p>
          )}
        </div>
        <div className="k-card p-6">{children}</div>
      </div>
    </div>
  );
}
