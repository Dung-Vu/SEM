"use client";

import { useEffect } from "react";

export function PerformanceMonitor() {
    useEffect(() => {
        // Lazy-load web-vitals to avoid increasing bundle size
        import("@/lib/performance").then(({ initPerformanceMonitoring }) => {
            initPerformanceMonitoring();
        });
    }, []);

    return null;
}
