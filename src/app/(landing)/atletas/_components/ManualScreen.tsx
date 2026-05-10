import Image from "next/image";
import type { Screen } from "../_data/screens";
import { imageExists } from "../_data/screens";

export default function ManualScreen({
  screen,
  index,
  showDeepLink,
}: {
  screen: Screen;
  index: number;
  showDeepLink: boolean;
}) {
  const hasImage = imageExists(screen.imageSrc);
  const chipClass =
    screen.audience === "AMBOS"
      ? "manual-screen-chip neutral"
      : "manual-screen-chip";
  const indexLabel = String(index).padStart(2, "0");

  return (
    <article id={screen.id} className="manual-screen">
      <div className="manual-screen-frame">
        {hasImage ? (
          <Image
            src={screen.imageSrc}
            alt={screen.imageAlt}
            fill
            sizes="(max-width: 720px) 280px, 320px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="manual-screen-placeholder">
            <span className="lbl">CAPTURA · PRÓXIMAMENTE</span>
            <span className="nm">{screen.label}</span>
            <span className="hnt">
              Esta sección se ilustrará con captura real en la próxima
              iteración. La descripción es definitiva.
            </span>
          </div>
        )}
      </div>

      <div className="manual-screen-body">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <span
            className="lp-mono"
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "var(--k-accent)",
            }}
          >
            /{indexLabel}
          </span>
          <span className={chipClass}>{screen.audience}</span>
        </div>
        <h3>{screen.title}</h3>
        <p className="lead">{screen.lead}</p>

        <div
          className="lp-caption"
          style={{
            color: "var(--k-t3)",
            letterSpacing: "0.18em",
            margin: "8px 0 12px",
          }}
        >
          QUÉ PODÉS HACER ACÁ
        </div>
        <ul className="manual-screen-actions">
          {screen.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>

        {showDeepLink && screen.deepLink ? (
          <a
            href={screen.deepLink}
            className="lp-btn-ghost"
            style={{ alignSelf: "flex-start", display: "inline-flex" }}
          >
            Abrir esta pantalla →
          </a>
        ) : null}
      </div>
    </article>
  );
}
