"use client";

import { HeatmapCell, SectionLabel, AnalyticsCard } from "./shared";

interface Props {
    heatmapWeeks: { date: string; min: number }[][];
}

export function ActivityHeatmap({ heatmapWeeks }: Props) {
    return (
        <AnalyticsCard style={{ marginBottom: 12 }}>
            <SectionLabel text="Activity — 90 Days" />
            <div
                style={{
                    display: "flex",
                    gap: 3,
                    overflowX: "auto",
                    paddingBottom: 4,
                }}
            >
                {heatmapWeeks.map((week, wi) => (
                    <div
                        key={wi}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                        }}
                    >
                        {week.map((cell) => (
                            <HeatmapCell
                                key={cell.date}
                                date={cell.date}
                                min={cell.min}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 8,
                    justifyContent: "flex-end",
                }}
            >
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    Less
                </span>
                {[0, 1, 2, 3, 4].map((l) => (
                    <div
                        key={l}
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background:
                                l === 0
                                    ? "var(--bg-elevated)"
                                    : `rgba(245,200,66,${l * 0.25})`,
                        }}
                    />
                ))}
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    More
                </span>
            </div>
        </AnalyticsCard>
    );
}
