import { redirect } from "next/navigation";
import { getBoxMode } from "@/server/actions/box-mode";
import QuickWodForm from "./QuickWodForm";

export const metadata = { title: "Kronos — Loggear WOD" };

/**
 * Mini editor de WOD para atletas en Box Personal. Box real usa el flow
 * tradicional (coach programa, atleta solo loggea score en /atleta/wod).
 */
export default async function NuevoWodPage() {
  const { isPersonal } = await getBoxMode();
  if (!isPersonal) redirect("/atleta/wod");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--k-bg)",
        color: "var(--k-t1)",
        padding: "64px 16px 32px",
        fontFamily: "var(--k-font-body)",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          LOGGEA TU WOD
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: "8px 0 4px",
            color: "var(--k-t1)",
          }}
        >
          ¿Qué hiciste hoy?
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--k-t2)",
            margin: "0 0 24px",
          }}
        >
          Anotá el WOD y tu resultado en una sola pantalla.
        </p>
        <QuickWodForm />
      </div>
    </div>
  );
}
