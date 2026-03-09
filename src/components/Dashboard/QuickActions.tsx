"use client";

import { BookOpen, Mic2, Swords, PenLine } from "lucide-react";
import Link from "next/link";

const QUICK_ACTIONS = [
    {
        href: "/anki",
        LucideIcon: BookOpen,
        label: "Anki",
        sub: "Review cards",
        color: "var(--cyan)",
    },
    {
        href: "/speak",
        LucideIcon: Mic2,
        label: "AI Speak",
        sub: "Practice talk",
        color: "var(--violet)",
    },
    {
        href: "/quests",
        LucideIcon: Swords,
        label: "Quests",
        sub: "Daily missions",
        color: "var(--gold)",
    },
    {
        href: "/journal",
        LucideIcon: PenLine,
        label: "Journal",
        sub: "Write & reflect",
        color: "var(--emerald)",
    },
] as const;

export function QuickActions() {
    return (
        <div
            className="dark-card animate-fade-in-up stagger-3"
            style={{ padding: "16px", marginBottom: "12px" }}
        >
            <h3
                style={{
                    margin: "0 0 14px 0",
                    fontFamily: "var(--font-display)",
                    fontSize: "15px",
                    fontWeight: 700,
                }}
            >
                Quick Actions
            </h3>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px",
                }}
            >
                {QUICK_ACTIONS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="glass-card-hover"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            padding: "14px",
                            textDecoration: "none",
                        }}
                    >
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: "10px",
                                background: "var(--bg-raised)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <item.LucideIcon
                                size={18}
                                color={item.color}
                                strokeWidth={2}
                            />
                        </div>
                        <div>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    fontFamily: "var(--font-display)",
                                }}
                            >
                                {item.label}
                            </p>
                            <p
                                style={{
                                    margin: "2px 0 0",
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                {item.sub}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
