/**
 * Etiquetas de división en español para la página pública del evento.
 *
 * Las divisiones se guardan como texto libre y los eventos sembrados traen
 * valores en inglés ("Partitioned"). Esta es la frontera de presentación: el
 * dato crudo no llega al atleta (audit 2026-09-15).
 */
const DIVISION_LABELS: Record<string, string> = {
  rx: "RX",
  scaled: "Escalado",
  partitioned: "En equipo (reps divididas)",
  partner: "En pareja",
  teams: "Por equipos",
  team: "Por equipos",
  individual: "Individual",
  masters: "Máster",
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  elite: "Élite",
  open: "Abierta",
};

/** Traduce una división conocida; devuelve el valor original si no la conoce. */
export function divisionLabel(division: string): string {
  const key = division.trim().toLowerCase();
  return DIVISION_LABELS[key] ?? division;
}
