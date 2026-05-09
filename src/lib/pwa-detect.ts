/**
 * Detección de browser/plataforma para el flow de instalación PWA.
 *
 * En iOS, Apple obliga a TODOS los browsers a usar WebKit y mantener "Safari"
 * en el userAgent string. Por eso una regex naive `/safari/` matchea Chrome iOS,
 * Firefox iOS y Edge iOS también, aunque NINGUNO de ellos puede instalar PWAs
 * como app standalone — solo Safari iOS puede.
 *
 * Esta función distingue entre Safari real y los demás browsers iOS para
 * mostrar instrucciones correctas en cada caso.
 */

export type PwaPlatform =
  | "ios-safari" // puede instalar via "Compartir → Agregar a inicio"
  | "ios-other" // Chrome/Firefox/Edge iOS — debe abrir en Safari primero
  | "android" // resto (Android, desktop) — usa beforeinstallprompt o menú browser
  | "unknown";

/**
 * Identifies the iOS sub-browser by checking for vendor markers in the UA.
 * Order matters — check non-Safari iOS browsers first.
 */
export function detectPwaPlatform(userAgent: string): PwaPlatform {
  const ua = userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);

  if (!isIos) return "android";

  // En iOS: detectar browsers no-Safari por sus marcadores específicos.
  if (/crios/.test(ua)) return "ios-other"; // Chrome iOS
  if (/fxios/.test(ua)) return "ios-other"; // Firefox iOS
  if (/edgios/.test(ua)) return "ios-other"; // Edge iOS
  if (/opios|opt\//.test(ua)) return "ios-other"; // Opera iOS / Opera Touch
  if (/yabrowser/.test(ua)) return "ios-other"; // Yandex iOS
  if (/duckduckgo/.test(ua)) return "ios-other"; // DuckDuckGo iOS

  // Si llegamos acá y dice "safari", es Safari real. Ojo: WKWebView embebidos
  // (apps in-app browsers como Gmail, Instagram, Twitter) NO incluyen "Safari"
  // en el UA — ahí caemos como ios-other implícito (ver abajo).
  if (/safari/.test(ua)) return "ios-safari";

  // iOS sin marcador Safari → probablemente WKWebView in-app (Instagram,
  // Gmail, etc) o algo no estándar. Tratar como ios-other (decirle que abra
  // en Safari real).
  return "ios-other";
}

/**
 * Build a deep-link URL that forces opening in iOS Safari.
 * `x-safari-https://` is an undocumented but stable Apple URL scheme that
 * works from in-app browsers and Chrome/Firefox iOS.
 */
export function buildSafariDeepLink(currentUrl: string): string {
  // Strip protocol, prefix with x-safari-https://
  const stripped = currentUrl.replace(/^https?:\/\//, "");
  return `x-safari-https://${stripped}`;
}
