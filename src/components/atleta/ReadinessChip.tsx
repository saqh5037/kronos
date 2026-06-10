"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import QuickSurvey from "./QuickSurvey";
import type { SurveyRow } from "@/server/actions/surveys";

type Props = {
  survey: SurveyRow;
};

export default function ReadinessChip({ survey }: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (done) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir check-in del día"
        className="k-tap"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "var(--k-surface)",
          border: "1px solid var(--k-accent-line)",
          borderRadius: 999,
          boxShadow: "var(--k-accent-glow)",
          color: "var(--k-t1)",
          fontFamily: "var(--k-font-display)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.04em",
          cursor: "pointer",
          margin: "0 14px",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--k-accent)",
            boxShadow: "var(--k-accent-glow)",
          }}
        />
        ¿Cómo amaneciste?
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "var(--k-accent)",
            marginLeft: 4,
          }}
        >
          CHECK-IN →
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(8,8,10,0.7)",
                zIndex: 50,
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
              aria-hidden
            />
            <m.div
              role="dialog"
              aria-label="Check-in del día"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 51,
                background: "var(--k-bg)",
                borderTop: "1px solid var(--k-accent-line)",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 -10px 40px rgba(0,0,0,0.6)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px 8px",
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
                    CHECK-IN DEL DÍA
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: "var(--k-t1)",
                      marginTop: 4,
                    }}
                  >
                    ¿Cómo amaneciste?
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setOpen(false)}
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
              <div style={{ padding: "8px 0 16px" }}>
                <QuickSurvey
                  survey={survey}
                  onComplete={() => {
                    setDone(true);
                    setOpen(false);
                  }}
                />
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
