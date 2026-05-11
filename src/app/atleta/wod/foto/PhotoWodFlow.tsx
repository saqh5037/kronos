"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { kToast } from "@/lib/toast";
import { uploadAndAnalyzePhotoWod } from "@/server/actions/atleta-photo-wod";
import {
  createMyQuickWod,
  type QuickWodPR,
} from "@/server/actions/atleta-quick-wod";
import type { PhotoWodAIResult } from "@/server/ocr/photo-wod";
import { fireAchievementToast } from "@/components/atleta/AchievementToast";
import { formatScore } from "@/lib/scores";

type WodType = "FORTIME" | "AMRAP" | "EMOM" | "TABATA" | "STRENGTH" | "CUSTOM";
type ScoreType = "TIME" | "REPS" | "WEIGHT" | "ROUNDS_REPS";
type Scaling = "RX" | "SCALED" | "RXPLUS";

const WOD_TYPES: WodType[] = [
  "FORTIME",
  "AMRAP",
  "EMOM",
  "TABATA",
  "STRENGTH",
  "CUSTOM",
];
const SCORE_TYPES: ScoreType[] = ["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"];
const SCALINGS: Scaling[] = ["RX", "SCALED", "RXPLUS"];

/**
 * Parser "MM:SS" → segundos. Acepta "5:30", "12:05", "0:45" o número plano "330".
 */
function parseTimeMmSs(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const m = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (!m) return null;
  const min = parseInt(m[1], 10);
  const sec = parseInt(m[2], 10);
  if (sec >= 60) return null;
  return min * 60 + sec;
}

/**
 * Parser de score raw del whiteboard según scoreType esperado:
 *  - TIME: "5:43" → 343 segundos
 *  - REPS / WEIGHT: número directo
 *  - ROUNDS_REPS: "5+12" → {rounds: 5, reps: 12}
 */
function parseRawScore(
  raw: string | null,
  scoreType: ScoreType,
): { value: number; reps: number | null } | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (scoreType === "TIME") {
    const secs = parseTimeMmSs(trimmed);
    if (secs == null || secs <= 0) return null;
    return { value: secs, reps: null };
  }
  if (scoreType === "ROUNDS_REPS") {
    const m = trimmed.match(/^(\d+)\s*\+\s*(\d+)$/);
    if (m) {
      return { value: Number(m[1]), reps: Number(m[2]) };
    }
    const n = Number(trimmed);
    if (Number.isFinite(n)) return { value: n, reps: 0 };
    return null;
  }
  // REPS / WEIGHT
  const n = Number(trimmed.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return null;
  return { value: n, reps: null };
}

type Step = "upload" | "review" | "saving";

