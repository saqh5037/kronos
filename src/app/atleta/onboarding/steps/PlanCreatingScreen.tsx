"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Laura M.",
    role: "Atleta • Iron Hands Box",
    quote: "En 3 meses mejoré mis PRs 15kg en squat",
    image: "/images/wizard/cierre-collage-04-deadlift.webp",
  },
  {
    name: "Carlos R.",
    role: "Atleta • CrossFit Central",
    quote: "El plan AI se adapta a mi ritmo de vida",
    image: "/images/wizard/cierre-collage-02-pullup.webp",
  },
  {
    name: "Sofia L.",
    role: "Atleta • Summit CrossFit",
    quote: "Finalmente entiendo cómo entrenar inteligente",
    image: "/images/wizard/cierre-collage-06-overhead.webp",
  },
];

type PlanCreatingScreenProps = {
  onComplete: () => void;
};

export function PlanCreatingScreen({ onComplete }: PlanCreatingScreenProps) {
  const [phase, setPhase] = useState<"creating" | "testimonials" | "complete">(
    "creating",
  );

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("testimonials"), 3500),
      setTimeout(() => setPhase("complete"), 6500),
      setTimeout(onComplete, 7500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="relative w-full max-w-md min-h-screen flex items-center justify-center">
      {/* Backdrop específico de la phase "creating" — gym dark con barbell
          centrada. Sale con fade cuando entra "testimonials". */}
      {phase === "creating" && (
        <motion.div
          aria-hidden
          key="creating-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.32 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: "url(/images/wizard/cierre-bg-loader.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      {phase === "creating" && (
        <motion.div
          key="creating"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 space-y-8 w-full px-4"
        >
          <div className="text-center space-y-2">
            <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
              Creando tu plan
            </h2>
            <p className="text-sm" style={{ color: "var(--k-t2)" }}>
              IA está adaptando el programa a tu perfil
            </p>
          </div>

          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
                className="h-1 rounded-full origin-left"
                style={{ background: "var(--k-accent)" }}
              />
            ))}
          </div>

          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex justify-center gap-1"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--k-accent)" }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}

      {phase === "testimonials" && (
        <motion.div
          key="testimonials"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 space-y-6 w-full px-4"
        >
          <div className="text-center mb-6">
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--k-t2)" }}
            >
              Lo que dicen otros atletas
            </p>
          </div>

          <div className="space-y-3">
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="relative overflow-hidden rounded-lg flex items-stretch"
                style={{
                  background: "var(--k-surface)",
                  border: "1px solid var(--k-line-2)",
                }}
              >
                {/* Imagen del movimiento — lado izquierdo, fade hacia el texto */}
                <div
                  aria-hidden
                  className="relative shrink-0"
                  style={{
                    width: 96,
                    backgroundImage: `url(${testimonial.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(15,16,20,0.35) 0%, rgba(15,16,20,0.95) 100%)",
                    }}
                  />
                </div>
                <div className="flex-1 p-4 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--k-t1)" }}
                  >
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <p className="text-xs mt-2" style={{ color: "var(--k-t3)" }}>
                    {testimonial.name} • {testimonial.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {phase === "complete" && (
        <motion.div
          key="complete"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center space-y-6 px-4"
        >
          <div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6 }}
              className="text-6xl mb-4 inline-block"
            >
              ✓
            </motion.div>
            <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
              ¡Listo!
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--k-t2)" }}>
              Tu primer WOD está preparado
            </p>
          </div>

          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-xs"
            style={{ color: "var(--k-t3)" }}
          >
            Redirigiendo...
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
