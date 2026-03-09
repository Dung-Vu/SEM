"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    TrendingUp,
    Trophy,
    BarChart3,
    AlertTriangle,
    Loader2,
} from "lucide-react";

interface HistoryData {
    totalExams: number;
    avgScore: number;
    bestScore: number;
    sectionPerformance: { section: string; avg: number }[];
    topWeakTopics: { topic: string; count: number }[];
    scoreTrend: { date: string; score: number; level: string }[];
    recentExams: {
        id: string;
        totalScore: number;
        level: string;
        mode: string;
        timeSpent: number | null;
        isPersonalBest: boolean;
        createdAt: string;
    }[];
}

export default function ExamHistoryPage() {
    const [data, setData] = useState<HistoryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void fetch("/api/exam/history")
            .then((r) => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ paddingTop: 8 }}>
                <div
                    className="skeleton"
                    style={{
                        width: 140,
                        height: 24,
                        marginBottom: 16,
                        borderRadius: 8,
                    }}
                />
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 10,
                        marginBottom: 16,
                    }}
                >
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="skeleton"
                            style={{ height: 64, borderRadius: 12 }}
                        />
                    ))}
                </div>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="skeleton"
                        style={{
                            width: "100%",
                            height: 60,
                            borderRadius: 12,
                            marginBottom: 8,
                        }}
                    />
                ))}
            </div>
        );
    }

    if (!data || data.totalExams === 0) {
        return (
            <div style={{ paddingTop: 8 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 16,
                    }}
                >
                    <Link href="/exam" style={{ color: "var(--text-muted)" }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <h1
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 18,
                            fontWeight: 800,
                            margin: 0,
                        }}
                    >
                        📜 Lịch sử thi
                    </h1>
                </div>
                <div style={{ textAlign: "center", paddingTop: 80 }}>
                    <p style={{ fontSize: 40, marginBottom: 8 }}>📝</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        Chưa có bài thi nào
                    </p>
                    <Link
                        href="/exam"
                        style={{
                            color: "var(--gold)",
                            fontSize: 13,
                            textDecoration: "none",
                            fontWeight: 600,
                        }}
                    >
                        Bắt đầu thi →
                    </Link>
                </div>
            </div>
        );
    }

    const card = (children: React.ReactNode) => (
        <div
            style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
            }}
        >
            {children}
        </div>
    );

    const sectionTrend = (avg: number) => {
        if (avg >= 80)
            return { icon: "↑", color: "var(--emerald)", label: "strong" };
        if (avg >= 60)
            return { icon: "→", color: "var(--gold)", label: "stable" };
        return { icon: "↓", color: "var(--ruby)", label: "weak" };
    };

    return (
        <div
            style={{ paddingTop: 8, paddingBottom: 16 }}
            className="animate-fade-in-up"
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                }}
            >
                <Link href="/exam" style={{ color: "var(--text-muted)" }}>
                    <ArrowLeft size={18} />
                </Link>
                <h1
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 18,
                        fontWeight: 800,
                        margin: 0,
                    }}
                >
                    📜 Lịch sử thi
                </h1>
            </div>

            {/* Score Trend */}
            {data.scoreTrend.length >= 2 &&
                card(
                    <>
                        <p
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                margin: "0 0 10px",
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            Score Trend
                        </p>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: 4,
                                height: 60,
                            }}
                        >
                            {data.scoreTrend.map((p, i) => (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        background: `linear-gradient(to top, ${p.score >= 80 ? "var(--emerald)" : p.score >= 60 ? "var(--gold)" : "var(--ruby)"}, transparent)`,
                                        height: `${p.score}%`,
                                        borderRadius: "4px 4px 0 0",
                                        minHeight: 4,
                                        position: "relative",
                                    }}
                                    title={`${p.date}: ${p.score}`}
                                >
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: -14,
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            fontSize: 8,
                                            color: "var(--text-muted)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {p.score}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>,
                )}

            {/* Overview Stats */}
            {card(
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 12,
                        textAlign: "center",
                    }}
                >
                    <div>
                        <p
                            style={{
                                fontSize: 20,
                                fontWeight: 800,
                                color: "var(--gold)",
                                margin: 0,
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            {data.totalExams}
                        </p>
                        <p
                            style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                margin: 0,
                            }}
                        >
                            Bài thi
                        </p>
                    </div>
                    <div>
                        <p
                            style={{
                                fontSize: 20,
                                fontWeight: 800,
                                color: "var(--cyan)",
                                margin: 0,
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            {data.avgScore}
                        </p>
                        <p
                            style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                margin: 0,
                            }}
                        >
                            Trung bình
                        </p>
                    </div>
                    <div>
                        <p
                            style={{
                                fontSize: 20,
                                fontWeight: 800,
                                color: "var(--emerald)",
                                margin: 0,
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            {data.bestScore}
                        </p>
                        <p
                            style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                margin: 0,
                            }}
                        >
                            Best
                        </p>
                    </div>
                </div>,
            )}

            {/* Section Performance */}
            {data.sectionPerformance.length > 0 &&
                card(
                    <>
                        <p
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                margin: "0 0 10px",
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            Section Performance
                        </p>
                        {data.sectionPerformance.map((s) => {
                            const trend = sectionTrend(s.avg);
                            return (
                                <div
                                    key={s.section}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "6px 0",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: "var(--text-primary)",
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {s.section}
                                    </span>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: "var(--text-primary)",
                                                fontFamily: "var(--font-mono)",
                                            }}
                                        >
                                            avg {s.avg}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: trend.color,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {trend.icon} {trend.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </>,
                )}

            {/* Weak Topics */}
            {data.topWeakTopics.length > 0 &&
                card(
                    <>
                        <p
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                margin: "0 0 10px",
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            <AlertTriangle
                                size={10}
                                style={{
                                    verticalAlign: "middle",
                                    marginRight: 4,
                                }}
                            />
                            Weak Topics
                        </p>
                        {data.topWeakTopics.map((t) => (
                            <div
                                key={t.topic}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "5px 0",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "var(--text-secondary)",
                                        textTransform: "capitalize",
                                    }}
                                >
                                    {t.topic}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: "var(--ruby)",
                                        fontWeight: 600,
                                        fontFamily: "var(--font-mono)",
                                    }}
                                >
                                    ×{t.count} sai
                                </span>
                            </div>
                        ))}
                    </>,
                )}

            {/* Recent Exams */}
            <p
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    margin: "16px 0 8px",
                    fontFamily: "var(--font-display)",
                }}
            >
                RECENT EXAMS
            </p>
            {data.recentExams.map((e) => {
                const scoreCol =
                    e.totalScore >= 80
                        ? "var(--emerald)"
                        : e.totalScore >= 60
                          ? "var(--gold)"
                          : "var(--ruby)";
                const ago = getRelativeTime(e.createdAt);
                return (
                    <Link
                        key={e.id}
                        href={`/exam/result/${e.id}`}
                        style={{ textDecoration: "none" }}
                    >
                        <div
                            style={{
                                background: "var(--bg-elevated)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: 12,
                                padding: "12px 14px",
                                marginBottom: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    {e.mode === "full"
                                        ? "Full"
                                        : e.mode === "quick"
                                          ? "Quick"
                                          : "Section"}{" "}
                                    {e.level}
                                    {e.isPersonalBest && (
                                        <Trophy
                                            size={12}
                                            color="var(--gold)"
                                            fill="var(--gold)"
                                            style={{
                                                marginLeft: 4,
                                                verticalAlign: "middle",
                                            }}
                                        />
                                    )}
                                </span>
                                <p
                                    style={{
                                        fontSize: 10,
                                        color: "var(--text-muted)",
                                        margin: "2px 0 0",
                                    }}
                                >
                                    {ago}
                                </p>
                            </div>
                            <span
                                style={{
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: scoreCol,
                                    fontFamily: "var(--font-display)",
                                }}
                            >
                                {e.totalScore}
                            </span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

function getRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return `${Math.floor(days / 7)} tuần trước`;
}
