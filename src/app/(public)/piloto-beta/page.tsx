import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db as prismaBase } from "@/server/db";
import KronosLogo from "@/components/brand/KronosLogo";
import { verifyPilotBetaToken } from "@/lib/pilot-beta-token";
import PilotBetaSignForm from "./PilotBetaSignForm";

export const metadata: Metadata = {
  title: "Firma piloto-beta · Kronos",
  // Defensa: NO indexar este path en buscadores. El link es privado.
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ token?: string }>;

export default async function PilotoBetaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidStateScreen reason="missing" />;
  }

  const tokenResult = verifyPilotBetaToken(token);
  if (!tokenResult.ok) {
    return (
      <InvalidStateScreen
        reason={tokenResult.reason === "EXPIRED" ? "expired" : "invalid"}
      />
    );
  }

  const box = await prismaBase.box.findUnique({
    where: { id: tokenResult.payload.boxId },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      country: true,
      pilotBetaSignedAt: true,
      discipline: { select: { name: true } },
    },
  });

  if (!box) {
    notFound();
  }

  if (box.pilotBetaSignedAt) {
    return (
      <ConfirmationScreen
        boxName={box.name}
        signedAt={box.pilotBetaSignedAt}
        alreadySigned
      />
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--k-bg)", color: "var(--k-t1)" }}
    >
      <header className="border-b" style={{ borderColor: "var(--k-line)" }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <KronosLogo size={32} />
          <span
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: "var(--k-t3)" }}
          >
            Firma piloto-beta · Cupo limitado
          </span>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: "var(--k-accent)" }}
          >
            Contrato piloto · {box.discipline?.name ?? "Box"}
          </span>
          <h1
            className="font-display font-bold text-3xl leading-tight"
            style={{ color: "var(--k-t1)" }}
          >
            Firma tu acuerdo piloto
            <br />
            para <em className="k-h-italic">{box.name}</em>
          </h1>
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            {box.city ? `${box.city}, ${box.country}` : box.country} ·{" "}
            <code style={{ color: "var(--k-t3)" }}>{box.slug}</code>
          </p>
        </div>

        <article
          className="k-card p-6 flex flex-col gap-4 text-sm"
          style={{ color: "var(--k-t2)" }}
        >
          <h2
            className="font-display font-bold text-base"
            style={{ color: "var(--k-t1)" }}
          >
            Resumen del acuerdo
          </h2>
          <ul className="flex flex-col gap-2 list-disc list-inside">
            <li>
              <strong style={{ color: "var(--k-t1)" }}>Trial 30 días</strong>{" "}
              gratuitos con acceso completo a Kronos.
            </li>
            <li>
              <strong style={{ color: "var(--k-t1)" }}>
                Exclusividad geográfica 60 días
              </strong>{" "}
              en {box.city ?? "tu ciudad"} — ningún otro Box de la misma
              disciplina recibe trial activo durante ese período.
            </li>
            <li>
              Tu logo aparece en{" "}
              <code style={{ color: "var(--k-t3)" }}>kronos-fit.com</code> y
              materiales como Founding Partner.
            </li>
            <li>
              Feedback semanal con Samuel directamente. Sin tickets intermedios.
            </li>
            <li>
              Sin compromiso de continuar post-trial. Conviertes a paid solo si
              Kronos te suma.
            </li>
          </ul>
        </article>

        <PilotBetaSignForm token={token} boxName={box.name} />

        <p className="text-[11px] text-center" style={{ color: "var(--k-t3)" }}>
          Al firmar registramos tu IP + fecha como evidencia de aceptación. Esto
          no es un cargo. Quedas listo para empezar el piloto.
        </p>
      </section>
    </main>
  );
}

function InvalidStateScreen({
  reason,
}: {
  reason: "missing" | "invalid" | "expired";
}) {
  const titleByReason = {
    missing: "Link incompleto",
    invalid: "Link no válido",
    expired: "Link expirado",
  };
  const bodyByReason = {
    missing:
      "Llegaste a esta página sin token. Abre el link completo que Samuel te envió.",
    invalid:
      "No pudimos validar tu link. Verifica que esté completo (a veces el correo lo recorta).",
    expired:
      "Tu link expiró. Escríbele a Samuel y te mandamos uno nuevo en minutos.",
  };
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--k-bg)", color: "var(--k-t1)" }}
    >
      <div className="max-w-md mx-auto px-6 text-center flex flex-col gap-3">
        <KronosLogo size={32} className="mx-auto" />
        <h1
          className="font-display font-bold text-2xl mt-3"
          style={{ color: "var(--k-t1)" }}
        >
          {titleByReason[reason]}
        </h1>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          {bodyByReason[reason]}
        </p>
        <a
          href="mailto:contacto@kronos-fit.com?subject=Link%20de%20firma%20piloto-beta"
          className="lp-btn-lime mt-3 inline-flex items-center justify-center"
        >
          Escribir a contacto
        </a>
      </div>
    </main>
  );
}

function ConfirmationScreen({
  boxName,
  signedAt,
  alreadySigned,
}: {
  boxName: string;
  signedAt: Date;
  alreadySigned?: boolean;
}) {
  const formatted = signedAt.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--k-bg)", color: "var(--k-t1)" }}
    >
      <div className="max-w-md mx-auto px-6 text-center flex flex-col gap-4">
        <KronosLogo size={32} className="mx-auto" />
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-full mx-auto"
          style={{ background: "var(--k-accent-soft)" }}
        >
          <span
            className="font-display font-bold text-2xl"
            style={{ color: "var(--k-accent)" }}
          >
            ✓
          </span>
        </div>
        <h1
          className="font-display font-bold text-2xl"
          style={{ color: "var(--k-t1)" }}
        >
          {alreadySigned ? "Ya firmaste el acuerdo" : "Acuerdo firmado"}
        </h1>
        <p className="text-sm" style={{ color: "var(--k-t2)" }}>
          <strong style={{ color: "var(--k-t1)" }}>{boxName}</strong> queda
          activo como piloto. Fecha de firma: <strong>{formatted}</strong>.
        </p>
        <p className="text-[12px]" style={{ color: "var(--k-t3)" }}>
          Te llegará un correo con el detalle y los próximos pasos del trial de
          30 días.
        </p>
      </div>
    </main>
  );
}
