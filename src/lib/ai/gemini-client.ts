import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

let cachedClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY no configurado. Agrégalo a .env.local para usar features de IA.",
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(key);
  }
  return cachedClient;
}

export function getGeminiModel(
  modelName: string = DEFAULT_MODEL,
): GenerativeModel {
  return getClient().getGenerativeModel({ model: modelName });
}

type CacheEntry<T> = { value: T; expiresAt: number };
const memCache = new Map<string, CacheEntry<unknown>>();

export async function runWithCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = memCache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) {
    return hit.value;
  }
  const value = await fn();
  memCache.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
  return value;
}

export function clearAICache(): void {
  memCache.clear();
}

export async function generateText(
  prompt: string,
  modelName: string = DEFAULT_MODEL,
  maxRetries = 2,
): Promise<string> {
  const model = getGeminiModel(modelName);
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[gemini] attempt ${attempt + 1} failed:`, err);
    }
  }
  throw lastError ?? new Error("generateText: unknown error");
}
