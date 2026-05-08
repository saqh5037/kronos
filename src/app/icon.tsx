import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#C8FF2D",
        borderRadius: 7,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        fontWeight: 700,
        fontSize: 22,
        color: "#08080A",
        letterSpacing: -1,
        lineHeight: 1,
        paddingBottom: 1,
      }}
    >
      K
    </div>,
    { ...size },
  );
}
