"use client";

import { useEffect, useRef } from "react";

type ParticleMeshProps = {
  density?: number;
  colorPrimary?: string;
  colorSecondary?: string;
  connectionDistance?: number;
  mobileBehavior?: "static-gradient" | "reduced" | "hidden";
  className?: string;
  style?: React.CSSProperties;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number; // 0..1 — interpolation between primary and secondary
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  const value = parseInt(
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned,
    16,
  );
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
): string {
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `${r}, ${g}, ${bl}`;
}

export default function ParticleMesh({
  density = 60,
  colorPrimary = "#e60026",
  colorSecondary = "#00bfff",
  connectionDistance = 120,
  mobileBehavior = "static-gradient",
  className = "",
  style,
}: ParticleMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fallback = fallbackRef.current;
    if (!canvas || !fallback) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.innerWidth < 768;

    if (reduceMotion || (isMobile && mobileBehavior !== "reduced")) {
      canvas.style.display = "none";
      if (mobileBehavior === "hidden" && isMobile && !reduceMotion) {
        fallback.style.display = "none";
      } else {
        fallback.style.display = "block";
      }
      return;
    }

    canvas.style.display = "block";
    fallback.style.display = "none";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const effectiveDensity = isMobile ? Math.round(density / 2) : density;

    let width = 0;
    let height = 0;

    const colorA = hexToRgb(colorPrimary);
    const colorB = hexToRgb(colorSecondary);

    function resize() {
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (ctx) ctx.scale(dpr, dpr);
    }

    function spawn() {
      const arr: Particle[] = [];
      for (let i = 0; i < effectiveDensity; i++) {
        arr.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: 1 + Math.random() * 1.6,
          hue: Math.random(),
        });
      }
      particlesRef.current = arr;
    }

    let lastFrame = 0;
    const minDelta = isMobile ? 1000 / 30 : 1000 / 60;

    function tick(now: number) {
      if (!ctx) return;
      if (now - lastFrame < minDelta) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      // update + draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.hue += 0.0008;
        if (p.hue > 1) p.hue -= 1;

        const t = (Math.sin(p.hue * Math.PI * 2) + 1) / 2;
        const rgb = lerpColor(colorA, colorB, t);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, 0.85)`;
        ctx.fill();
      }

      // connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.55;
            const t = ((a.hue + b.hue) / 2 + 0.0) % 1;
            const tt = (Math.sin(t * Math.PI * 2) + 1) / 2;
            const rgb = lerpColor(colorA, colorB, tt);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${rgb}, ${opacity.toFixed(3)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(tick);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        animRef.current = null;
      } else if (!animRef.current) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    resize();
    spawn();
    animRef.current = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    density,
    colorPrimary,
    colorSecondary,
    connectionDistance,
    mobileBehavior,
  ]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={style}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div
        ref={fallbackRef}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${colorPrimary}1f, transparent 50%), radial-gradient(circle at 70% 80%, ${colorSecondary}1a, transparent 55%)`,
          display: "none",
        }}
      />
    </div>
  );
}
