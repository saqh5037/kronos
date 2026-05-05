"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitSurveyResponse } from "@/server/actions/surveys";
import type { SurveyRow } from "@/server/actions/surveys";

type Props = {
  survey: SurveyRow;
  classId?: string;
  onComplete?: () => void;
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
  }),
};

export default function QuickSurvey({ survey, classId, onComplete }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [direction, setDirection] = useState(1);
  const [showThankYou, setShowThankYou] = useState(false);

  const questions = survey.questions;
  const currentQuestion = questions[questionIndex];

  if (showThankYou) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-3.5 rounded-2xl p-6 text-center border border-[var(--moss-line)]"
        style={{ background: "var(--moss-soft)" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="w-12 h-12 rounded-full bg-[var(--moss)] flex items-center justify-center mx-auto mb-3"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <p className="text-sm font-semibold text-[var(--moss)]">
          ¡Gracias por tu feedback!
        </p>
        <p className="text-xs text-white/40 mt-1">
          Tu opinión nos ayuda a mejorar
        </p>
      </motion.div>
    );
  }

  function handleOption(questionId: string, value: string) {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    const next = questionIndex + 1;
    if (next < questions.length) {
      setDirection(1);
      setQuestionIndex(next);
    } else {
      setShowThankYou(true);
      startTransition(async () => {
        try {
          await submitSurveyResponse(survey.id, newAnswers, classId);
        } catch {
          // Best-effort
        }
        onComplete?.();
      });

      // Auto-dismiss thank you after 2.5s
      setTimeout(() => {
        setShowThankYou(false);
      }, 2500);
    }
  }

  return (
    <div
      className="mx-3.5 rounded-2xl overflow-hidden border border-[var(--line)]"
      style={{ background: "var(--card)" }}
    >
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-4 pb-1">
        {questions.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              className={`h-2 rounded-full transition-colors ${
                i <= questionIndex ? "bg-[var(--fire)]" : "bg-white/10"
              }`}
              animate={{
                width: i === questionIndex ? 24 : 8,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </div>
        ))}
      </div>

      <div className="p-4 overflow-hidden">
        {/* Question counter */}
        <p className="text-[10px] font-mono font-bold tracking-wider text-white/30 uppercase mb-2 text-center">
          {questionIndex + 1} de {questions.length}
        </p>

        {/* Question with slide animation */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={questionIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <p className="text-[15px] font-semibold text-white text-center mb-4">
              {currentQuestion.text}
            </p>

            <div className="flex gap-2">
              {currentQuestion.options.map((opt) => (
                <motion.button
                  key={opt.value}
                  onClick={() => handleOption(currentQuestion.id, opt.value)}
                  disabled={isPending}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors border border-[var(--line)] bg-[var(--bg-soft)] hover:bg-[var(--card-2)] disabled:opacity-50"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.92 }}
                >
                  {opt.emoji && (
                    <motion.span
                      className="text-2xl leading-none"
                      whileHover={{
                        y: [0, -4, 0],
                        transition: {
                          duration: 0.4,
                          repeat: Infinity,
                        },
                      }}
                    >
                      {opt.emoji}
                    </motion.span>
                  )}
                  <span className="text-[11px] font-semibold text-center leading-tight text-white/70">
                    {opt.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
