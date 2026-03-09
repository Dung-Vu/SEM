"use client";

import {
    BookOpen,
    Mic2,
    PenLine,
    Headphones,
    Flame,
    Swords,
    Trophy,
    Plus,
    Activity,
    Clock,
    CheckCircle2,
} from "lucide-react";
import { AnalyticsCard } from "./shared";
import type { StreamEvent } from "./types";

const ICON_MAP: Record<string, typeof Activity> = {
    BookOpen,
    Mic2,
    PenLine,
    Headphones,
    Flame,
    Swords,
    Trophy,
    Plus,
    Activity,
    Clock,
    CheckCircle2,
};

interface Props {
    stream: StreamEvent[];
}

export function ActivityStream({ stream }: Props) {
    if (stream.length === 0) return null;

    return (
        <AnalyticsCard style={{ marginBottom: 12 }}>
            <p
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-display)",
                    margin: "0 0 10px",
                }}
            >
                Recent Activity
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stream.map((ev) => {
                    const Icon = ICON_MAP[ev.icon] ?? Activity;
                    return (
                        <div
                            key={ev.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "8px 0",
                                borderBottom:
                                    "1px solid rgba(255,255,255,0.04)",
                            }}
                        >
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    background: "var(--bg-elevated)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Icon
                                    size={14}
                                    style={{ color: "var(--gold)" }}
                                />
                            </div>
                            <p
                                style={{
                                    flex: 1,
                                    fontSize: 12,
                                    color: "var(--text-secondary)",
                                    margin: 0,
                                }}
                            >
                                {ev.text}
                            </p>
                            <span
                                style={{
                                    fontSize: 10,
                                    color: "var(--text-muted)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {ev.time}
                            </span>
                        </div>
                    );
                })}
            </div>
        </AnalyticsCard>
    );
}
