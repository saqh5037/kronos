"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FAQ_ITEMS } from "../_data/mock";
import { track } from "../_lib/track";
import {
  DEFAULT_DISCIPLINE_BRANDING,
  type DisciplineBranding,
} from "@/lib/branding";

function FAQItem({
  question,
  answer,
  questionId,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  questionId: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      className="lp-faq-item"
      style={{
        borderBottom: "1px solid var(--k-line)",
      }}
    >
      <button
        className="lp-faq-trigger"
        onClick={() => {
          onToggle();
          if (!isOpen) track("faq_opened", { question_id: questionId });
        }}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${questionId}`}
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="lp-faq-icon"
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${questionId}`}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 280,
            }}
            style={{ overflow: "hidden" }}
          >
            <div className="lp-faq-answer">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SectionFAQ({
  branding = DEFAULT_DISCIPLINE_BRANDING,
}: {
  branding?: DisciplineBranding;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const reduce = useReducedMotion();

  // FAQ base + extras de disciplina (Hyrox-specific al final). Cada extra
  // recibe un id sintético arriba del rango base para no colisionar.
  const items = useMemo(() => {
    const baseMaxId = FAQ_ITEMS.reduce((max, it) => Math.max(max, it.id), 0);
    const extras = branding.faqExtras.map((extra, idx) => ({
      id: baseMaxId + idx + 1,
      question: extra.q,
      answer: extra.a,
    }));
    return [...FAQ_ITEMS, ...extras];
  }, [branding.faqExtras]);

  return (
    <section className="lp-section" id="section-faq">
      <motion.div
        className="lp-faq-head"
        initial={reduce ? false : { y: 14 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="lp-eyebrow">
          <span className="lp-dot" />
          /05 · PREGUNTAS FRECUENTES
        </div>
        <h2>Lo que todo owner pregunta antes de cambiarse.</h2>
      </motion.div>

      <div className="lp-faq-list">
        {items.map((item) => (
          <FAQItem
            key={item.id}
            questionId={item.id}
            question={item.question}
            answer={item.answer}
            isOpen={openId === item.id}
            onToggle={() =>
              setOpenId((prev) => (prev === item.id ? null : item.id))
            }
          />
        ))}
      </div>
    </section>
  );
}
