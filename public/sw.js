const CACHE_NAME = "eq-v2";
const STATIC_CACHE = "eq-static-v2";
const DYNAMIC_CACHE = "eq-dynamic-v2";

// Static assets to cache immediately
const STATIC_ASSETS = [
    "/",
    "/manifest.json",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
    console.log("[SW] Installing...");
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => {
                console.log("[SW] Caching static assets");
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting()),
    );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
    console.log("[SW] Activating...");
    event.waitUntil(
        caches
            .keys()
            .then((keys) => {
                return Promise.all(
                    keys
                        .filter(
                            (key) =>
                                key !== STATIC_CACHE && key !== DYNAMIC_CACHE,
                        )
                        .map((key) => {
                            console.log("[SW] Deleting old cache:", key);
                            return caches.delete(key);
                        }),
                );
            })
            .then(() => self.clients.claim()),
    );
});

// Fetch: Network first, fallback to cache
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET requests
    if (request.method !== "GET") return;

    // Skip non-http(s) requests
    if (!url.protocol.startsWith("http")) return;

    // Skip external requests
    if (url.origin !== location.origin) return;

    event.respondWith(
        caches.open(DYNAMIC_CACHE).then(async (dynamicCache) => {
            try {
                // Try network first
                const networkResponse = await fetch(request);

                // Cache successful responses
                if (networkResponse.ok) {
                    dynamicCache.put(request, networkResponse.clone());
                }

                return networkResponse;
            } catch (error) {
                // Network failed, try cache
                console.log("[SW] Network failed, trying cache:", request.url);
                const cachedResponse = await caches.match(request);

                if (cachedResponse) {
                    return cachedResponse;
                }

                // Offline fallback for navigation requests
                if (request.mode === "navigate") {
                    const fallback = await caches.match("/");
                    if (fallback) return fallback;
                }

                // Return error response
                return new Response("Offline - Content not cached", {
                    status: 503,
                    statusText: "Service Unavailable",
                });
            }
        }),
    );
});

// Handle messages from app
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }

    if (event.data && event.data.type === "CACHE_URLS") {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.addAll(event.data.urls);
            }),
        );
    }
});

// ─── Phase 12.5: Web Push Notification Handlers ────────────────────────────

// Receive push from server → show notification
self.addEventListener("push", (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: "English Quest", body: event.data.text() };
    }

    const options = {
        body: data.body || "Time to keep your streak alive! 🔥",
        icon: data.icon || "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: data.tag || "eq-reminder",
        data: { url: data.url || "/" },
        requireInteraction: false,
        actions: [
            { action: "open", title: "📚 Study Now" },
            { action: "dismiss", title: "Later" },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title || "English Quest",
            options,
        ),
    );
});

// User clicked notification → open or focus app
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    if (event.action === "dismiss") return;

    const url = event.notification.data?.url || "/";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (
                        client.url.includes(self.location.origin) &&
                        "focus" in client
                    ) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(url);
            }),
    );
});
