"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { SectionLabel, AnalyticsCard } from "./shared";

interface Props {
    barData: { day: string; min: number }[];
}

export function ActivityBarChart({ barData }: Props) {
    return (
        <AnalyticsCard style={{ marginBottom: 12 }}>
            <SectionLabel text="This Week — Activity (minutes)" />
            <ResponsiveContainer width="100%" height={100}>
                <BarChart
                    data={barData}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                    <XAxis
                        dataKey="day"
                        tick={{ fill: "var(--text-muted)", fontSize: 10 }}
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
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    />
                    <Bar
                        dataKey="min"
                        fill="var(--gold)"
                        radius={[3, 3, 0, 0]}
                        fillOpacity={0.85}
                    />
                </BarChart>
            </ResponsiveContainer>
        </AnalyticsCard>
    );
}
