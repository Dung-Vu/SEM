"use client";

import { AnalyticsCard, SectionLabel } from "./shared";
import type { Prediction } from "./types";

interface Props {
    prediction: Prediction;
}

export function LevelPredictionCard({ prediction }: Props) {
    return (
        <AnalyticsCard style={{ marginBottom: 12 }}>
            <SectionLabel text="Level Prediction" />
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <div>
                    <p
                        style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-display)",
                            margin: "0 0 2px",
                        }}
                    >
                        {prediction.currentScore}/100
                    </p>
                    <p
                        style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            margin: 0,
                        }}
                    >
                        Overall · targeting {prediction.targetScore}pts
                    </p>
                </div>
                {prediction.possible && prediction.weeksNeeded && (
                    <div style={{ textAlign: "right" }}>
                        <p
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--gold)",
                                margin: "0 0 2px",
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            ~{prediction.weeksNeeded}w
                        </p>
                        <p
                            style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                margin: 0,
                            }}
                        >
                            {prediction.targetDate
                                ? new Date(
                                      prediction.targetDate,
                                  ).toLocaleDateString("vi-VN", {
                                      day: "numeric",
                                      month: "short",
                                  })
                                : ""}
                        </p>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            <div
                style={{
                    height: 6,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 3,
                    overflow: "hidden",
                    marginBottom: 10,
                }}
            >
                <div
                    style={{
                        width: `${(prediction.currentScore / prediction.targetScore) * 100}%`,
                        maxWidth: "100%",
                        height: 6,
                        background:
                            "linear-gradient(90deg, var(--gold), var(--amber))",
                        borderRadius: 3,
                        transition: "width 0.8s ease-out",
                    }}
                />
            </div>
            <p
                style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    margin: 0,
                    lineHeight: 1.5,
                }}
            >
                {prediction.message}
            </p>
        </AnalyticsCard>
    );
}
