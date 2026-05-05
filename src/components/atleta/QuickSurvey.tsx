"use client";

import { useState, useTransition } from "react";
import { submitSurveyResponse } from "@/server/actions/surveys";
import type { SurveyRow } from "@/server/actions/surveys";

type Props = {
  survey: SurveyRow;
  classId?: string;
  onComplete?: () => void;
};

/**
 * Tap-friendly survey component.
 * Shows one question at a time. Auto-advances on tap.
 * Total interaction time < 10 seconds.
 */
export default function QuickSurvey({ survey, classId, onComplete }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const questions = survey.questions;
  const currentQuestion = questions[questionIndex];

  if (done) {
    return (
      <div
        className="mx-3.5 rounded-[14px] p-4 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--line)" }}
      >
        <div className="text-2xl mb-1">✅</div>
        <div className="text-[13px] font-semibold">Gracias!</div>
        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
          Encuesta completada
        </div>
      </div>
    );
  }

  function handleOption(questionId: string, value: string) {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    const next = questionIndex + 1;
    if (next < questions.length) {
      setQuestionIndex(next);
    } else {
      // All questions answered — submit
      setDone(true);
      startTransition(async () => {
        try {
          await submitSurveyResponse(survey.id, newAnswers, classId);
        } catch {
          // Best-effort — already showed success
        }
        onComplete?.();
      });
    }
  }

  const progress = (questionIndex / questions.length) * 100;

  return (
    <div
      className="mx-3.5 rounded-[14px] overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--strain-line)",
      }}
    >
      {/* Progress bar */}
      <div
        className="h-0.5 transition-all duration-300"
        style={{
          background: "var(--bg-soft)",
        }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: "var(--grad)",
          }}
        />
      </div>

      <div className="p-4">
        {/* Question counter */}
        <div
          className="font-mono text-[9px] font-bold tracking-[0.14em] mb-2"
          style={{ color: "var(--text-3)" }}
        >
          {questionIndex + 1} / {questions.length}
        </div>

        {/* Question text */}
        <div className="text-[15px] font-semibold mb-4">
          {currentQuestion.text}
        </div>

        {/* Options — big tap targets */}
        <div className="flex gap-2">
          {currentQuestion.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleOption(currentQuestion.id, opt.value)}
              disabled={isPending}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-[12px] transition-all active:scale-95"
              style={{
                background: "var(--bg-soft)",
                border: "1px solid var(--line)",
              }}
            >
              {opt.emoji && (
                <span className="text-2xl leading-none">{opt.emoji}</span>
              )}
              <span
                className="text-[11px] font-semibold text-center leading-tight"
                style={{ color: "var(--text-2)" }}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
