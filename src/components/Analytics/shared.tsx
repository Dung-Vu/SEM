// Shared small UI pieces used by multiple Analytics components

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── VelocityBadge ────────────────────────────────────────────────────────

export function VelocityBadge({ v }: { v: number }) {
    if (v > 1)
        return (
            <span
                style={{
                    color: "var(--emerald)",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 11,
                }}
            >
                <TrendingUp size={11} /> +{v.toFixed(1)}/wk
            </span>
        );
    if (v < -1)
        return (
            <span
                style={{
                    color: "var(--ruby)",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 11,
                }}
            >
                <TrendingDown size={11} /> {v.toFixed(1)}/wk
            </span>
        );
    return (
        <span
            style={{
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
            }}
        >
            <Minus size={11} /> Stable
        </span>
    );
}

// ─── SeverityDot ──────────────────────────────────────────────────────────

export function SeverityDot({ sev }: { sev: "high" | "medium" | "low" }) {
    const colors = {
        high: "var(--ruby)",
        medium: "var(--amber)",
        low: "var(--emerald)",
    };
    return (
        <span
            style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: colors[sev],
                display: "inline-block",
                flexShrink: 0,
            }}
        />
    );
}

// ─── HeatmapCell ──────────────────────────────────────────────────────────

export function HeatmapCell({ min, date }: { min: number; date: string }) {
    let bg = "var(--bg-elevated)";
    if (min >= 60) bg = "var(--gold)";
    else if (min >= 30) bg = "rgba(245,200,66,0.7)";
    else if (min >= 15) bg = "rgba(245,200,66,0.4)";
    else if (min > 0) bg = "rgba(245,200,66,0.2)";

    return (
        <div
            title={`${date}: ${min} min`}
            style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: bg,
                cursor: "default",
                border: "1px solid rgba(255,255,255,0.05)",
                flexShrink: 0,
            }}
        />
    );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────

export function SectionLabel({ text }: { text: string }) {
    return (
        <p
            style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: 12,
                fontFamily: "var(--font-display)",
            }}
        >
            {text}
        </p>
    );
}

// ─── AnalyticsCard ────────────────────────────────────────────────────────

export function AnalyticsCard({
    children,
    style,
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <div
            style={{
                background: "var(--bg-raised)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "16px",
                ...style,
            }}
        >
            {children}
        </div>
    );
}
