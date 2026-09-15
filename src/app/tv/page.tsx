import Link from "next/link";
import { Tv } from "lucide-react";
import KronosLogo from "@/components/brand/KronosLogo";
import BoxAddressForm from "./_components/BoxAddressForm";

export const metadata = { title: "Kronos — Pantalla del box" };

/**
 * Índice de la pantalla para la TV del Box.
 *
 * Antes era una página de instrucciones para desarrollador: pedía un "slug" y
 * no tenía h1 ni forma de entrar (audit 2026-09-15). Ahora tiene encabezado,
 * una frase de para qué sirve y un campo donde el dueño escribe la dirección de
 * su box tal como la ve en su panel.
 */
export default function TVLanding() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center gap-6"
      style={{ background: "var(--k-bg)", padding: "48px 24px" }}
    >
      <div className="flex flex-col items-center gap-4 max-w-lg">
        <KronosLogo variant="lockup-h" size={34} />

        <span
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border"
          style={{
            background: "var(--k-surface)",
            borderColor: "var(--k-line-2)",
          }}
        >
          <Tv
            size={24}
            strokeWidth={1.75}
            style={{ color: "var(--k-accent)" }}
            aria-hidden="true"
          />
        </span>

        <h1
          className="font-display font-bold"
          style={{
            color: "var(--k-t1)",
            fontSize: "clamp(28px, 6vw, 44px)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          La pantalla de tu box
        </h1>

        <p className="text-sm leading-relaxed" style={{ color: "var(--k-t2)" }}>
          Pon esta página en la tele del box y queda el pizarrón en vivo: la
          clase en curso, el WOD del día, quién va arriba esta semana y los PRs
          recién marcados.
        </p>
      </div>

      <BoxAddressForm />

      <p className="text-xs" style={{ color: "var(--k-t3)" }}>
        <Link href="/" style={{ color: "var(--k-t2)" }}>
          Ir al inicio de Kronos
        </Link>
      </p>
    </main>
  );
}
