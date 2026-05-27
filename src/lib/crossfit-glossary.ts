/**
 * CrossFit glossary — MX-neutral Spanish definitions.
 * Keys are stored uppercase; lookups are case-insensitive.
 */
export const CROSSFIT_GLOSSARY: Record<string, string> = {
  AMRAP:
    "As Many Rounds As Possible — tantas rondas y reps como puedas en el tiempo dado.",
  EMOM: "Every Minute On the Minute — empiezas un trabajo al inicio de cada minuto.",
  FORTIME: "Completa el trabajo prescrito lo más rápido posible.",
  "FOR TIME": "Completa el trabajo prescrito lo más rápido posible.",
  RFT: "Rounds For Time — varias rondas, lo más rápido posible.",
  RX: "Como está prescrito — pesos y movimientos oficiales, sin modificar.",
  SCALED:
    "Escalado — versión modificada (menos peso o movimiento alternativo).",
  RXPLUS:
    "Más exigente que RX — pesos o movimientos por encima de lo prescrito.",
  "RX+":
    "Más exigente que RX — pesos o movimientos por encima de lo prescrito.",
  OLYMPIC:
    "Levantamiento olímpico — arranque (snatch) y envión (clean & jerk).",
  WAITLIST:
    "Lista de espera — si la clase está llena entras a la cola; te avisamos si se libera un lugar.",
};

/**
 * Case-insensitive lookup. Returns the definition or undefined if not found.
 */
export function lookupTerm(term: string): string | undefined {
  return CROSSFIT_GLOSSARY[term.toUpperCase()] ?? CROSSFIT_GLOSSARY[term];
}

/**
 * All registered glossary keys (original casing as stored).
 */
export const GLOSSARY_KEYS = Object.keys(CROSSFIT_GLOSSARY);
