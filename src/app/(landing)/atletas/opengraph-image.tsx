import { ImageResponse } from "next/og";

export const alt = "Kronos Atletas — La app de CrossFit que entrena contigo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#08080A",
        padding: 80,
        position: "relative",
        fontFamily: "monospace",
      }}
    >
      {/* Glow accent superior derecho */}
      <div
        style={{
          position: "absolute",
          top: -220,
          right: -180,
          width: 640,
          height: 640,
          borderRadius: "50%",
          background: "#C8FF2D",
          filter: "blur(180px)",
          opacity: 0.28,
        }}
      />
      {/* Glow accent inferior izquierdo (refuerza V3 lima) */}
      <div
        style={{
          position: "absolute",
          bottom: -260,
          left: -200,
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: "#C8FF2D",
          filter: "blur(200px)",
          opacity: 0.18,
        }}
      />

      {/* Brand lockup */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 14,
            background: "#C8FF2D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#08080A",
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
        >
          K
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: "#F5F5F7",
            letterSpacing: "-0.04em",
          }}
        >
          KRONOS · ATLETAS
        </div>
      </div>

      {/* Claim principal */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          marginTop: "auto",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 92,
            fontWeight: 700,
            color: "#F5F5F7",
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
          }}
        >
          Tu progreso
          <span style={{ color: "#C8FF2D" }}>es el producto.</span>
        </div>

        <div
          style={{
            fontSize: 26,
            color: "#8a8a94",
            letterSpacing: "-0.01em",
            maxWidth: 920,
          }}
        >
          Anota PRs. Reserva clases. Mejora skills con coach IA. Foto del
          pizarrón → score automático.
        </div>
      </div>

      {/* Footer brand */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 32,
          paddingTop: 24,
          borderTop: "1px solid #1c1c24",
          color: "#54545c",
          fontSize: 18,
          letterSpacing: "0.06em",
          zIndex: 1,
        }}
      >
        <span>kronos-fit.com/atletas</span>
        <span>·</span>
        <span>HECHO EN MÉXICO</span>
      </div>
    </div>,
    { ...size },
  );
}
