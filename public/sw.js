const CACHE_VERSION = "eq-v3";
const STATIC_CACHE = "eq-static-v3";
const API_CACHE = "eq-api-v3";
const DYNAMIC_CACHE = "eq-dynamic-v3";

// ─── App shell + nav pages — cache-first ────────────────────────────────
const SHELL_URLS = [
    "/",
    "/anki",
    "/quests",
    "/speak",
    "/analytics",
    "/analytics/weekly",
    "/manifest.json",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/offline.html",
];

// ─── API routes safe to serve stale (read-only, no side effects) ─────────
const STALE_WHILE_REVALIDATE_APIS = [
    "/api/user",
    "/api/quests",
    "/api/achievements",
    "/api/milestones",
    "/api/resources",
    "/api/dashboard/hero",
    "/api/dashboard/streak",
    "/api/dashboard/stats",
    "/api/anki/due",
    "/api/progress",
    "/api/stats",
];

// ─── APIs that must always be fresh (mutations or AI) ────────────────────
const NETWORK_ONLY_PATTERNS = [
    "/api/checkin",
    "/api/writing",
    "/api/speak",
    "/api/shadow",
    "/api/exam",
    "/api/ai",
    "/api/exp",
    "/api/push",
    "/api/analytics",
];

// ─── Install ──────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
    console.log("[SW v3] Installing...");
    event.waitUntil(
        (async () => {
            const cache = await caches.open(STATIC_CACHE);
            // Cache each URL individually so one failure doesn't block the rest
            await Promise.allSettled(
                SHELL_URLS.map((url) =>
                    cache
                        .add(url)
                        .catch((err) =>
                            console.warn("[SW v3] Failed to cache:", url, err),
                        ),
                ),
            );
            await self.skipWaiting();
        })(),
    );
});

// ─── Activate ─────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
    console.log("[SW v3] Activating...");
    const CURRENT_CACHES = [STATIC_CACHE, API_CACHE, DYNAMIC_CACHE];
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => !CURRENT_CACHES.includes(key))
                        .map((key) => {
                            console.log("[SW v3] Deleting old cache:", key);
                            return caches.delete(key);
                        }),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

// ─── Fetch Strategy Router ────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin, http(s), GET
    if (request.method !== "GET") return;
    if (!url.protocol.startsWith("http")) return;
    if (url.origin !== location.origin) return;

    const path = url.pathname;

    // 1. Network-only — mutations and AI must never be stale
    if (NETWORK_ONLY_PATTERNS.some((p) => path.startsWith(p))) {
        return; // Let browser handle normally
    }

    // 2. Stale-while-revalidate for safe read APIs
    if (STALE_WHILE_REVALIDATE_APIS.some((p) => path.startsWith(p))) {
        event.respondWith(staleWhileRevalidate(request, API_CACHE));
        return;
    }

    // 3. Cache-first for static assets (JS, CSS, fonts, images)
    if (
        path.startsWith("/_next/static/") ||
        path.match(/\.(woff2?|ttf|eot|css|png|jpg|jpeg|svg|ico|webp)$/)
    ) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // 4. Network-first with fallback for navigation + app shell
    if (request.mode === "navigate" || SHELL_URLS.includes(path)) {
        event.respondWith(networkFirstWithFallback(request));
        return;
    }

    // 5. Default: network-first for everything else
    event.respondWith(networkFirstWithFallback(request));
});

// ─── Strategy Implementations ─────────────────────────────────────────────

/**
 * Stale-while-revalidate:
 * Return cache immediately, update cache in background.
 * Perfect for read-only APIs that change occasionally.
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Background update — fire & forget (updates cache for next request)
    const networkUpdate = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    // If we have a cached version, return it immediately
    // The network update will refresh the cache in background
    if (cached) {
        return cached;
    }

    // No cache — must wait for network
    const networkResponse = await networkUpdate;
    if (networkResponse) return networkResponse;

    // Both cache and network failed — offline fallback
    return offlineFallback(request);
}

/**
 * Cache-first:
 * Return from cache if available, else fetch + cache.
 * For static assets that never change.
 */
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch {
        return offlineFallback(request);
    }
}

