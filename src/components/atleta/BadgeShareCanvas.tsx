"use client";

import { useEffect, useRef, useState } from "react";

type Format = "story" | "feed";

type Props = {
  athleteName: string;
  badgeName: string;
  badgeCode: string;
  badgeDescription: string;
  earnedAtISO: string;
  xp: number;
};

const DIMS: Record<Format, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  feed: { w: 1080, h: 1080 },
};

export default function BadgeShareCanvas(props: Props) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("story");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="k-tap"
        style={{
          background: "var(--k-accent)",
          color: "var(--k-accent-on)",
          border: "none",
          borderRadius: 12,
          padding: "12px 18px",
          fontFamily: "var(--k-font-display)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "var(--k-accent-glow)",
        }}
      >
        Compartir logro
      </button>

      {open && (
        <ShareModal
          {...props}
          format={format}
          onFormat={setFormat}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ShareModal({
  athleteName,
  badgeName,
  badgeCode,
  badgeDescription,
  earnedAtISO,
  xp,
  format,
  onFormat,
  onClose,
}: Props & {
  format: Format;
  onFormat: (f: Format) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawAsset(ctx, {
      format,
      athleteName,
      badgeName,
      badgeCode,
      badgeDescription,
      earnedAt: new Date(earnedAtISO),
      xp,
    });
  }, [
    format,
    athleteName,
    badgeName,
    badgeCode,
    badgeDescription,
    earnedAtISO,
    xp,
  ]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `kronos-${badgeCode}-${format}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const dims = DIMS[format];

  return (
    <div
      role="dialog"
      aria-label="Compartir logro"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(8,8,10,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        overflowY: "auto",
        padding: "24px 16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 380,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "var(--k-accent)",
                textTransform: "uppercase",
              }}
            >
              COMPARTIR
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--k-t1)",
                marginTop: 2,
              }}
            >
              {badgeName}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="k-tap"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--k-surface)",
              border: "1px solid var(--k-line)",
              color: "var(--k-t2)",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: "flex",
            background: "var(--k-elevated)",
            border: "1px solid var(--k-line)",
            borderRadius: 12,
            padding: 4,
            gap: 4,
          }}
        >
          <FormatTab
            label="STORY"
            sub="1080×1920"
            active={format === "story"}
            onClick={() => onFormat("story")}
          />
          <FormatTab
            label="FEED"
            sub="1080×1080"
            active={format === "feed"}
            onClick={() => onFormat("feed")}
          />
        </div>

        <div
          style={{
            background: "var(--k-bg)",
            border: "1px solid var(--k-line)",
            borderRadius: 14,
            padding: 12,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <canvas
            ref={canvasRef}
            width={dims.w}
            height={dims.h}
            style={{
              width: "100%",
              maxWidth: format === "story" ? 200 : 320,
              height: "auto",
              borderRadius: 10,
              display: "block",
            }}
            aria-label={`Preview asset ${format}`}
          />
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="k-tap"
          style={{
            background: "var(--k-accent)",
            color: "var(--k-accent-on)",
            border: "none",
            borderRadius: 12,
            padding: "14px 18px",
            fontFamily: "var(--k-font-display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "var(--k-accent-glow)",
          }}
        >
          Descargar PNG
        </button>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 11,
            color: "var(--k-t3)",
            textAlign: "center",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Guarda en tu carrete y compártelo en Instagram con #KronosFit.
        </p>
      </div>
    </div>
  );
}

function FormatTab({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="k-tap"
      style={{
        flex: 1,
        padding: "10px 12px",
        background: active ? "var(--k-accent-soft)" : "transparent",
        border: `1px solid ${active ? "var(--k-accent-line)" : "transparent"}`,
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: active ? "var(--k-accent)" : "var(--k-t2)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: active ? "var(--k-accent)" : "var(--k-t3)",
        }}
      >
        {sub}
      </span>
    </button>
  );
}

type DrawArgs = {
  format: Format;
  athleteName: string;
  badgeName: string;
  badgeCode: string;
  badgeDescription: string;
  earnedAt: Date;
  xp: number;
};

function drawAsset(ctx: CanvasRenderingContext2D, args: DrawArgs) {
  const { w, h } = DIMS[args.format];
  const isStory = args.format === "story";

  // ── Background ──
  ctx.fillStyle = "#08080a";
  ctx.fillRect(0, 0, w, h);

  // Subtle grid for texture
  ctx.strokeStyle = "rgba(255,255,255,0.02)";
  ctx.lineWidth = 1;
  const gridStep = 60;
  for (let x = 0; x < w; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Top accent bar
  ctx.fillStyle = "#C8FF2D";
  ctx.fillRect(0, 0, w, 8);

  // Radial accent glow
  const gradient = ctx.createRadialGradient(
    w / 2,
    h * 0.35,
    50,
    w / 2,
    h * 0.35,
    w * 0.6,
  );
  gradient.addColorStop(0, "rgba(200,255,45,0.18)");
  gradient.addColorStop(1, "rgba(200,255,45,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // ── Logo header ──
  ctx.fillStyle = "#C8FF2D";
  ctx.font = `700 ${isStory ? 36 : 32}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "left";
  ctx.fillText("KRONOS", isStory ? 70 : 60, isStory ? 110 : 90);

  ctx.fillStyle = "#54545c";
  ctx.font = `600 ${isStory ? 18 : 16}px "IBM Plex Mono", monospace`;
  ctx.fillText("FIT", isStory ? 240 : 210, isStory ? 110 : 90);

  // Eyebrow
  ctx.fillStyle = "#C8FF2D";
  ctx.font = `700 ${isStory ? 22 : 20}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";
  ctx.fillText("LOGRO DESBLOQUEADO", w / 2, isStory ? 320 : 220);

  // ── Badge icon ──
  const initial =
    args.badgeCode
      .split("-")
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "★";
  const iconY = isStory ? 540 : 360;
  const iconR = isStory ? 130 : 100;

  ctx.beginPath();
  ctx.arc(w / 2, iconY, iconR, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(200,255,45,0.15)";
  ctx.fill();
  ctx.strokeStyle = "#C8FF2D";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#C8FF2D";
  ctx.font = `700 ${isStory ? 80 : 60}px "IBM Plex Mono", monospace`;
  ctx.textBaseline = "middle";
  ctx.fillText(initial, w / 2, iconY + 5);
  ctx.textBaseline = "alphabetic";

  // ── Badge name ──
  ctx.fillStyle = "#f5f5f7";
  ctx.font = `700 ${isStory ? 64 : 50}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";

  const nameLines = wrapText(ctx, args.badgeName.toUpperCase(), w - 160);
  const nameY = isStory ? 800 : 540;
  nameLines.forEach((line, i) => {
    ctx.fillText(line, w / 2, nameY + i * (isStory ? 70 : 56));
  });

  // ── Description ──
  ctx.fillStyle = "#8a8a94";
  ctx.font = `400 ${isStory ? 26 : 22}px "Inter", system-ui, sans-serif`;
  const descY = nameY + nameLines.length * (isStory ? 80 : 65) + 20;
  const descLines = wrapText(ctx, args.badgeDescription, w - 200);
  descLines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, w / 2, descY + i * (isStory ? 36 : 30));
  });

  // ── XP chip ──
  const xpY = descY + descLines.slice(0, 3).length * (isStory ? 40 : 32) + 60;
  const xpText = `+${args.xp} XP`;
  ctx.font = `700 ${isStory ? 28 : 22}px "IBM Plex Mono", monospace`;
  const xpW = ctx.measureText(xpText).width + 50;
  const xpH = isStory ? 56 : 46;
  const xpX = (w - xpW) / 2;

  ctx.fillStyle = "#C8FF2D";
  roundRect(ctx, xpX, xpY - xpH + 12, xpW, xpH, 999);
  ctx.fill();
  ctx.fillStyle = "#08080a";
  ctx.fillText(xpText, w / 2, xpY);

  // ── Bottom block: athlete + date + hashtag ──
  const bottomY = h - (isStory ? 280 : 200);

  ctx.fillStyle = "#54545c";
  ctx.font = `700 ${isStory ? 22 : 18}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";
  ctx.fillText("ATLETA", w / 2, bottomY);

  ctx.fillStyle = "#f5f5f7";
  ctx.font = `700 ${isStory ? 44 : 36}px "IBM Plex Mono", monospace`;
  ctx.fillText(
    args.athleteName.toUpperCase(),
    w / 2,
    bottomY + (isStory ? 50 : 42),
  );

  ctx.fillStyle = "#8a8a94";
  ctx.font = `600 ${isStory ? 22 : 18}px "Inter", system-ui, sans-serif`;
  const dateLabel = formatDateMx(args.earnedAt);
  ctx.fillText(dateLabel, w / 2, bottomY + (isStory ? 100 : 80));

  // Bottom accent + hashtag
  ctx.fillStyle = "#C8FF2D";
  ctx.font = `700 ${isStory ? 24 : 20}px "IBM Plex Mono", monospace`;
  ctx.fillText("#KRONOSFIT", w / 2, h - (isStory ? 100 : 60));

  ctx.fillStyle = "#C8FF2D";
  ctx.fillRect(0, h - 8, w, 8);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function formatDateMx(d: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
