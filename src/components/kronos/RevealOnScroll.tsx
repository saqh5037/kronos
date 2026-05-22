"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealVariant = "fade-up" | "scale" | "fade";

interface RevealOnScrollProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  once?: boolean;
  [dataAttr: `data-${string}`]: string | undefined;
}

export default function RevealOnScroll({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 800,
  className = "",
  threshold = 0.1,
  once = true,
  ...rest
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fallback: if the element starts off-screen and the observer never fires
    // (e.g. user never scrolls, or device is short), reveal it after 600ms so
    // content is never permanently hidden.
    const fallback = setTimeout(() => setVisible(true), 600);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            clearTimeout(fallback);
            setVisible(true);
            if (once) observer.unobserve(el);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -32px 0px" },
    );
    observer.observe(el);
    return () => {
      clearTimeout(fallback);
      observer.disconnect();
    };
  }, [once, threshold]);

  const baseStyle: React.CSSProperties = {
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: "opacity, transform",
  };

  const hiddenStyle: React.CSSProperties =
    variant === "fade-up"
      ? { opacity: 0, transform: "translateY(28px)" }
      : variant === "scale"
        ? { opacity: 0, transform: "scale(0.96)" }
        : { opacity: 0 };

  const visibleStyle: React.CSSProperties =
    variant === "fade-up"
      ? { opacity: 1, transform: "translateY(0)" }
      : variant === "scale"
        ? { opacity: 1, transform: "scale(1)" }
        : { opacity: 1 };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...baseStyle,
        ...(visible ? visibleStyle : hiddenStyle),
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
