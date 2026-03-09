"use client";

import { SeverityDot, SectionLabel, AnalyticsCard } from "./shared";
import type { Weakness } from "./types";

interface Props {
    weaknesses: Weakness[];
}

export function WeaknessPanel({ weaknesses }: Props) {
    if (weaknesses.length === 0) return null;

    const borderByLevel = {
        high: "rgba(248,113,113,0.2)",
        medium: "rgba(251,191,36,0.2)",
        low: "rgba(52,211,153,0.15)",
    };
    const bgByLevel = {
        high: "rgba(248,113,113,0.15)",
        medium: "rgba(251,191,36,0.15)",
        low: "rgba(52,211,153,0.12)",
    };
    const colorByLevel = {
        high: "var(--ruby)",
        medium: "var(--amber)",
        low: "var(--emerald)",
    };

    return (
        <AnalyticsCard style={{ marginBottom: 12 }}>
            <SectionLabel text="⚠️ Focus Areas" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {weaknesses.map((w, i) => (
                    <div
                        key={i}
                        style={{
                            padding: "12px",
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 10,
                            border: `1px solid ${borderByLevel[w.severity]}`,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 5,
                            }}
                        >
                            <SeverityDot sev={w.severity} />
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                }}
                            >
                                {w.skill}
                            </span>
                            <span
                                style={{
                                    fontSize: 9,
                                    padding: "1px 6px",
                                    borderRadius: 20,
                                    fontWeight: 700,
                                    marginLeft: "auto",
                                    background: bgByLevel[w.severity],
                                    color: colorByLevel[w.severity],
                                }}
                            >
                                {w.severity.toUpperCase()}
                            </span>
                        </div>
                        <p
                            style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                                margin: "0 0 5px",
                            }}
                        >
                            {w.evidence}
                        </p>
                        <p
                            style={{
                                fontSize: 11,
                                color: "var(--cyan)",
                                margin: 0,
                                fontStyle: "italic",
                            }}
                        >
                            → {w.recommendation}
                        </p>
                    </div>
                ))}
            </div>
        </AnalyticsCard>
    );
}
