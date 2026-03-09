"use client";

import { Loader2, Sparkles } from "lucide-react";
import { AnalyticsCard } from "./shared";
import type { Insight } from "./types";

interface Props {
    insights: Insight[];
    generating: boolean;
    onRefresh: () => void;
}

export function AIInsightList({ insights, generating, onRefresh }: Props) {
    if (insights.length === 0) return null;

    return (
        <AnalyticsCard style={{ marginBottom: 12 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <p
                    style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        fontFamily: "var(--font-display)",
                        margin: 0,
                    }}
                >
                    AI Insights
                </p>
                <button
                    onClick={onRefresh}
                    disabled={generating}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "none",
                        border: "none",
                        color: "var(--gold)",
                        fontSize: 11,
                        cursor: "pointer",
                        padding: 0,
                    }}
                >
                    {generating ? (
                        <Loader2
                            size={12}
                            style={{ animation: "spin 1s linear infinite" }}
                        />
                    ) : (
                        <Sparkles size={12} />
                    )}
                    Refresh
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {insights.slice(0, 3).map((ins) => (
                    <div
                        key={ins.id}
                        style={{
                            padding: "12px",
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <p
                            style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: "var(--gold)",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                margin: "0 0 6px",
                            }}
                        >
                            {ins.type.replace("_", " ")}
                        </p>
                        <p
                            style={{
                                fontSize: 12,
                                color: "var(--text-secondary)",
                                margin: 0,
                                lineHeight: 1.6,
                            }}
                        >
                            {ins.content}
                        </p>
                    </div>
                ))}
            </div>
        </AnalyticsCard>
    );
}
