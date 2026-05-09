"use client";

import { useState, useTransition } from "react";
import {
  applyManualOverride,
  regenerateMovementContent,
  regenerateProgressionsOnly,
} from "@/server/actions/movement-content";

type Props = {
  movementId: string;
  movementName: string;
  contentSource: "EMPTY" | "STANDARD_SEED" | "AI_GENERATED" | "MANUAL_OVERRIDE";
  initialJson: {
    cues: unknown;
    commonMistakes: unknown;
    progressions: unknown;
    musclesWorked: string[];
    difficulty: number | null;
  };
  onClose: () => void;
};

export default function MovementContentEditor({
  movementId,
  movementName,
  contentSource,
  initialJson,
  onClose,
}: Props) {
  const [json, setJson] = useState(() =>
    JSON.stringify(
      {
        cues: initialJson.cues,
        commonMistakes: initialJson.commonMistakes,
        progressions: initialJson.progressions,
        musclesWorked: initialJson.musclesWorked,
        difficulty: initialJson.difficulty,
      },
      null,
      2,
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSuccess(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      setError(`JSON inválido: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    startTransition(async () => {
      try {
        const r = await applyManualOverride(movementId, parsed);
        if (!r.ok) setError(`Error: ${r.reason}`);
        else setSuccess("Override aplicado · contentSource=MANUAL_OVERRIDE");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function handleRegenerate() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const r = await regenerateMovementContent(movementId);
        if (!r.ok) setError(`Error: ${r.reason}`);
        else {
          setSuccess("Regenerado con AI");
          setJson(
            JSON.stringify(
              {
                cues: r.movement.cues,
                commonMistakes: r.movement.commonMistakes,
                progressions: r.movement.progressions,
                musclesWorked: r.movement.musclesWorked,
                difficulty: r.movement.difficulty,
              },
              null,
              2,
            ),
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function handleRegenProgressionsOnly() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const r = await regenerateProgressionsOnly(movementId);
        if (!r.ok) setError(`Error: ${r.reason}`);
        else {
          setSuccess("Solo progresiones regeneradas con AI");
          setJson(
            JSON.stringify(
              {
                cues: r.movement.cues,
                commonMistakes: r.movement.commonMistakes,
                progressions: r.movement.progressions,
                musclesWorked: r.movement.musclesWorked,
                difficulty: r.movement.difficulty,
              },
              null,
              2,
            ),
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,8,10,0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        padding: 16,
        overflow: "auto",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div
        role="dialog"
        aria-label="Editor de contenido del movimiento"
        style={{
          width: "100%",
          maxWidth: 720,
          background: "var(--k-surface)",
          border: "1px solid var(--k-line)",
          borderRadius: 16,
          padding: 20,
          marginTop: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 4,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--k-t1)",
              margin: 0,
            }}
          >
            Editor de contenido
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--k-t3)",
              fontSize: 20,
              cursor: "pointer",
            }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 13,
            color: "var(--k-t2)",
            margin: "4px 0 14px",
          }}
        >
          {movementName}
          <span
            className="k-mono"
            style={{
              marginLeft: 8,
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid var(--k-line)",
              fontSize: 9,
              letterSpacing: 1.2,
              color: "var(--k-t3)",
            }}
          >
            {contentSource}
          </span>
        </p>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            disabled={isPending}
            onClick={handleRegenerate}
            className="k-tap"
            style={btn({ bg: "var(--k-accent)", color: "var(--k-accent-on)" })}
          >
            Regenerar todo con AI
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleRegenProgressionsOnly}
            className="k-tap"
            style={btn({ ghost: true })}
          >
            Solo progresiones
          </button>
        </div>

        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: 360,
            padding: 12,
            background: "var(--k-elevated)",
            border: "1px solid var(--k-line)",
            borderRadius: 10,
            color: "var(--k-t1)",
            fontFamily: "var(--k-font-display)",
            fontSize: 12,
            lineHeight: 1.5,
            resize: "vertical",
          }}
        />

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 10,
              padding: "8px 10px",
              background: "var(--k-elevated)",
              border: "1px solid var(--k-danger)",
              borderRadius: 8,
              color: "var(--k-danger)",
              fontFamily: "var(--k-font-body)",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            style={{
              marginTop: 10,
              padding: "8px 10px",
              background: "var(--k-accent-soft)",
              border: "1px solid var(--k-accent-line)",
              borderRadius: 8,
              color: "var(--k-accent)",
              fontFamily: "var(--k-font-body)",
              fontSize: 12,
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 14,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="k-tap"
            style={btn({ ghost: true })}
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="k-tap"
            style={btn({ bg: "var(--k-accent)", color: "var(--k-accent-on)" })}
          >
            Guardar como override manual
          </button>
        </div>
      </div>
    </div>
  );
}

function btn(opts: {
  bg?: string;
  color?: string;
  ghost?: boolean;
}): React.CSSProperties {
  return {
    fontFamily: "var(--k-font-display)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "8px 14px",
    background: opts.ghost ? "transparent" : (opts.bg ?? "var(--k-accent)"),
    color: opts.ghost ? "var(--k-t1)" : (opts.color ?? "var(--k-accent-on)"),
    border: opts.ghost ? "1px solid var(--k-line)" : "none",
    borderRadius: 10,
    cursor: "pointer",
  };
}
