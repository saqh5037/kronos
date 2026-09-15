// Kronos Service Worker
// - Push notifications (existente, no tocar)
// - Cache offline shell: SOLO assets estáticos (NO HTML user-specific)
//
// Bug histórico (2026-05-17): la versión v1 precacheaba "/atleta" y
// "/atleta/wod" + usaba stale-while-revalidate para `/atleta/*` HTML. Al
// instalarse el SW en el browser, descargaba `/atleta` SIN segregar por
// usuario y servía esa misma respuesta a cualquier sesión futura — leak
// cross-tenant observado (atleta nuevo de Box X veía datos de Bernardo
// Quiroz del Box DOMINUS).
//
// Fix v2:
//   - Sacar `/atleta` y `/atleta/wod` del precache (HTML user-specific)
//   - Cambiar estrategia `/atleta/*` a NETWORK-ONLY (igual que /admin)
//   - Bump CACHE_VERSION para forzar drop del cache viejo en clientes con SW v1

// Fix v3 (audit 2026-09-15 §E):
//   - `/uploads` a network-only: `/uploads/whiteboards/*` son fotos del
//     whiteboard con nombres y scores de atletas. Con network-first se
//     cacheaban y sobrevivían al logout en una tablet compartida del box.
//   - `/invitacion` y `/invitacion-staff` a network-only: el HTML del token
//     de invitación es single-use y no debe quedar en cache.
//   - Borrada la estrategia stale-while-revalidate (código muerto desde v2).
//   - Bump de CACHE_VERSION para que los clientes con v2 tiren su cache.

const CACHE_VERSION = "kronos-shell-v3";
const SHELL_PRECACHE = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  // Precache best-effort: si alguno falla, no bloquea instalación.
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        Promise.allSettled(
          SHELL_PRECACHE.map((url) => cache.add(url).catch(() => null)),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

// Permite al cliente activar inmediatamente un worker waiting (post-update).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  // Limpiar caches viejos (versiones distintas a la actual).
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("kronos-shell-") && k !== CACHE_VERSION)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => clients.claim()),
  );
});

// Fetch handler con estrategias por tipo de request.
// Reglas:
//   - Auth (/api/auth/*) + /admin/* + /atleta/* + /api/* + /uploads/* +
//     /invitacion* : NETWORK ONLY (todas son user-specific o single-use y NO
//     deben servirse desde cache)
//   - /_next/static/*, /icons/*: CACHE FIRST (assets inmutables por hash)
//   - Resto GET: NETWORK FIRST con timeout 3s + cache fallback (landing,
//     /login, /signup, /atleta-signup — todas páginas públicas sin
//     contenido user-specific)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // dejar pasar mutations sin tocar

  const url = new URL(req.url);
  // Solo manejamos same-origin para evitar caché cross-origin involuntario.
  if (url.origin !== self.location.origin) return;

  // Network-only: TODAS las rutas user-specific. Cualquier cache de estas
  // puede leakear datos entre sesiones (bug histórico v1).
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/atleta") ||
    url.pathname.startsWith("/uploads") ||
    url.pathname.startsWith("/invitacion") ||
    url.pathname.startsWith("/invitacion-staff")
  ) {
    return; // dejar al browser manejar normal (network)
  }

  // Cache-first: assets estáticos inmutables
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Resto GET: network-first con fallback al cache si offline
  event.respondWith(networkFirst(req, 3000));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(req, timeoutMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(async () => {
      const cached = await caches.match(req);
      if (cached) resolve(cached);
    }, timeoutMs);

    fetch(req)
      .then((res) => {
        clearTimeout(timer);
        if (res.ok) {
          caches
            .open(CACHE_VERSION)
            .then((cache) => cache.put(req, res.clone()));
        }
        resolve(res);
      })
      .catch(async () => {
        clearTimeout(timer);
        const cached = await caches.match(req);
        resolve(cached || new Response("Offline", { status: 503 }));
      });
  });
}

// === Push notifications (sin cambios) ===
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Kronos", body: event.data.text() };
  }

  const title = data.title || "Kronos";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { link: data.link || "/atleta" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/atleta";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(link);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(link);
        }
      }),
  );
});
