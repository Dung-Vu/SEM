"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { SectionLabel, AnalyticsCard } from "./shared";

interface VelocityPoint {
    date: string;
    anki: number;
    journal: number;
    speak: number;
}

interface Props {
    velocityHistory: VelocityPoint[];
}

const LINES = [
    { key: "anki", label: "Anki", color: "var(--violet-bright)" },
    { key: "journal", label: "Journal", color: "var(--emerald-bright)" },
    { key: "speak", label: "Speak", color: "var(--cyan)" },
] as const;

export function VelocityLineChart({ velocityHistory }: Props) {
    if (!velocityHistory || velocityHistory.length === 0) return null;

    return (
        <AnalyticsCard style={{ marginBottom: 12 }}>
            <SectionLabel text="14-Day Activity Trend" />
            <ResponsiveContainer width="100%" height={100}>
                <LineChart
                    data={velocityHistory}
                    margin={{ top: 0, right: 0, left: -24, bottom: 0 }}
                >
                    <XAxis
                        dataKey="date"
                        tick={false}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "var(--bg-raised)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 8,
                            fontSize: 11,
                            color: "var(--text-primary)",
                        }}
                        cursor={{ stroke: "rgba(255,255,255,0.06)" }}
                    />
                    {LINES.map(({ key, label, color }) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            name={label}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                {LINES.map(({ label, color }) => (
                    <div
                        key={label}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        <div
                            style={{
                                width: 16,
                                height: 2,
                                background: color,
                                borderRadius: 1,
                            }}
                        />
                        <span
                            style={{ fontSize: 10, color: "var(--text-muted)" }}
                        >
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </AnalyticsCard>
    );
}
