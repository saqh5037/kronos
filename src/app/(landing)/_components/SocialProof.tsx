import { SOCIAL_PROOF_BOXES } from "../_data/mock";

export default function SocialProof() {
  // Pre-launch: sin logos firmados, mostrar línea editorial honesta.
  if (SOCIAL_PROOF_BOXES.length === 0) {
    return (
      <div className="lp-strip">
        <div className="lbl">
          <span className="lp-dot" />
          PILOTO PRIVADO
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 14,
            color: "var(--k-t2)",
            lineHeight: 1.5,
            maxWidth: 640,
            textAlign: "center",
          }}
        >
          Construido en CDMX. En piloto con afiliados de CrossFit en México.
          Cupo limitado para founding Boxes.
        </div>
      </div>
    );
  }

  return (
    <div className="lp-strip">
      <div className="lbl">
        <span className="lp-dot" />
        OPERAN BAJO KRONOS
      </div>
      <div className="logos">
        {SOCIAL_PROOF_BOXES.map((box) => (
          <span key={box.name} className="box-logo">
            {box.name.toUpperCase()} · {box.city.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
