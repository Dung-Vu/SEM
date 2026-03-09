"use client";

import {
    BarChart3,
    Trophy,
    CalendarDays,
    ScrollText,
    Calendar,
    Zap,
} from "lucide-react";
import Link from "next/link";

interface Props {
    daysSinceStart: number;
    totalExp: number;
}

const MORE_LINKS = [
    { href: "/progress", icon: BarChart3, label: "Progress" },
    { href: "/achievements", icon: Trophy, label: "Awards" },
    { href: "/review/monthly", icon: CalendarDays, label: "Monthly" },
    { href: "/log", icon: ScrollText, label: "Activity" },
] as const;

const STAT_ICONS = [Calendar, Zap] as const;

export function MoreLinks({ daysSinceStart, totalExp }: Props) {
    const cards = [
        {
            icon: STAT_ICONS[0],
            value: daysSinceStart.toLocaleString(),
            label: "Days Active",
            color: "var(--cyan)",
        },
        {
            icon: STAT_ICONS[1],
            value: totalExp.toLocaleString(),
            label: "Total EXP",
            color: "var(--gold)",
        },
    ];

    return (
        <>
            {/* Stats row */}
            <div
                className="animate-fade-in-up stagger-4"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    marginBottom: "12px",
                }}
            >
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="glass-card"
                        style={{ padding: "16px", textAlign: "center" }}
                    >
                        <div
                            style={{
                                marginBottom: "4px",
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <card.icon
                                size={22}
                                color={card.color}
                                strokeWidth={2}
                            />
                        </div>
                        <p
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "20px",
                                fontWeight: 600,
                                color: card.color,
                                margin: "0 0 2px",
                            }}
                        >
                            {card.value}
                        </p>
                        <p
                            style={{
                                fontSize: "10px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                                letterSpacing: "0.04em",
                            }}
                        >
                            {card.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* More links grid */}
            <div
                className="glass-card animate-fade-in-up stagger-5"
                style={{ padding: "14px 16px", marginBottom: "12px" }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "6px",
                    }}
                >
                    {MORE_LINKS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "4px",
                                padding: "10px 4px",
                                borderRadius: "12px",
                                background: "var(--bg-raised)",
                                textDecoration: "none",
                                color: "var(--text-secondary)",
                                fontSize: "10px",
                                fontWeight: 600,
                                fontFamily: "var(--font-body)",
                                letterSpacing: "0.02em",
                                border: "1px solid rgba(255,255,255,0.04)",
                            }}
                        >
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <item.icon
                                    size={20}
                                    color="currentColor"
                                    strokeWidth={2}
                                />
                            </span>
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}