/**
 * Network-first with 4s timeout:
 * Try network. Fall back to cache after timeout.
 * For pages that must be fresh but need offline support.
 */
async function networkFirstWithFallback(request) {
    const cache = await caches.open(DYNAMIC_CACHE);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        // Try dynamic cache first, then static cache
        const cached = await cache.match(request);
        if (cached) return cached;

        const staticCache = await caches.open(STATIC_CACHE);
        const staticCached = await staticCache.match(request);
        if (staticCached) return staticCached;

        return offlineFallback(request);
    }
}

/**
 * Offline fallback page for navigation requests.
 */
async function offlineFallback(request) {
    if (request.mode === "navigate") {
        const cached = await caches.match("/offline.html");
        if (cached) return cached;
    }
    return new Response(JSON.stringify({ error: "Offline", cached: false }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
    });
}

// ─── Message Handler ──────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
    if (!event.data) return;

    if (event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }

    // Revalidate hot data when app comes to foreground
    if (event.data.type === "REVALIDATE") {
        const hotApis = [
            "/api/dashboard/hero",
            "/api/dashboard/streak",
            "/api/quests",
        ];
        caches.open(API_CACHE).then((cache) => {
            hotApis.forEach((url) => {
                fetch(url)
                    .then((res) => {
                        if (res.ok) cache.put(url, res);
                    })
                    .catch(() => {});
            });
        });
    }

    if (event.data.type === "CACHE_URLS") {
        caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.addAll(event.data.urls).catch(() => {});
        });
    }
});

// ─── Phase 18: Smart Notifications (HERALD) ────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "English Quest", body: event.data.text() };
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    
    // Rich notification features
    image: data.image || null,
    vibrate: data.vibrate || [100, 50, 100],

    // Action buttons (max 2)
    actions: buildActions(data.type),

    // Data for click handler
    data: {
      url: data.data?.url || '/',
      type: data.type,
      ...(data.data || {})
    },

    // iOS PWA behavior
    requireInteraction: data.type === 'streak_warning',
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "English Quest", options)
  );
});

// Action buttons mapping by type
function buildActions(type) {
  const actionMap = {
    'streak_warning': [
      { action: 'checkin', title: '✅ Check-in ngay' },
      { action: 'dismiss', title: 'Để sau' }
    ],
    'anki_reminder': [
      { action: 'open_anki', title: '📚 Review ngay' },
      { action: 'dismiss', title: 'Nhắc lại sau' }
    ],
    'quest_reminder': [
      { action: 'open_quests', title: '⚔️ Xem Quest' },
      { action: 'dismiss', title: 'OK' }
    ],
    'weekly_report': [
      { action: 'open_report', title: '📊 Xem báo cáo' },
    ],
    'level_up': [
      { action: 'open_home', title: '🏆 Xem Level mới' },
    ],
  };
  return actionMap[type] || [
    { action: "open", title: "Mở ứng dụng" }
  ];
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { url: defaultUrl, type } = event.notification.data || {};
  const action = event.action;

  // Map action to specific URL
  const actionUrls = {
    'checkin':      '/?action=checkin',
    'open_anki':    '/anki',
    'open_quests':  '/quests',
    'open_report':  '/analytics/weekly',
    'open_home':    '/',
    'open':         defaultUrl || '/',
    'dismiss':      null,   // explicitly null to not open app
  };

  // If action is specific, use mapped URL. If no action (clicked body), use defaultUrl
  const targetUrl = action ? actionUrls[action] : (defaultUrl || '/');
  
  if (!targetUrl) return; // dismissed

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // If app is already open, focus it and navigate
      const existing = windowClients.find(c => c.focused || c.visibilityState === 'visible') || windowClients[0];
      
      if (existing && 'focus' in existing) {
        existing.navigate(targetUrl);
        return existing.focus();
      } else if (clients.openWindow) {
        // App is closed, open it
        return clients.openWindow(targetUrl);
      }
    })
  );
});
