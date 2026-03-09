"use client";

import type { LearningProfile } from "./types";

interface Props {
    profile: LearningProfile;
    overallScore: number;
    currentCEFR: string;
    weeklyExp: number;
}

export function OverallScoreBanner({
    profile,
    overallScore,
    currentCEFR,
    weeklyExp,
}: Props) {
    return (
        <div
            style={{
                background: "var(--bg-raised)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "16px",
                marginBottom: 12,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Gold score badge */}
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background:
                            "linear-gradient(135deg, var(--gold), rgba(245,200,66,0.4))",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: "var(--bg-void)",
                            fontFamily: "var(--font-display)",
                            lineHeight: 1,
                        }}
                    >
                        {overallScore}
                    </span>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "var(--bg-void)",
                            letterSpacing: "0.1em",
                        }}
                    >
                        AVG
                    </span>
                </div>

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
                        Level {currentCEFR}
                    </p>
                    <p
                        style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            margin: "0 0 6px",
                        }}
                    >
                        {weeklyExp} EXP this week · {profile.consistencyScore}%
                        consistency
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                        <span
                            style={{
                                fontSize: 10,
                                background: "rgba(255,255,255,0.06)",
                                padding: "2px 8px",
                                borderRadius: 20,
                                color: "var(--emerald)",
                                fontWeight: 600,
                            }}
                        >
                            Best: {profile.strongestSkill}
                        </span>
                        <span
                            style={{
                                fontSize: 10,
                                background: "rgba(255,255,255,0.06)",
                                padding: "2px 8px",
                                borderRadius: 20,
                                color: "var(--ruby)",
                                fontWeight: 600,
                            }}
                        >
                            Focus: {profile.weakestSkill}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
