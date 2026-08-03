"use client";

// Lazy-loaded wrappers for the heavy Recharts visualisations. These wrappers
// code-split the bundling so /, /speak, /anki, /writing, etc. do not pull
// Recharts (~200KB gz) into their initial bundle. They kick off `next/dynamic`
// with `ssr: false` to avoid hydration issues with `ResponsiveContainer`.

import dynamic from "next/dynamic";

const chartLoading = () => (
    <div
        aria-hidden="true"
        style={{
            height: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
        }}
    >
        Loading chart…
    </div>
);

export const VelocityLineChart = dynamic(
    () => import("./VelocityLineChart").then((m) => m.VelocityLineChart),
    { ssr: false, loading: chartLoading },
);

export const ActivityBarChart = dynamic(
    () => import("./ActivityBarChart").then((m) => m.ActivityBarChart),
    { ssr: false, loading: chartLoading },
);

export const SkillRadarConsistency = dynamic(
    () => import("./SkillRadarConsistency").then((m) => m.SkillRadarConsistency),
    { ssr: false, loading: chartLoading },
);

export const ActivityHeatmap = dynamic(
    () => import("./ActivityHeatmap").then((m) => m.ActivityHeatmap),
    { ssr: false, loading: chartLoading },
);
