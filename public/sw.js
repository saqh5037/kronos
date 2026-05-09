// Kronos Service Worker
// - Push notifications (existente, no tocar)
// - Cache offline shell (nuevo): precache de páginas críticas + estrategias por path

const CACHE_VERSION = "kronos-shell-v1";
const SHELL_PRECACHE = [
  "/atleta",
  "/atleta/wod",
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
//   - Auth (/api/auth/*) y APIs no-GET y /admin/*: NETWORK ONLY (nunca cachear, debe ser fresh)
//   - /_next/static/*, /icons/*: CACHE FIRST (assets inmutables por hash)
//   - /atleta/* HTML: STALE WHILE REVALIDATE (sirve cache instant + refresca background)
//   - Resto GET: NETWORK FIRST con timeout 3s + cache fallback
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // dejar pasar mutations sin tocar

  const url = new URL(req.url);
  // Solo manejamos same-origin para evitar caché cross-origin involuntario.
  if (url.origin !== self.location.origin) return;

  // Network-only: auth + admin
  if (
    url.pathname.startsWith("/api/auth/") ||
    url.pathname.startsWith("/admin")
  ) {
    return; // dejar al browser manejar normal (network)
  }

  // Cache-first: assets estáticos
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Stale-while-revalidate: HTML del flow atleta
  if (url.pathname.startsWith("/atleta")) {
    event.respondWith(staleWhileRevalidate(req));
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

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const refresh = fetch(req)
    .then((res) => {
      if (res.ok) {
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone()));
      }
      return res;
    })
    .catch(() => null);
  return cached || (await refresh) || new Response("Offline", { status: 503 });
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
