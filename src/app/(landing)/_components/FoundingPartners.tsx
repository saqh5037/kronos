"use client";

import { SOCIAL_PROOF_BOXES } from "../_data/mock";

export default function FoundingPartners() {
  // Pre-launch: sin logos firmados, mostrar bloque alternativo honesto.
  if (SOCIAL_PROOF_BOXES.length === 0) {
    return (
      <section className="lp-strip" id="founding">
        <div className="lbl">
          <span className="lp-dot" />
          CONSTRUIDO EN PILOTO PRIVADO
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
          Estamos arrancando con un grupo cerrado de Boxes en CDMX.
          <br />
          Si tu Box opera en MX, CO o PE y querés sumarte al piloto, hay 20
          cupos durante 2026.
        </div>
      </section>
    );
  }

  return (
    <section className="lp-strip" id="founding">
      <div className="lbl">
        <span className="lp-dot" />
        FOUNDING BOXES EN PILOTO PRIVADO
      </div>
      <div className="logos">
        {SOCIAL_PROOF_BOXES.map((box) => (
          <span key={box.name} className="box-logo">
            {box.name.toUpperCase()} · {box.city.toUpperCase()}
          </span>
        ))}
      </div>
      <div
        className="lp-caption"
        style={{
          color: "var(--k-t3)",
          textAlign: "center",
          width: "100%",
          marginTop: 12,
        }}
      >
        Cupo limitado a 20 Boxes en piloto durante 2026.
      </div>
    </section>
  );
}
