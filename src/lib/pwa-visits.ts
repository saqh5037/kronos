/**
 * Gating del PWA install banner.
 *
 * Reglas (banner aparece solo si):
 *  1. URL tiene `?install=1` (override explícito), O
 *  2. El atleta completó onboarding (flag `kronos-pwa-onboarded`), O
 *  3. Es la 3a visita o más al app
 *
 * Y siempre:
 *  - El user no descartó el banner en los últimos 7 días
 *  - La app no está corriendo en standalone (ya instalada)
 *
 * Visit count: incrementamos al cargar `/atleta/*` (ver layout). Una "visita"
 * es una ventana navegacional — no por refresh inmediato (TTL 30min).
 */

const VISITS_KEY = "kronos-visit-count";
const LAST_VISIT_KEY = "kronos-last-visit-ts";
const ONBOARDED_KEY = "kronos-pwa-onboarded";
const VISIT_TTL_MS = 30 * 60 * 1000; // 30 min entre visitas (no contar refresh)
const VISIT_THRESHOLD = 3;

/**
 * Increment visit count si pasaron >30 min desde la última.
 * Llamar desde un useEffect en el atleta layout (client-only).
 */
export function incrementVisit(): void {
  if (typeof window === "undefined") return;
  try {
    const lastRaw = localStorage.getItem(LAST_VISIT_KEY);
    const last = lastRaw ? Number(lastRaw) : 0;
    const now = Date.now();
    if (Number.isNaN(last) || now - last > VISIT_TTL_MS) {
      const current = getVisitCount();
      localStorage.setItem(VISITS_KEY, String(current + 1));
      localStorage.setItem(LAST_VISIT_KEY, String(now));
    }
  } catch {
    // localStorage puede fallar en private mode / quota; ignorar.
  }
}

export function getVisitCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(VISITS_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function markOnboarded(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    // ignore
  }
}

export function isOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * @param search - window.location.search del cliente (para pasarlo desde
 *                 component que tiene acceso al URL actual)
 */
export function shouldShowInstallBanner(search: string): boolean {
  if (typeof window === "undefined") return false;
  // Override explícito via ?install=1
  try {
    const params = new URLSearchParams(search);
    if (params.get("install") === "1") return true;
  } catch {
    // ignore
  }
  // Trigger natural: onboarded || visits >= 3
  return isOnboarded() || getVisitCount() >= VISIT_THRESHOLD;
}
