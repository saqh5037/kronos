import Image from "next/image";

export type PhoneFrameSize = "sm" | "md" | "lg";

const SIZE_CONFIG = {
  sm: {
    outerRadius: 30,
    innerRadius: 22,
    notchWidth: 56,
    notchHeight: 14,
    bezel: 5,
    sidebarThickness: 1.5,
  },
  md: {
    outerRadius: 38,
    innerRadius: 28,
    notchWidth: 80,
    notchHeight: 18,
    bezel: 6,
    sidebarThickness: 1.5,
  },
  lg: {
    outerRadius: 48,
    innerRadius: 38,
    notchWidth: 112,
    notchHeight: 26,
    bezel: 8,
    sidebarThickness: 2,
  },
};

export default function PhoneFrame({
  src,
  alt,
  size = "md",
  priority = false,
  glow = false,
  showNotch = true,
  width,
  className,
  placeholder,
}: {
  src?: string;
  alt: string;
  size?: PhoneFrameSize;
  priority?: boolean;
  glow?: boolean;
  showNotch?: boolean;
  width?: number | string;
  className?: string;
  placeholder?: React.ReactNode;
}) {
  const c = SIZE_CONFIG[size];
  const hasImage = !!src;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        background:
          "linear-gradient(160deg, #2a2a32 0%, #18181d 35%, #08080a 100%)",
        borderRadius: c.outerRadius,
        padding: c.bezel,
        boxShadow: `
          0 ${c.bezel * 3}px ${c.bezel * 10}px -${c.bezel * 2}px rgba(0,0,0,0.7),
          0 0 0 ${c.sidebarThickness}px rgba(60, 60, 70, 0.4),
          inset 0 1px 0 rgba(255,255,255,0.05),
          inset 0 -1px 0 rgba(0,0,0,0.6)
        `,
        width: width ?? "100%",
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: c.innerRadius,
          overflow: "hidden",
          background: "#000",
          aspectRatio: "9 / 19.5",
        }}
      >
        {hasImage ? (
          <Image
            src={src!}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 720px) 280px, 360px"
            style={{
              objectFit: "cover",
              objectPosition: "center top",
            }}
          />
        ) : (
          placeholder
        )}
        {showNotch && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: size === "sm" ? 7 : size === "md" ? 9 : 12,
              left: "50%",
              transform: "translateX(-50%)",
              width: c.notchWidth,
              height: c.notchHeight,
              borderRadius: c.notchHeight / 2,
              background: "#000",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.04), inset 0 0 0 1px rgba(0,0,0,0.9)",
              zIndex: 5,
            }}
          />
        )}
      </div>
      {glow && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -40,
            pointerEvents: "none",
            zIndex: -1,
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(200,255,45,0.14), transparent 70%)",
            filter: "blur(24px)",
          }}
        />
      )}
    </div>
  );
}
