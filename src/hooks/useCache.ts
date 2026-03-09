"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchWithCache, invalidate, isFresh } from "@/lib/cache";

interface UseCacheOptions {
    /** ms before data is considered stale. Default: 30s */
    staleTime?: number;
    /** Re-fetch when window regains focus? Default: true */
    revalidateOnFocus?: boolean;
    /** Skip fetching (useful for conditional hooks). Default: false */
    skip?: boolean;
}

interface UseCacheResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    /** Force a fresh fetch, ignoring cache */
    refresh: () => Promise<void>;
    /** Optimistically update local state (server update must be done separately) */
    mutate: (updater: (prev: T | null) => T) => void;
}

/**
 * 17.4 — useCache hook
 * Stale-while-revalidate data fetching with focus revalidation.
 *
 * Bug fixes vs v1:
 * - loading always resets to false after SWR path (was stuck on true)
 * - fetcherRef avoids stale closure without adding fetcher to useEffect deps
 * - mountedRef reset happens BEFORE the async call (not after)
 */
export function useCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: UseCacheOptions = {},
): UseCacheResult<T> {
    const {
        staleTime = 30_000,
        revalidateOnFocus = true,
        skip = false,
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState<Error | null>(null);

    // Keep latest fetcher without triggering effect re-runs
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const mountedRef = useRef(false);

    const load = useCallback(
        async (force = false) => {
            if (skip) return;
            setError(null);

            if (force) {
                invalidate(key);
                setLoading(true);
            }

            try {
                const { data: result } = await fetchWithCache<T>(
                    key,
                    () => fetcherRef.current(),
                    staleTime,
                );

                if (!mountedRef.current) return;
                setData(result);
                // BUG FIX: always clear loading after any successful fetch
                setLoading(false);
            } catch (err) {
                if (!mountedRef.current) return;
                setError(err instanceof Error ? err : new Error(String(err)));
                setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [key, staleTime, skip],
    );

    // Initial fetch — reset state when key changes
    useEffect(() => {
        if (skip) {
            setLoading(false);
            return;
        }
        mountedRef.current = true;
        setLoading(true);
        setData(null);
        setError(null);
        load();
        return () => {
            mountedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    // Focus revalidation — refresh stale data when user returns to tab
    useEffect(() => {
        if (!revalidateOnFocus || skip) return;

        const revalidateIfStale = () => {
            if (!isFresh(key)) load();
        };

        const handleVisibility = () => {
            if (!document.hidden) revalidateIfStale();
        };

        window.addEventListener("focus", revalidateIfStale);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            window.removeEventListener("focus", revalidateIfStale);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [key, revalidateOnFocus, skip, load]);

    const refresh = useCallback(async () => {
        await load(true);
    }, [load]);

    const mutate = useCallback((updater: (prev: T | null) => T) => {
        setData((prev) => updater(prev));
    }, []);

    return { data, loading, error, refresh, mutate };
}
