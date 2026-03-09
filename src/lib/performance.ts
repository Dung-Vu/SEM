/**
 * Performance monitoring — Web Vitals tracking.
 * Logs metrics to console in development, can be extended for analytics.
 */

import { onCLS, onFCP, onLCP, onTTFB } from "web-vitals";
import type { Metric } from "web-vitals";

function reportMetric(metric: Metric) {
    if (process.env.NODE_ENV === "development") {
        const color =
            metric.rating === "good"
                ? "#34d399"
                : metric.rating === "needs-improvement"
                  ? "#f5a623"
                  : "#f87171";

        console.log(
            `%c[Perf] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`,
            `color: ${color}; font-weight: bold;`,
        );
    }
}

export function initPerformanceMonitoring() {
    onLCP(reportMetric); // Largest Contentful Paint (target: < 2.5s)
    onCLS(reportMetric); // Cumulative Layout Shift (target: < 0.1)
    onFCP(reportMetric); // First Contentful Paint (target: < 1.8s)
    onTTFB(reportMetric); // Time to First Byte (target: < 800ms)
}

/**
 * Track slow API calls — warn if > 3s
 */
export function trackApiTime(endpoint: string, durationMs: number) {
    if (process.env.NODE_ENV === "development" && durationMs > 3000) {
        console.warn(`[Slow API] ${endpoint}: ${durationMs}ms`);
    }
}
