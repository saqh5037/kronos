export type SaasPlanFeatures = {
  bookings: boolean;
  wods: boolean;
  leaderboard: boolean;
  analytics: boolean;
  ocr: boolean;
  ai: boolean;
};

export type PlanLimits = {
  maxAthletes: number | null;
  maxCoaches: number | null;
};

export function formatPriceMxn(cents: number): string {
  if (cents === 0) return "Gratis";
  const pesos = cents / 100;
  return `$${pesos.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} MXN`;
}

export function describePlanLimits(limits: PlanLimits): string[] {
  const out: string[] = [];
  out.push(
    limits.maxAthletes === null
      ? "Atletas ilimitados"
      : `Hasta ${limits.maxAthletes} atletas`,
  );
  out.push(
    limits.maxCoaches === null
      ? "Coaches ilimitados"
      : `Hasta ${limits.maxCoaches} coaches`,
  );
  return out;
}

export function describeFeatures(features: SaasPlanFeatures): string[] {
  const out: string[] = [];
  if (features.bookings) out.push("Reservas + roster");
  if (features.wods) out.push("Biblioteca de WODs");
  if (features.leaderboard) out.push("Leaderboards");
  if (features.analytics) out.push("Analítica avanzada");
  if (features.ocr) out.push("OCR pizarra");
  if (features.ai) out.push("Insights con IA");
  return out;
}

export function isMockMode(): boolean {
  return !process.env.MERCADOPAGO_ACCESS_TOKEN;
}

export function nextBillingDate(from: Date = new Date()): Date {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}
