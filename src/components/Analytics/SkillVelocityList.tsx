"use client";

import { BookOpen, Mic2, PenLine, Headphones, Brain } from "lucide-react";
import { VelocityBadge, SectionLabel, AnalyticsCard } from "./shared";

const SKILL_META: Record<
    string,
    { icon: typeof BookOpen; label: string; color: string }
> = {
    vocab: { icon: BookOpen, label: "Vocab", color: "var(--violet-bright)" },
    speaking: { icon: Mic2, label: "Speaking", color: "var(--cyan)" },
    listening: { icon: Headphones, label: "Listening", color: "var(--amber)" },
    writing: {
        icon: PenLine,
        label: "Writing",
        color: "var(--emerald-bright)",
    },
    grammar: { icon: Brain, label: "Grammar", color: "var(--ruby-bright)" },
};

interface VelocityCard {
    key: string;
    score: number;
    v: number;
}

interface Props {
    velocityCards: VelocityCard[];
}

export function SkillVelocityList({ velocityCards }: Props) {
    return (
        <AnalyticsCard style={{ marginBottom: 12 }}>
            <SectionLabel text="Skill Velocity" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {velocityCards.map(({ key, score, v }) => {
                    const meta = SKILL_META[key];
                    const Icon = meta.icon;
                    return (
                        <div
                            key={key}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <Icon
                                size={14}
                                style={{ color: meta.color, flexShrink: 0 }}
                            />
                            <span
                                style={{
                                    fontSize: 12,
                                    color: "var(--text-secondary)",
                                    minWidth: 64,
                                }}
                            >
                                {meta.label}
                            </span>
                            <div
                                style={{
                                    flex: 1,
                                    height: 4,
                                    background: "rgba(255,255,255,0.06)",
                                    borderRadius: 2,
                                }}
                            >
                                <div
                                    style={{
                                        width: `${score}%`,
                                        height: 4,
                                        background: meta.color,
                                        borderRadius: 2,
                                        transition: "width 0.6s ease-out",
                                    }}
                                />
                            </div>
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    minWidth: 28,
                                    textAlign: "right",
                                }}
                            >
                                {score}
                            </span>
                            <VelocityBadge v={v} />
                        </div>
                    );
                })}
            </div>
        </AnalyticsCard>
    );
}
