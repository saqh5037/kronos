/**
 * Etiquetas de división en español para la página pública del evento.
 *
 * Las divisiones se guardan como texto libre. El seed ya escribe "Por partes",
 * pero los eventos sembrados antes traen el valor en inglés ("Partitioned"), así
 * que ambas claves viven aquí: esta es la frontera de presentación y el dato
 * crudo no llega al atleta (audit 2026-09-15).
 */
const DIVISION_LABELS: Record<string, string> = {
  rx: "RX",
  scaled: "Escalado",
  partitioned: "En equipo (reps divididas)",
  "por partes": "En equipo (reps divididas)",
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
