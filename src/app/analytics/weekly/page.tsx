"use client";

import { useEffect, useState, useCallback } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Loader2,
    Trophy,
    Target,
    ArrowLeft,
    Sparkles,
    CalendarDays,
    Clock,
    Flame,
} from "lucide-react";
import Link from "next/link";

interface SkillStat {
    skill: string;
    sessionsCount: number;
    scoreChange: number;
    trend: "up" | "down" | "stable";
}

interface WeeklyReportData {
    weekNumber: number;
    year: number;
    period: string;
    totalStudyMinutes: number;
    totalExp: number;
    questCompletionRate: number;
    summary: string;
    topRecommendation: string;
    bestDay: string;
    topAchievement: string;
    biggestImprovement: string;
    skillStats: SkillStat[];
    vsLastWeek: { studyTime: number; exp: number; consistency: number };
    isRead: boolean;
    createdAt: string;
}

function TrendBadge({
    trend,
    change,
}: {
    trend: "up" | "down" | "stable";
    change: number;
}) {
    if (trend === "up")
        return (
            <span
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    color: "var(--emerald)",
                    fontSize: 12,
                    fontWeight: 700,
                }}
            >
                <TrendingUp size={12} /> +{change}
            </span>
        );
    if (trend === "down")
        return (
            <span
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    color: "var(--ruby)",
                    fontSize: 12,
                    fontWeight: 700,
                }}
            >
                <TrendingDown size={12} /> {change}
            </span>
        );
    return (
        <span
            style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                color: "var(--text-muted)",
                fontSize: 12,
            }}
        >
            <Minus size={12} /> Stable
        </span>
    );
}

