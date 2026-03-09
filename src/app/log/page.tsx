"use client";

import { useEffect, useState, useCallback } from "react";
import {
    BookOpen,
    Swords,
    CalendarCheck,
    PenLine,
    Mic2,
    Headphones,
    BookMarked,
    Tv,
    Zap,
    ScrollText,
    Inbox,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ActivityLog {
    id: string;
    source: string;
    amount: number;
    description: string;
    createdAt: string;
}

const SOURCE_CFG: Record<string, { icon: LucideIcon; color: string }> = {
    anki: { icon: BookOpen, color: "var(--cyan)" },
    quest: { icon: Swords, color: "var(--gold)" },
    checkin: { icon: CalendarCheck, color: "var(--emerald)" },
    journal: { icon: PenLine, color: "var(--violet)" },
    speak: { icon: Mic2, color: "var(--violet)" },
    shadow: { icon: Headphones, color: "var(--ruby)" },
    reading: { icon: BookMarked, color: "var(--gold)" },
    resources: { icon: Tv, color: "var(--emerald)" },
    default: { icon: Zap, color: "var(--amber)" },
};

function getSource(src: string) {
    return SOURCE_CFG[src.toLowerCase()] ?? SOURCE_CFG.default;
}

function formatDate(dateStr: string) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [dailyTotals, setDailyTotals] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    const fetchActivity = useCallback(async () => {
        try {
            const res = await fetch("/api/activity");
            const data = await res.json();
            setLogs(data.logs || []);
            setDailyTotals(data.dailyTotals || {});
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    const grouped: Record<string, ActivityLog[]> = {};
    for (const log of logs) {
        const date = log.createdAt.slice(0, 10);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(log);
    }

    // Heatmap: last 90 days
    const heatmapDays: { date: string; exp: number }[] = [];
    for (let i = 89; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        heatmapDays.push({ date: dateStr, exp: dailyTotals[dateStr] || 0 });
    }
    const maxExp = Math.max(1, ...Object.values(dailyTotals));

    const getHeatColor = (exp: number) => {
        if (exp === 0) return "rgba(255,255,255,0.03)";
        const t = Math.min(1, exp / maxExp);
        if (t < 0.25) return "rgba(245,200,66,0.2)";
        if (t < 0.5) return "rgba(245,200,66,0.45)";
        if (t < 0.75) return "rgba(245,200,66,0.65)";
        return "var(--gold)";
    };

    const todayExp = dailyTotals[new Date().toISOString().slice(0, 10)] || 0;
    const totalDaysActive = Object.keys(dailyTotals).length;

    if (loading) {
        return (
            <div style={{ paddingTop: "8px" }}>
                <div
                    className="skeleton"
                    style={{ height: 80, borderRadius: 20, marginBottom: 10 }}
                />
                <div
                    className="skeleton"
                    style={{ height: 130, borderRadius: 20, marginBottom: 10 }}
                />
                <div
                    className="skeleton"
                    style={{ height: 200, borderRadius: 20 }}
                />
            </div>
        );
    }

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
            {/* Header */}
            <div
                className="animate-fade-in-up"
                style={{ marginBottom: "14px" }}
            >
                <h1
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "22px",
                        fontWeight: 800,
                        margin: "0 0 4px",
                    }}
                >
                    Activity Log
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        margin: 0,
                    }}
                >
                    Your learning journey, day by day
                </p>
            </div>

            {/* Stats */}
            <div
                className="animate-fade-in-up stagger-1"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "6px",
                    marginBottom: "12px",
                }}
            >
                {[
                    {
                        value: todayExp,
                        label: "Today EXP",
                        color: "var(--gold)",
                    },
                    {
                        value: logs.length,
                        label: "Activities",
                        color: "var(--emerald)",
                    },
                    {
                        value: totalDaysActive,
                        label: "Days Active",
                        color: "var(--cyan)",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="glass-card"
                        style={{ padding: "11px", textAlign: "center" }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "20px",
                                fontWeight: 600,
                                color: s.color,
                                margin: "0 0 3px",
                            }}
                        >
                            {s.value}
                        </p>
                        <p
                            style={{
                                fontSize: "9px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                                margin: 0,
                            }}
                        >
                            {s.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Heatmap */}
            <div
                className="glass-card animate-fade-in-up stagger-2"
                style={{ padding: "14px", marginBottom: "12px" }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "10px",
                    }}
                >
                    <div
                        style={{
                            width: 3,
                            height: 14,
                            borderRadius: 99,
                            background: "var(--gold)",
                        }}
                    />
                    <h3
                        style={{
                            margin: 0,
                            fontFamily: "var(--font-display)",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                        }}
                    >
                        90-Day EXP Heatmap
                    </h3>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(13, 1fr)",
                        gap: "3px",
                    }}
                >
                    {heatmapDays.map((day) => (
                        <div
                            key={day.date}
                            title={`${day.date}: ${day.exp} EXP`}
                            style={{
                                width: "100%",
                                aspectRatio: "1",
                                borderRadius: "3px",
                                background: getHeatColor(day.exp),
                            }}
                        />
                    ))}
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        marginTop: "8px",
                        justifyContent: "flex-end",
                    }}
                >
                    <span
                        style={{
                            fontSize: "9px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        Less
                    </span>
                    {[0, 20, 60, 120, 200].map((v) => (
                        <div
                            key={v}
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: "2px",
                                background: getHeatColor(v),
                            }}
                        />
                    ))}
                    <span
                        style={{
                            fontSize: "9px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        More
                    </span>
                </div>
            </div>

            {/* Activity Feed */}
            {logs.length === 0 ? (
                <div
                    className="glass-card"
                    style={{ padding: "40px 16px", textAlign: "center" }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "12px",
                        }}
                    >
                        <Inbox
                            size={40}
                            color="var(--text-muted)"
                            strokeWidth={1.5}
                        />
                    </div>
                    <h3
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "16px",
                            margin: "0 0 6px",
                        }}
                    >
                        No activity yet
                    </h3>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                            margin: 0,
                        }}
                    >
                        Complete quests, review Anki cards, or check in to start
                        your log!
                    </p>
                </div>
            ) : (
                Object.entries(grouped).map(([date, dayLogs]) => (
                    <div
                        key={date}
                        className="animate-fade-in-up"
                        style={{ marginBottom: "10px" }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0 4px",
                                marginBottom: "6px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "var(--text-secondary)",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                {formatDate(date)}
                            </span>
                            <span
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "var(--gold)",
                                }}
                            >
                                +{dayLogs.reduce((s, l) => s + l.amount, 0)} EXP
                            </span>
                        </div>
                        <div
                            className="glass-card"
                            style={{ overflow: "hidden" }}
                        >
                            {dayLogs.map((log, i) => {
                                const cfg = getSource(log.source);
                                return (
                                    <div
                                        key={log.id}
                                        style={{
                                            padding: "11px 14px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            borderTop:
                                                i > 0
                                                    ? "1px solid rgba(255,255,255,0.04)"
                                                    : "none",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                width: "20px",
                                            }}
                                        >
                                            <cfg.icon
                                                size={16}
                                                color={cfg.color}
                                                strokeWidth={2}
                                            />
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    margin: 0,
                                                    color: "var(--text-primary)",
                                                    fontFamily:
                                                        "var(--font-body)",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {log.description}
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: "10px",
                                                    color: "var(--text-muted)",
                                                    margin: "2px 0 0",
                                                    fontFamily:
                                                        "var(--font-body)",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontFamily:
                                                            "var(--font-mono)",
                                                    }}
                                                >
                                                    {new Date(
                                                        log.createdAt,
                                                    ).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>{" "}
                                                · {log.source}
                                            </p>
                                        </div>
                                        <span
                                            style={{
                                                fontFamily: "var(--font-mono)",
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                color: cfg.color,
                                                flexShrink: 0,
                                            }}
                                        >
                                            +{log.amount}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
