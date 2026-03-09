/**
 * 17.4 — Smart Data Cache
 * Lightweight in-memory stale-while-revalidate cache.
 * No external dependencies — replaces TanStack Query for our use case.
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    staleTime: number;
}

// In-memory store — survives page navigations within same session
const STORE = new Map<string, CacheEntry<unknown>>();

// Inflight promises to prevent duplicate fetches (request deduplication)
const INFLIGHT = new Map<string, Promise<unknown>>();

/**
 * Read a cache entry. Returns null if missing or expired past gcTime.
 */
export function getCached<T>(key: string): T | null {
    const entry = STORE.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    // GC after 5× staleTime (max 10min)
    const gcTime = Math.min(entry.staleTime * 5, 10 * 60_000);
    if (age > gcTime) {
        STORE.delete(key);
        return null;
    }
    return entry.data;
}

/**
 * Check if a cache entry is fresh (within staleTime).
 */
export function isFresh(key: string): boolean {
    const entry = STORE.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < entry.staleTime;
}

/**
 * Store data in cache.
 */
export function setCached<T>(key: string, data: T, staleTime: number): void {
    STORE.set(key, { data, timestamp: Date.now(), staleTime });
}

/**
 * Invalidate a cache entry (e.g. after mutation).
 */
export function invalidate(key: string): void {
    STORE.delete(key);
}

/**
 * Invalidate multiple keys (glob-style prefix match).
 */
export function invalidatePrefix(prefix: string): void {
    for (const key of STORE.keys()) {
        if (key.startsWith(prefix)) STORE.delete(key);
    }
}

/**
 * Fetch with cache — stale-while-revalidate pattern.
 * Returns cached data immediately (even if stale), then revalidates in background.
 *
 * @param key      — cache key
 * @param fetcher  — async function that fetches fresh data
 * @param staleTime — ms before data is considered stale (triggers background refetch)
 */
export async function fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    staleTime: number,
): Promise<{ data: T; fromCache: boolean }> {
    const cached = getCached<T>(key);
    const fresh = isFresh(key);

    if (cached && fresh) {
        return { data: cached, fromCache: true };
    }

    // Stale data exists — return it immediately but revalidate in background
    if (cached && !fresh) {
        // Don't await — fire and forget
        revalidate(key, fetcher, staleTime);
        return { data: cached, fromCache: true };
    }

    // No cache — must wait for fetch
    return { data: await revalidate(key, fetcher, staleTime), fromCache: false };
}

async function revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    staleTime: number,
): Promise<T> {
    // Request deduplication: if same key is already inflight, share the promise
    if (INFLIGHT.has(key)) {
        return INFLIGHT.get(key) as Promise<T>;
    }

    const promise = fetcher().then((data) => {
        setCached(key, data, staleTime);
        INFLIGHT.delete(key);
        return data;
    }).catch((err) => {
        INFLIGHT.delete(key);
        throw err;
    });

    INFLIGHT.set(key, promise);
    return promise;
}

/**
 * Stale times config — each endpoint type has its own TTL.
 */
export const STALE = {
    user:             30_000,       // 30s — streak/exp change often
    streak:           60_000,       // 1min
    hero:             30_000,       // 30s
    stats:            10 * 60_000,  // 10min — skill scores change slowly
    quests:           30_000,       // 30s — can complete any time
    ankiDue:          5 * 60_000,   // 5min — cards don't change mid-session
    speakModes:       30 * 60_000,  // 30min — static
    achievements:     60 * 60_000,  // 1hr
    prompts:          24 * 3600_000, // 24hr — almost static
} as const;
