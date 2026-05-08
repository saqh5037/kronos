import Image from "next/image";
import type { CSSProperties } from "react";

type Props = {
  src: string;
  alt: string;
  intensity?: "ambient" | "soft" | "strong";
  position?: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  sizes?: string;
};

const TINT_BY_INTENSITY = {
  ambient:
    "linear-gradient(135deg, rgba(200,255,45,0.18) 0%, rgba(8,8,10,0.95) 100%)",
  soft: "linear-gradient(135deg, rgba(200,255,45,0.32) 0%, rgba(8,8,10,0.88) 100%)",
  strong:
    "linear-gradient(135deg, rgba(200,255,45,0.45) 0%, rgba(8,8,10,0.78) 100%)",
} as const;

const FILTER_BY_INTENSITY = {
  ambient: "grayscale(100%) contrast(1.05) brightness(0.55)",
  soft: "grayscale(100%) contrast(1.1) brightness(0.65)",
  strong: "grayscale(100%) contrast(1.15) brightness(0.75)",
} as const;

const OPACITY_BY_INTENSITY = {
  ambient: 0.35,
  soft: 0.55,
  strong: 0.7,
} as const;

export default function DuotoneImage({
  src,
  alt,
  intensity = "soft",
  position = "center",
  className,
  style,
  priority,
  sizes = "100vw",
}: Props) {
  return (
    <span
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{
          objectFit: "cover",
          objectPosition: position,
          filter: FILTER_BY_INTENSITY[intensity],
          opacity: OPACITY_BY_INTENSITY[intensity],
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: TINT_BY_INTENSITY[intensity],
          mixBlendMode: "multiply",
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 30% 30%, transparent 0%, rgba(8,8,10,0.6) 80%)",
          mixBlendMode: "multiply",
        }}
      />
    </span>
  );
}
