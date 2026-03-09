"use client";

import { TrendingUp } from "lucide-react";
import { AnalyticsCard, SectionLabel } from "./shared";
import type { Prediction } from "./types";

interface Props {
    prediction: Prediction;
}

export function PredictionCard({ prediction }: Props) {
    return (
        <AnalyticsCard style={{ marginBottom: 12 }}>
            <SectionLabel text="Dự đoán tiến độ" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {prediction.message && (
                    <p
                        style={{
                            fontSize: 13,
                            color: "var(--text-primary)",
                            lineHeight: 1.6,
                            margin: 0,
                            fontWeight: 500,
                        }}
                    >
                        {prediction.message}
                    </p>
                )}
                {prediction.weeksNeeded != null && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            background: "rgba(245,200,66,0.08)",
                            borderRadius: 10,
                            border: "1px solid rgba(245,200,66,0.2)",
                        }}
                    >
                        <TrendingUp
                            size={16}
                            style={{ color: "var(--gold)", flexShrink: 0 }}
                        />
                        <div>
                            <span
                                style={{
                                    fontSize: 13,
                                    color: "var(--text-primary)",
                                    fontWeight: 600,
                                    display: "block",
                                }}
                            >
                                {prediction.weeksNeeded === 0
                                    ? "Bạn sắp đạt mục tiêu!"
                                    : `~${prediction.weeksNeeded} tuần để đạt ${prediction.targetScore}/100`}
                            </span>
                            {prediction.targetDate && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    Ước tính: {prediction.targetDate}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                <p
                    style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        margin: 0,
                        lineHeight: 1.5,
                        fontStyle: "italic",
                    }}
                >
                    * Dự đoán dựa trên tốc độ học 7 ngày gần nhất. Kết quả thực
                    tế có thể khác tùy thuộc vào tần suất học và độ khó nội
                    dung.
                </p>
            </div>
        </AnalyticsCard>
    );
}
