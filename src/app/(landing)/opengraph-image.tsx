import { ImageResponse } from "next/og";

export const alt = "Kronos — Software invisible para CrossFit Boxes";
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
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "#C8FF2D",
          filter: "blur(160px)",
          opacity: 0.25,
        }}
      />

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
          KRONOS
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          marginTop: "auto",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 88,
            fontWeight: 700,
            color: "#F5F5F7",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          Software invisible
          <br />
          <span style={{ color: "#C8FF2D" }}>para tu CrossFit Box.</span>
        </div>

        <div
          style={{
            fontSize: 26,
            color: "#8a8a94",
            letterSpacing: "-0.01em",
            maxWidth: 900,
          }}
        >
          Software para CrossFit Boxes en LATAM. White-label visual real. Pagos
          Stripe + Mercado Pago + OXXO.
        </div>
      </div>

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
        <span>kronos-fit.com</span>
        <span>·</span>
        <span>HECHO EN MÉXICO</span>
      </div>
    </div>,
    { ...size },
  );
}