export default function PhotoWodFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [pending, startTransition] = useTransition();

  // Step 1 state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Step 2 state (parsed → editable)
  const [parsed, setParsed] = useState<PhotoWodAIResult | null>(null);
  const [name, setName] = useState("");
  const [wodType, setWodType] = useState<WodType>("FORTIME");
  const [scoreType, setScoreType] = useState<ScoreType>("TIME");
  const [scaling, setScaling] = useState<Scaling>("RX");
  const [timeCapInput, setTimeCapInput] = useState("");
  const [scoreInput, setScoreInput] = useState("");
  const [scoreReps, setScoreReps] = useState("");
  const [notes, setNotes] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function handleAnalyze() {
    if (!file) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAndAnalyzePhotoWod(fd);
      if (!res.ok) {
        kToast.error(res.message);
        return;
      }
      // Pre-fill form con valores parsed
      const p = res.parsed;
      setParsed(p);
      setName(p.wodName ?? "");
      setWodType(p.wodType ?? "FORTIME");
      const inferredScoreType = p.scoreType ?? "TIME";
      setScoreType(inferredScoreType);
      setScaling(p.score.scaling ?? "RX");
      setTimeCapInput(
        p.timeCapSeconds != null
          ? `${Math.floor(p.timeCapSeconds / 60)}:${String(p.timeCapSeconds % 60).padStart(2, "0")}`
          : "",
      );
      // Parsear el score raw según scoreType
      const sc = parseRawScore(p.score.value, inferredScoreType);
      if (sc) {
        if (inferredScoreType === "TIME") {
          // Mostrar como MM:SS legible
          setScoreInput(
            `${Math.floor(sc.value / 60)}:${String(sc.value % 60).padStart(2, "0")}`,
          );
        } else {
          setScoreInput(String(sc.value));
        }
        if (sc.reps != null) setScoreReps(String(sc.reps));
      } else {
        setScoreInput(p.score.value ?? "");
      }
      setNotes(p.notes ?? "");
      setStep("review");
    });
  }

  function handleConfirm() {
    setStep("saving");
    startTransition(async () => {
      let scoreValue: number;
      let scoreRepsValue: number | null = null;

      if (scoreType === "TIME") {
        const secs = parseTimeMmSs(scoreInput);
        if (secs == null || secs <= 0) {
          kToast.error("Tiempo inválido. Usa MM:SS o segundos.");
          setStep("review");
          return;
        }
        scoreValue = secs;
      } else if (scoreType === "ROUNDS_REPS") {
        const r = Number(scoreInput);
        const reps = Number(scoreReps || "0");
        if (!Number.isFinite(r) || r < 0) {
          kToast.error("Rondas inválidas");
          setStep("review");
          return;
        }
        scoreValue = r;
        scoreRepsValue = Number.isFinite(reps) ? reps : 0;
      } else {
        const n = Number(scoreInput);
        if (!Number.isFinite(n) || n < 0) {
          kToast.error("Valor inválido");
          setStep("review");
          return;
        }
        scoreValue = n;
      }

      let timeCapSeconds: number | null = null;
      if (timeCapInput.trim()) {
        const tc = parseTimeMmSs(timeCapInput);
        if (tc != null && tc >= 0) timeCapSeconds = tc;
      }

      const result = await createMyQuickWod({
        name: name.trim() || "WOD del whiteboard",
        type: wodType,
        scoreType,
        timeCapSeconds,
        scoreValue,
        scoreReps: scoreRepsValue,
        scaling,
        notes: notes.trim() || null,
      });

      if (!result.ok) {
        kToast.error(result.message);
        setStep("review");
        return;
      }
      if (result.pr.isPR) {
        firePRToast(result.pr, result.scoreId);
      } else {
        kToast.success("¡WOD guardado desde la foto!");
      }
      router.push("/atleta");
      router.refresh();
    });
  }

  function firePRToast(pr: QuickWodPR, scoreId: string) {
    const newFormatted = formatScore(pr.newValue, pr.scoreType);
    if (pr.isFirst) {
      fireAchievementToast([
        {
          badgeId: `wod-first-${scoreId}`,
          code: "WOD_FIRST",
          name: `Primer score en ${pr.wodName}`,
          description: `${newFormatted} — tu marca a vencer.`,
          xp: 0,
          eyebrow: "PRIMER REGISTRO",
        },
      ]);
      return;
    }
    const prevFormatted = formatScore(pr.previousBest ?? 0, pr.scoreType);
    fireAchievementToast([
      {
        badgeId: `wod-pr-${scoreId}`,
        code: "WOD_PR",
        name: `¡Nuevo PR en ${pr.wodName}!`,
        description: `${newFormatted} · antes ${prevFormatted}.`,
        xp: 0,
      },
    ]);
  }

  if (step === "upload") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label
          style={{
            display: "block",
            border: "2px dashed var(--k-line-2)",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            cursor: "pointer",
            background: "var(--k-surface)",
          }}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              style={{
                maxWidth: "100%",
                maxHeight: 300,
                borderRadius: 12,
                margin: "0 auto",
              }}
            />
          ) : (
            <>
              <div
                style={{
                  fontSize: 40,
                  marginBottom: 8,
                  color: "var(--k-accent)",
                }}
              >
                📷
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--k-t1)",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Tocá para tomar foto
              </div>
              <div style={{ fontSize: 11, color: "var(--k-t3)" }}>
                JPG, PNG o WEBP · max 8 MB
              </div>
            </>
          )}
        </label>
        {file ? (
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={pending}
            className="k-btn-grad"
            style={{
              padding: "16px 24px",
              borderRadius: 16,
              fontWeight: 700,
              fontSize: 14,
              opacity: pending ? 0.5 : 1,
              cursor: pending ? "wait" : "pointer",
            }}
          >
            {pending ? "Analizando…" : "Analizar foto →"}
          </button>
        ) : (
          <p
            style={{
              fontSize: 11,
              color: "var(--k-t3)",
              textAlign: "center",
              margin: 0,
            }}
          >
            ¿Sin foto a mano?{" "}
            <Link
              href="/atleta/wod/nuevo"
              style={{ color: "var(--k-accent)", textDecoration: "underline" }}
            >
              Cargar manualmente →
            </Link>
          </p>
        )}
      </div>
    );
  }

  // Step "review" o "saving"
  const noOcrSuccess =
    parsed && parsed.wodName == null && parsed.score.value == null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="WOD"
          style={{
            maxWidth: "100%",
            maxHeight: 200,
            borderRadius: 12,
            objectFit: "cover",
          }}
        />
      ) : null}

      {noOcrSuccess ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "var(--k-accent-soft)",
            border: "1px solid var(--k-accent-line)",
            fontSize: 12,
            color: "var(--k-t1)",
          }}
        >
          No pudimos leer la foto bien. Verifica / completa los datos abajo o{" "}
          <button
            type="button"
            onClick={() => setStep("upload")}
            style={{
              background: "none",
              border: "none",
              color: "var(--k-accent)",
              textDecoration: "underline",
              padding: 0,
              cursor: "pointer",
              font: "inherit",
            }}
          >
            tomar otra foto
          </button>
          .
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--k-t2)", margin: 0 }}>
          Verificá que los datos estén bien y confirma:
        </p>
      )}

      <Field
        label="Nombre del WOD"
        value={name}
        onChange={setName}
        placeholder="Fran, Murph..."
      />
      <SegmentedField
        label="Tipo"
        value={wodType}
        onChange={(v) => setWodType(v as WodType)}
        options={WOD_TYPES}
      />
      <SegmentedField
        label="Cómo se mide"
        value={scoreType}
        onChange={(v) => setScoreType(v as ScoreType)}
        options={SCORE_TYPES}
      />
      {(wodType === "FORTIME" || wodType === "AMRAP" || wodType === "EMOM") && (
        <Field
          label="Time cap (MM:SS, opcional)"
          value={timeCapInput}
          onChange={setTimeCapInput}
          placeholder="20:00"
        />
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Field
            label={
              scoreType === "TIME"
                ? "Tu tiempo"
                : scoreType === "WEIGHT"
                  ? "Peso (kg)"
                  : scoreType === "ROUNDS_REPS"
                    ? "Rounds"
                    : "Reps totales"
            }
            value={scoreInput}
            onChange={setScoreInput}
            placeholder={scoreType === "TIME" ? "5:43" : "120"}
          />
        </div>
        {scoreType === "ROUNDS_REPS" && (
          <div style={{ flex: 1 }}>
            <Field
              label="+ Reps extra"
              value={scoreReps}
              onChange={setScoreReps}
              placeholder="12"
            />
          </div>
        )}
      </div>

      <SegmentedField
        label="Escalado"
        value={scaling}
        onChange={(v) => setScaling(v as Scaling)}
        options={SCALINGS}
      />

      <Field
        label="Notas (opcional)"
        value={notes}
        onChange={setNotes}
        placeholder=""
      />

      <button
        type="button"
        onClick={handleConfirm}
        disabled={pending || step === "saving"}
        className="k-btn-grad"
        style={{
          padding: "16px 24px",
          borderRadius: 16,
          fontWeight: 700,
          fontSize: 14,
          marginTop: 8,
          opacity: pending || step === "saving" ? 0.5 : 1,
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {pending || step === "saving" ? "Guardando…" : "Confirmar y guardar →"}
      </button>
      <button
        type="button"
        onClick={() => setStep("upload")}
        disabled={pending}
        style={{
          background: "none",
          border: "none",
          color: "var(--k-t3)",
          fontSize: 12,
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        ← Tomar otra foto
      </button>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

function Field({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.2em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "12px 14px",
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line-2)",
          borderRadius: 12,
          color: "var(--k-t1)",
          fontSize: 14,
          fontFamily: "var(--k-font-body)",
          outline: "none",
        }}
      />
    </div>
  );
}

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: T[];
};

function SegmentedField<T extends string>({
  label,
  value,
  onChange,
  options,
}: SegmentedProps<T>) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.2em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          padding: 4,
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line-2)",
          borderRadius: 12,
        }}
      >
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              style={{
                flex: "1 1 auto",
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: active ? "var(--k-accent)" : "transparent",
                color: active ? "var(--k-accent-on)" : "var(--k-t2)",
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
