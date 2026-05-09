import { redirect } from "next/navigation";
import { getBoxMode } from "@/server/actions/box-mode";
import PhotoWodFlow from "./PhotoWodFlow";

export const metadata = { title: "Kronos — Foto del whiteboard" };

/**
 * Foto del whiteboard → OCR → review → guardar como WOD propio.
 * Solo Box Personal. Box real usa el flow del coach (whiteboard upload con
 * roster matching).
 */
export default async function PhotoWodPage() {
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
          📷 FOTO DEL WHITEBOARD
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
          Toma una foto del WOD
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--k-t2)",
            margin: "0 0 24px",
          }}
        >
          Lo leemos automáticamente. Después confirmás los datos y se guarda.
        </p>
        <PhotoWodFlow />
      </div>
    </div>
  );
}