export default function WeeklyReportPage() {
    const [report, setReport] = useState<WeeklyReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchReport = useCallback(async () => {
        try {
            const res = await fetch("/api/analytics/weekly-report");
            const json = await res.json();
            if (json.report) {
                setReport(json.report);
                // Mark as read — clears unread badge in analytics overview
                void fetch("/api/analytics/weekly-report", { method: "PATCH" });
            } else setError(true);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const card = (content: React.ReactNode, style?: React.CSSProperties) => (
        <div
            style={{
                background: "var(--bg-raised)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 16,
                ...style,
            }}
        >
            {content}
        </div>
    );

    const sl = (text: string) => (
        <p
            style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: 12,
                fontFamily: "var(--font-display)",
            }}
        >
            {text}
        </p>
    );

    if (loading)
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                }}
            >
                <Loader2
                    size={28}
                    style={{
                        color: "var(--gold)",
                        animation: "spin 1s linear infinite",
                    }}
                />
            </div>
        );

    if (error || !report)
        return (
            <div style={{ padding: 24, textAlign: "center" }}>
                <CalendarDays
                    size={40}
                    style={{ color: "var(--text-muted)", marginBottom: 12 }}
                />
                <p style={{ color: "var(--text-secondary)", marginBottom: 4 }}>
                    Không thể tạo báo cáo tuần.
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Cần có ít nhất vài ngày dữ liệu.
                </p>
                <Link
                    href="/analytics"
                    style={{
                        display: "inline-block",
                        marginTop: 16,
                        color: "var(--gold)",
                        fontSize: 14,
                    }}
                >
                    ← Quay lại Analytics
                </Link>
            </div>
        );

    const vsTimeColor =
        report.vsLastWeek.studyTime >= 0 ? "var(--emerald)" : "var(--ruby)";
    const vsExpColor =
        report.vsLastWeek.exp >= 0 ? "var(--emerald)" : "var(--ruby)";

    const barData = report.skillStats.map((s) => ({
        skill: s.skill,
        sessions: s.sessionsCount,
    }));

    return (
        <div
            style={{
                minHeight: "100dvh",
                background: "var(--bg-void)",
                paddingBottom: 120,
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "calc(env(safe-area-inset-top) + 16px) 20px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    backdropFilter: "blur(12px)",
                    background: "var(--bg-void)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Link
                        href="/analytics"
                        style={{ color: "var(--text-muted)", display: "flex" }}
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <p
                            style={{
                                fontSize: 10,
                                letterSpacing: "0.15em",
                                color: "var(--gold)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                fontFamily: "var(--font-display)",
                                margin: 0,
                            }}
                        >
                            ORACLE · Tuần {report.weekNumber}
                        </p>
                        <h1
                            style={{
                                fontSize: 20,
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                fontFamily: "var(--font-display)",
                                margin: 0,
                            }}
                        >
                            {report.period}
                        </h1>
                    </div>
                </div>
            </div>

            <div style={{ padding: "16px 16px 0" }}>
                {/* Summary stats */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 8,
                        marginBottom: 12,
                    }}
                >
                    {[
                        {
                            Icon: Clock,
                            label: "Phút học",
                            value: `${report.totalStudyMinutes}`,
                            color: "var(--cyan)",
                        },
                        {
                            Icon: Flame,
                            label: "EXP kiếm",
                            value: `${report.totalExp}`,
                            color: "var(--gold)",
                        },
                        {
                            Icon: Target,
                            label: "Quest %",
                            value: `${report.questCompletionRate}%`,
                            color: "var(--emerald)",
                        },
                    ].map(({ Icon, label, value, color }) => (
                        <div
                            key={label}
                            style={{
                                background: "var(--bg-raised)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 12,
                                padding: "12px 10px",
                                textAlign: "center",
                            }}
                        >
                            <Icon
                                size={16}
                                style={{ color, marginBottom: 4 }}
                            />
                            <p
                                style={{
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: "var(--text-primary)",
                                    margin: "0 0 2px",
                                    fontFamily: "var(--font-display)",
                                }}
                            >
                                {value}
                            </p>
                            <p
                                style={{
                                    fontSize: 10,
                                    color: "var(--text-muted)",
                                    margin: 0,
                                }}
                            >
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* AI Summary */}
                {report.summary &&
                    card(
                        <>
                            {sl("AI Summary")}
                            <div style={{ display: "flex", gap: 10 }}>
                                <Sparkles
                                    size={16}
                                    style={{
                                        color: "var(--gold)",
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}
                                />
                                <p
                                    style={{
                                        fontSize: 13,
                                        color: "var(--text-secondary)",
                                        margin: 0,
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {report.summary}
                                </p>
                            </div>
                        </>,
                        { marginBottom: 12 },
                    )}

                {/* Skill changes */}
                {card(
                    <>
                        {sl("Skill Changes")}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            {report.skillStats.map((s) => (
                                <div
                                    key={s.skill}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: "var(--text-primary)",
                                            minWidth: 70,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {s.skill}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-muted)",
                                            minWidth: 60,
                                        }}
                                    >
                                        {s.sessionsCount} sessions
                                    </span>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: 4,
                                            background:
                                                "rgba(255,255,255,0.06)",
                                            borderRadius: 2,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${Math.min(100, s.sessionsCount * 10)}%`,
                                                height: 4,
                                                borderRadius: 2,
                                                background:
                                                    s.trend === "up"
                                                        ? "var(--emerald)"
                                                        : s.trend === "down"
                                                          ? "var(--ruby)"
                                                          : "var(--text-muted)",
                                                transition:
                                                    "width 0.6s ease-out",
                                            }}
                                        />
                                    </div>
                                    <TrendBadge
                                        trend={s.trend}
                                        change={s.scoreChange}
                                    />
                                </div>
                            ))}
                        </div>
                    </>,
                    { marginBottom: 12 },
                )}

                {/* Activity bar chart */}
                {card(
                    <>
                        {sl("Sessions by Skill")}
                        <ResponsiveContainer width="100%" height={100}>
                            <BarChart
                                data={barData}
                                margin={{
                                    top: 0,
                                    right: 0,
                                    left: -24,
                                    bottom: 0,
                                }}
                            >
                                <XAxis
                                    dataKey="skill"
                                    tick={{
                                        fill: "var(--text-muted)",
                                        fontSize: 10,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{
                                        fill: "var(--text-muted)",
                                        fontSize: 10,
                                    }}
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
                                    dataKey="sessions"
                                    fill="var(--violet-bright)"
                                    radius={[3, 3, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </>,
                    { marginBottom: 12 },
                )}

                {/* Highlights */}
                {card(
                    <>
                        {sl("Highlights")}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 10,
                                }}
                            >
                                <Trophy
                                    size={14}
                                    style={{
                                        color: "var(--gold)",
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}
                                />
                                <div>
                                    <p
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-muted)",
                                            margin: "0 0 2px",
                                        }}
                                    >
                                        Top Achievement
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: "var(--text-primary)",
                                            margin: 0,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {report.topAchievement}
                                    </p>
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 10,
                                }}
                            >
                                <TrendingUp
                                    size={14}
                                    style={{
                                        color: "var(--emerald)",
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}
                                />
                                <div>
                                    <p
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-muted)",
                                            margin: "0 0 2px",
                                        }}
                                    >
                                        Cải thiện nhiều nhất
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: "var(--text-primary)",
                                            margin: 0,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {report.biggestImprovement}
                                    </p>
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 10,
                                }}
                            >
                                <CalendarDays
                                    size={14}
                                    style={{
                                        color: "var(--cyan)",
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}
                                />
                                <div>
                                    <p
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-muted)",
                                            margin: "0 0 2px",
                                        }}
                                    >
                                        Ngày học tốt nhất
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: "var(--text-primary)",
                                            margin: 0,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {report.bestDay}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>,
                    { marginBottom: 12 },
                )}

                {/* Vs last week */}
                {card(
                    <>
                        {sl("So với tuần trước")}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 8,
                            }}
                        >
                            <div style={{ textAlign: "center" }}>
                                <p
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 800,
                                        color: vsTimeColor,
                                        margin: "0 0 2px",
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    {report.vsLastWeek.studyTime >= 0
                                        ? "+"
                                        : ""}
                                    {report.vsLastWeek.studyTime}m
                                </p>
                                <p
                                    style={{
                                        fontSize: 10,
                                        color: "var(--text-muted)",
                                        margin: 0,
                                    }}
                                >
                                    Thời gian
                                </p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 800,
                                        color: vsExpColor,
                                        margin: "0 0 2px",
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    {report.vsLastWeek.exp >= 0 ? "+" : ""}
                                    {report.vsLastWeek.exp}
                                </p>
                                <p
                                    style={{
                                        fontSize: 10,
                                        color: "var(--text-muted)",
                                        margin: 0,
                                    }}
                                >
                                    EXP
                                </p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 800,
                                        color: "var(--gold)",
                                        margin: "0 0 2px",
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    {report.vsLastWeek.consistency}%
                                </p>
                                <p
                                    style={{
                                        fontSize: 10,
                                        color: "var(--text-muted)",
                                        margin: 0,
                                    }}
                                >
                                    Quest
                                </p>
                            </div>
                        </div>
                    </>,
                    { marginBottom: 12 },
                )}

                {/* Recommendation */}
                {report.topRecommendation &&
                    card(
                        <>
                            {sl("Tuần tới cần làm")}
                            <div style={{ display: "flex", gap: 10 }}>
                                <Target
                                    size={16}
                                    style={{
                                        color: "var(--gold)",
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}
                                />
                                <p
                                    style={{
                                        fontSize: 13,
                                        color: "var(--text-secondary)",
                                        margin: 0,
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {report.topRecommendation}
                                </p>
                            </div>
                        </>,
                    )}
            </div>
        </div>
    );
}
