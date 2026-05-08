import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#C8FF2D",
        borderRadius: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        fontWeight: 700,
        fontSize: 130,
        color: "#08080A",
        letterSpacing: -6,
        lineHeight: 1,
        paddingBottom: 8,
      }}
    >
      K
    </div>,
    { ...size },
  );
}
