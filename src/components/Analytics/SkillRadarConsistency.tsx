"use client";

import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    ResponsiveContainer,
} from "recharts";
import { SectionLabel, AnalyticsCard } from "./shared";
import type { LearningProfile } from "./types";

interface Props {
    profile: LearningProfile;
    radarData: { skill: string; value: number; fullMark: number }[];
}

export function SkillRadarConsistency({ profile, radarData }: Props) {
    return (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            {/* Radar Chart */}
            <AnalyticsCard style={{ flex: 1, minWidth: 0 }}>
                <SectionLabel text="Skill Radar" />
                <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis
                            dataKey="skill"
                            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                        />
                        <Radar
                            dataKey="value"
                            stroke="var(--gold)"
                            fill="var(--gold)"
                            fillOpacity={0.18}
                            strokeWidth={2}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </AnalyticsCard>

            {/* Consistency + Retention */}
            <AnalyticsCard style={{ width: 140, flexShrink: 0 }}>
                <SectionLabel text="Consistency" />
                <div style={{ textAlign: "center" }}>
                    {/* Conic-gradient donut */}
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            margin: "0 auto 8px",
                            background: `conic-gradient(var(--emerald) ${profile.consistencyScore}%, rgba(255,255,255,0.06) 0)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                width: 54,
                                height: 54,
                                borderRadius: "50%",
                                background: "var(--bg-raised)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: "var(--text-primary)",
                                    fontFamily: "var(--font-display)",
                                }}
                            >
                                {profile.consistencyScore}%
                            </span>
                        </div>
                    </div>
                    <p
                        style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            margin: 0,
                        }}
                    >
                        Retention
                    </p>
                    <p
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--gold)",
                            margin: "4px 0 0",
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        {profile.ankiRetentionRate.toFixed(0)}%
                    </p>
                    <p
                        style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
                            margin: 0,
                        }}
                    >
                        Anki Retention
                    </p>
                </div>
            </AnalyticsCard>
        </div>
    );
}
