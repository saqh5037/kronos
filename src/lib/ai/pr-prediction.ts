export type PRDataPoint = {
  achievedAt: Date;
  value: number;
};

export type PRPrediction = {
  predictedKg: number;
  weeksFromNow: number;
  confidence: number;
  currentBest: number;
  status: "improving" | "plateau" | "declining" | "insufficient";
  fallbackNarrative: string;
};

const MIN_POINTS = 3;
const DEFAULT_HORIZON_WEEKS = 6;
const PLATEAU_SLOPE_THRESHOLD = 0.01;

export function predictNextPR(
  data: PRDataPoint[],
  movementName: string,
  horizonWeeks: number = DEFAULT_HORIZON_WEEKS,
): PRPrediction {
  if (data.length === 0) {
    return {
      predictedKg: 0,
      weeksFromNow: horizonWeeks,
      confidence: 0,
      currentBest: 0,
      status: "insufficient",
      fallbackNarrative: `Sin datos suficientes en ${movementName}. Empieza a registrar attempts.`,
    };
  }

  const sorted = [...data].sort(
    (a, b) => a.achievedAt.getTime() - b.achievedAt.getTime(),
  );
  const last = sorted[sorted.length - 1];
  const currentBest = sorted.reduce(
    (max, d) => (d.value > max ? d.value : max),
    sorted[0].value,
  );

  if (sorted.length < MIN_POINTS) {
    return {
      predictedKg: currentBest,
      weeksFromNow: horizonWeeks,
      confidence: 0,
      currentBest,
      status: "insufficient",
      fallbackNarrative: `Tu PR actual de ${movementName} es ${formatKg(currentBest)}. Necesitamos al menos ${MIN_POINTS} attempts para predecir.`,
    };
  }

  const baseTime = sorted[0].achievedAt.getTime();
  const xs = sorted.map(
    (d) => (d.achievedAt.getTime() - baseTime) / (1000 * 60 * 60 * 24),
  );
  const ys = sorted.map((d) => d.value);

  const { slope, intercept, r2 } = linearRegression(xs, ys);
  const lastDayOffset = xs[xs.length - 1];
  const targetDayOffset = lastDayOffset + horizonWeeks * 7;
  const predictedKg = intercept + slope * targetDayOffset;

  if (slope < -PLATEAU_SLOPE_THRESHOLD) {
    return {
      predictedKg: currentBest,
      weeksFromNow: horizonWeeks,
      confidence: 0,
      currentBest,
      status: "declining",
      fallbackNarrative: `Tu ${movementName} tiende a la baja. Revisa volumen y técnica con tu coach.`,
    };
  }

  if (Math.abs(slope) <= PLATEAU_SLOPE_THRESHOLD) {
    return {
      predictedKg: currentBest,
      weeksFromNow: horizonWeeks,
      confidence: clamp(r2, 0, 1),
      currentBest,
      status: "plateau",
      fallbackNarrative: `Plateau en ${movementName} desde hace ${daysAgo(last.achievedAt)} días. Romperlo necesita un cambio de estímulo.`,
    };
  }

  const finalPredicted = Math.max(predictedKg, currentBest);
  const deltaKg = finalPredicted - currentBest;
  const confidence = clamp(r2, 0, 1);

  return {
    predictedKg: round1(finalPredicted),
    weeksFromNow: horizonWeeks,
    confidence: round2(confidence),
    currentBest: round1(currentBest),
    status: "improving",
    fallbackNarrative: `${movementName} estimado a ${formatKg(finalPredicted)} en ${horizonWeeks} semanas (+${formatKg(deltaKg)}).`,
  };
}

export function buildPRNarrativePrompt(
  movementName: string,
  pred: PRPrediction,
  athleteFirstName: string,
): string {
  const lines = [
    "Eres el coach virtual de Kronos. Genera UNA frase corta (máximo 16 palabras) en español.",
    "Motivadora pero honesta, sin emojis ni signos de exclamación dobles.",
    "Debe referenciar el movimiento y la cifra estimada.",
    "",
    `Atleta: ${athleteFirstName}`,
    `Movimiento: ${movementName}`,
    `Status: ${pred.status}`,
    `PR actual: ${pred.currentBest}`,
    `Predicho en ${pred.weeksFromNow} semanas: ${pred.predictedKg}`,
    `Confianza estadística: ${(pred.confidence * 100).toFixed(0)}%`,
    "",
    "Devuelve SOLO la frase, sin comillas.",
  ];
  return lines.join("\n");
}

function linearRegression(
  xs: number[],
  ys: number[],
): { slope: number; intercept: number; r2: number } {
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) {
    return { slope: 0, intercept: meanY, r2: 0 };
  }
  const slope = num / den;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yPred = intercept + slope * xs[i];
    ssRes += (ys[i] - yPred) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function daysAgo(date: Date): number {
  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function formatKg(n: number): string {
  return `${round1(n)} kg`;
}

export const __test = { linearRegression };
