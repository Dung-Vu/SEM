"use client";

import { useEffect, useState, useCallback } from "react";
import {
    PenTool,
    Loader2,
    Brain,
    ChevronRight,
    Trophy,
    Sparkles,
    Filter,
} from "lucide-react";
import Link from "next/link";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────────

interface Prompt {
    id: string;
    title: string;
    instruction: string;
    type: string;
    level: string;
    topic: string | null;
    minWords: number;
    maxWords: number;
    timeLimit: number | null;
    isAiGenerated: boolean;
}

interface Submission {
    id: string;
    title: string;
    type: string;
    level: string;
    overallScore: number | null;
    isPersonalBest: boolean;
    submittedAt: string;
}

interface WritingStats {
    totalSubmissions: number;
    avgScore: number;
    bestScore: number;
    improvementTrend: number;
    strongestSkill: { skill: string; score: number } | null;
    weakestSkill: { skill: string; score: number } | null;
    commonErrors: { type: string; count: number }[];
    scoreHistory: {
        date: string;
        overall: number | null;
        grammar: number | null;
        vocab: number | null;
        coherence: number | null;
        task: number | null;
        type: string;
    }[];
    recentSubmissions: Submission[];
}

// ─── Constants ──────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
    essay: "var(--gold)",
    paragraph: "var(--cyan)",
    email: "var(--violet)",
    report: "var(--emerald)",
    story: "var(--ruby)",
};

const LEVEL_COLORS: Record<string, string> = {
    B1: "var(--emerald)",
    B2: "var(--gold)",
    C1: "var(--violet-bright)",
    C2: "var(--ruby)",
};

type TabId = "prompts" | "work" | "stats";

// ─── Page ───────────────────────────────────────────────────────────────

export default function WritingPage() {
    const [tab, setTab] = useState<TabId>("prompts");
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [stats, setStats] = useState<WritingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>("");
    const [filterLevel, setFilterLevel] = useState<string>("");
    const [generating, setGenerating] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [pRes, sRes, stRes] = await Promise.all([
                fetch("/api/writing/prompts"),
                fetch("/api/writing/submissions?limit=20"),
                fetch("/api/writing/stats"),
            ]);
            const pJson = await pRes.json();
            const sJson = await sRes.json();
            const stJson = await stRes.json();
            if (pJson.prompts) setPrompts(pJson.prompts);
            if (sJson.submissions) {
                setSubmissions(
                    sJson.submissions.map((s: Record<string, unknown>) => ({
                        id: s.id,
                        title:
                            (s.prompt as Record<string, string> | null)
                                ?.title ?? "Custom",
                        type:
                            (s.prompt as Record<string, string> | null)?.type ??
                            "custom",
                        level:
                            (s.prompt as Record<string, string> | null)
                                ?.level ?? "?",
                        overallScore: s.overallScore,
                        isPersonalBest: s.isPersonalBest,
                        submittedAt: s.submittedAt,
                    })),
                );
            }
            if (!stJson.error) setStats(stJson);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch("/api/writing/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: filterType || "essay",
                    level: filterLevel || "B2",
                    topic: undefined,
                }),
            });
            const json = await res.json();
            if (json.prompt) {
                window.location.href = `/writing/${json.prompt.id}`;
            }
        } catch {
            /* silent */
        } finally {
            setGenerating(false);
        }
    };

    // Filter prompts
    const filtered = prompts.filter((p) => {
        if (filterType && p.type !== filterType) return false;
        if (filterLevel && p.level !== filterLevel) return false;
        return true;
    });

    if (loading) {
        return (
            <div style={{ paddingTop: 8 }}>
                <div
                    className="skeleton"
                    style={{
                        width: 140,
                        height: 24,
                        marginBottom: 6,
                        borderRadius: 8,
                    }}
                />
                <div
                    className="skeleton"
                    style={{
                        width: 200,
                        height: 14,
                        marginBottom: 16,
                        borderRadius: 6,
                    }}
                />
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 8,
                        marginBottom: 16,
                    }}
                >
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="skeleton"
                            style={{ height: 60, borderRadius: 12 }}
                        />
                    ))}
                </div>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="skeleton"
                        style={{
                            width: "100%",
                            height: 80,
                            borderRadius: 14,
                            marginBottom: 10,
                        }}
                    />
                ))}
            </div>
        );
    }

    const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
        <div
            style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 14,
                padding: 14,
                ...extra,
            }}
        >
            {children}
        </div>
    );

    const badge = (text: string, color: string) => (
        <span
            style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color,
                background: `color-mix(in srgb, ${color} 12%, transparent)`,
                padding: "2px 8px",
                borderRadius: 6,
            }}
        >
            {text}
        </span>
    );

    return (
        <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
            {/* Header */}
            <div style={{ padding: "20px 16px 12px" }}>
                <h1
                    style={{
                        fontSize: 20,
                        fontWeight: 800,
                        fontFamily: "var(--font-display)",
                        color: "var(--text-primary)",
                        margin: "0 0 4px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <PenTool size={20} color="var(--cyan)" strokeWidth={2} />
                    Writing Lab
                </h1>
                <p
                    style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        margin: 0,
                        fontFamily: "var(--font-body)",
                    }}
                >
                    Luyện viết — AI chấm như giám khảo thật
                </p>
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: 4,
                    padding: "0 16px",
                    marginBottom: 12,
                }}
            >
                {(["prompts", "work", "stats"] as TabId[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            flex: 1,
                            padding: "8px 0",
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "var(--font-display)",
                            letterSpacing: "0.04em",
                            textTransform: "capitalize",
                            border:
                                tab === t
                                    ? "1px solid var(--border-gold)"
                                    : "1px solid var(--border-subtle)",
                            background:
                                tab === t
                                    ? "rgba(245,166,35,0.08)"
                                    : "var(--bg-elevated)",
                            color:
                                tab === t ? "var(--gold)" : "var(--text-muted)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                    >
                        {t === "prompts"
                            ? "Prompts"
                            : t === "work"
                              ? "My Work"
                              : "Stats"}
                    </button>
                ))}
            </div>

            <div style={{ padding: "0 16px" }}>
                {/* ─── PROMPTS TAB ─── */}
                {tab === "prompts" && (
                    <>
                        {/* AI Generate */}
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: 12,
                                background:
                                    "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))",
                                border: "1px solid rgba(139,92,246,0.3)",
                                color: "var(--violet-bright)",
                                fontSize: 13,
                                fontWeight: 700,
                                fontFamily: "var(--font-display)",
                                cursor: generating ? "wait" : "pointer",
                                marginBottom: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                            }}
                        >
                            {generating ? (
                                <Loader2
                                    size={16}
                                    style={{
                                        animation: "spin 1s linear infinite",
                                    }}
                                />
                            ) : (
                                <Sparkles size={16} />
                            )}
                            {generating
                                ? "Đang tạo đề..."
                                : "AI Generate — Tạo đề mới"}
                        </button>

                        {/* Filters */}
                        <div
                            style={{
                                display: "flex",
                                gap: 6,
                                marginBottom: 12,
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                <Filter size={12} color="var(--text-muted)" />
                                <select
                                    value={filterType}
                                    onChange={(e) =>
                                        setFilterType(e.target.value)
                                    }
                                    style={{
                                        flex: 1,
                                        padding: "6px 8px",
                                        borderRadius: 8,
                                        fontSize: 11,
                                        background: "var(--bg-elevated)",
                                        border: "1px solid var(--border-subtle)",
                                        color: "var(--text-secondary)",
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    <option value="">All types</option>
                                    <option value="essay">Essay</option>
                                    <option value="paragraph">Paragraph</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>
                            <select
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                style={{
                                    padding: "6px 8px",
                                    borderRadius: 8,
                                    fontSize: 11,
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border-subtle)",
                                    color: "var(--text-secondary)",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                <option value="">All levels</option>
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                                <option value="C1">C1</option>
                            </select>
                        </div>

                        {/* Prompt list */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            {filtered.map((p) => (
                                <Link
                                    key={p.id}
                                    href={`/writing/${p.id}`}
                                    style={{ textDecoration: "none" }}
                                >
                                    {card(
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 6,
                                                        marginBottom: 6,
                                                    }}
                                                >
                                                    {badge(
                                                        p.type,
                                                        TYPE_COLORS[p.type] ??
                                                            "var(--text-muted)",
                                                    )}
                                                    {badge(
                                                        p.level,
                                                        LEVEL_COLORS[p.level] ??
                                                            "var(--text-muted)",
                                                    )}
                                                    {p.isAiGenerated &&
                                                        badge(
                                                            "AI",
                                                            "var(--violet-bright)",
                                                        )}
                                                </div>
                                                <p
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: "var(--text-primary)",
                                                        margin: "0 0 4px",
                                                    }}
                                                >
                                                    {p.title}
                                                </p>
                                                <p
                                                    style={{
                                                        fontSize: 11,
                                                        color: "var(--text-muted)",
                                                        margin: 0,
                                                    }}
                                                >
                                                    {p.minWords}–{p.maxWords}{" "}
                                                    words
                                                    {p.timeLimit
                                                        ? ` · ${p.timeLimit} min`
                                                        : ""}
                                                </p>
                                            </div>
                                            <ChevronRight
                                                size={16}
                                                color="var(--text-muted)"
                                            />
                                        </div>,
                                    )}
                                </Link>
                            ))}
                            {filtered.length === 0 && (
                                <p
                                    style={{
                                        fontSize: 13,
                                        color: "var(--text-muted)",
                                        textAlign: "center",
                                        padding: 20,
                                    }}
                                >
                                    Không có đề nào phù hợp. Thử chỉnh filter
                                    hoặc tạo đề mới với AI.
                                </p>
                            )}
                        </div>
                    </>
                )}

                {/* ─── MY WORK TAB ─── */}
                {tab === "work" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        {submissions.length === 0 ? (
                            <p
                                style={{
                                    fontSize: 13,
                                    color: "var(--text-muted)",
                                    textAlign: "center",
                                    padding: 30,
                                }}
                            >
                                Chưa có bài nộp nào. Chọn đề và bắt đầu viết!
                            </p>
                        ) : (
                            submissions.map((s) => (
                                <Link
                                    key={s.id}
                                    href={`/writing/result/${s.id}`}
                                    style={{ textDecoration: "none" }}
                                >
                                    {card(
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 6,
                                                        marginBottom: 4,
                                                    }}
                                                >
                                                    {badge(
                                                        s.type,
                                                        TYPE_COLORS[s.type] ??
                                                            "var(--text-muted)",
                                                    )}
                                                    {badge(
                                                        s.level,
                                                        LEVEL_COLORS[s.level] ??
                                                            "var(--text-muted)",
                                                    )}
                                                    {s.isPersonalBest && (
                                                        <Trophy
                                                            size={12}
                                                            color="var(--gold)"
                                                        />
                                                    )}
                                                </div>
                                                <p
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: "var(--text-primary)",
                                                        margin: "0 0 2px",
                                                    }}
                                                >
                                                    {s.title}
                                                </p>
                                                <p
                                                    style={{
                                                        fontSize: 10,
                                                        color: "var(--text-muted)",
                                                        margin: 0,
                                                    }}
                                                >
                                                    {new Date(
                                                        s.submittedAt,
                                                    ).toLocaleDateString(
                                                        "vi-VN",
                                                    )}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p
                                                    style={{
                                                        fontSize: 22,
                                                        fontWeight: 800,
                                                        margin: 0,
                                                        fontFamily:
                                                            "var(--font-display)",
                                                        color:
                                                            (s.overallScore ??
                                                                0) >= 70
                                                                ? "var(--emerald)"
                                                                : (s.overallScore ??
                                                                        0) >= 50
                                                                  ? "var(--gold)"
                                                                  : "var(--ruby)",
                                                    }}
                                                >
                                                    {s.overallScore ?? "—"}
                                                </p>
                                                <p
                                                    style={{
                                                        fontSize: 9,
                                                        color: "var(--text-muted)",
                                                        margin: 0,
                                                    }}
                                                >
                                                    /100
                                                </p>
                                            </div>
                                        </div>,
                                    )}
                                </Link>
                            ))
                        )}
                    </div>
                )}

                {/* ─── STATS TAB ─── */}
                {tab === "stats" && stats && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        {/* Overview */}
                        {card(
                            <>
                                <p
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        color: "var(--text-muted)",
                                        textTransform: "uppercase" as const,
                                        margin: "0 0 10px",
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    Writing Overview
                                </p>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(4, 1fr)",
                                        gap: 8,
                                    }}
                                >
                                    {[
                                        {
                                            label: "Bài nộp",
                                            value: stats.totalSubmissions,
                                            color: "var(--text-primary)",
                                        },
                                        {
                                            label: "Avg",
                                            value: stats.avgScore,
                                            color: "var(--gold)",
                                        },
                                        {
                                            label: "Best",
                                            value: stats.bestScore,
                                            color: "var(--emerald)",
                                        },
                                        {
                                            label: "Trend",
                                            value: `${stats.improvementTrend >= 0 ? "+" : ""}${stats.improvementTrend}`,
                                            color:
                                                stats.improvementTrend >= 0
                                                    ? "var(--emerald)"
                                                    : "var(--ruby)",
                                        },
                                    ].map((s, i) => (
                                        <div
                                            key={i}
                                            style={{ textAlign: "center" }}
                                        >
                                            <p
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 800,
                                                    color: s.color,
                                                    margin: "0 0 2px",
                                                    fontFamily:
                                                        "var(--font-display)",
                                                }}
                                            >
                                                {s.value}
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: 9,
                                                    color: "var(--text-muted)",
                                                    margin: 0,
                                                }}
                                            >
                                                {s.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </>,
                        )}

                        {/* Score History Line Chart */}
                        {stats.scoreHistory.length >= 2 &&
                            card(
                                <>
                                    <p
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: "0.12em",
                                            color: "var(--text-muted)",
                                            textTransform: "uppercase" as const,
                                            margin: "0 0 10px",
                                            fontFamily: "var(--font-display)",
                                        }}
                                    >
                                        Score History
                                    </p>
                                    <div style={{ width: "100%", height: 180 }}>
                                        <ResponsiveContainer>
                                            <LineChart
                                                data={stats.scoreHistory}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="rgba(255,255,255,0.05)"
                                                />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{
                                                        fontSize: 9,
                                                        fill: "rgba(255,255,255,0.4)",
                                                    }}
                                                    tickFormatter={(
                                                        v: string,
                                                    ) => v.slice(5)}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    domain={[0, 100]}
                                                    tick={{
                                                        fontSize: 9,
                                                        fill: "rgba(255,255,255,0.4)",
                                                    }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={28}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        background:
                                                            "var(--bg-base)",
                                                        border: "1px solid var(--border-subtle)",
                                                        borderRadius: 10,
                                                        fontSize: 11,
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="overall"
                                                    stroke="#F5A623"
                                                    strokeWidth={2}
                                                    dot={{ r: 3 }}
                                                    name="Overall"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="grammar"
                                                    stroke="#22D3EE"
                                                    strokeWidth={1.5}
                                                    dot={false}
                                                    strokeDasharray="4 2"
                                                    name="Grammar"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="vocab"
                                                    stroke="#A78BFA"
                                                    strokeWidth={1.5}
                                                    dot={false}
                                                    strokeDasharray="4 2"
                                                    name="Vocab"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="coherence"
                                                    stroke="#34D399"
                                                    strokeWidth={1.5}
                                                    dot={false}
                                                    strokeDasharray="4 2"
                                                    name="Coherence"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>,
                            )}

                        {/* Strongest / Weakest */}
                        {(stats.strongestSkill || stats.weakestSkill) &&
                            card(
                                <>
                                    {stats.strongestSkill && (
                                        <div
                                            style={{
                                                marginBottom: stats.weakestSkill
                                                    ? 10
                                                    : 0,
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    letterSpacing: "0.08em",
                                                    color: "var(--emerald)",
                                                    textTransform:
                                                        "uppercase" as const,
                                                    margin: "0 0 6px",
                                                }}
                                            >
                                                Strongest
                                            </p>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        color: "var(--text-primary)",
                                                        fontWeight: 600,
                                                        width: 70,
                                                        textTransform:
                                                            "capitalize",
                                                    }}
                                                >
                                                    {stats.strongestSkill.skill}
                                                </span>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        height: 6,
                                                        background:
                                                            "var(--bg-elevated)",
                                                        borderRadius: 3,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${stats.strongestSkill.score}%`,
                                                            height: "100%",
                                                            background:
                                                                "var(--emerald)",
                                                            borderRadius: 3,
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        color: "var(--emerald)",
                                                        width: 28,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {stats.strongestSkill.score}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {stats.weakestSkill && (
                                        <div>
                                            <p
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    letterSpacing: "0.08em",
                                                    color: "var(--ruby)",
                                                    textTransform:
                                                        "uppercase" as const,
                                                    margin: "0 0 6px",
                                                }}
                                            >
                                                Needs Work
                                            </p>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        color: "var(--text-primary)",
                                                        fontWeight: 600,
                                                        width: 70,
                                                        textTransform:
                                                            "capitalize",
                                                    }}
                                                >
                                                    {stats.weakestSkill.skill}
                                                </span>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        height: 6,
                                                        background:
                                                            "var(--bg-elevated)",
                                                        borderRadius: 3,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${stats.weakestSkill.score}%`,
                                                            height: "100%",
                                                            background:
                                                                "var(--ruby)",
                                                            borderRadius: 3,
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        color: "var(--ruby)",
                                                        width: 28,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {stats.weakestSkill.score}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>,
                            )}

                        {/* Common errors */}
                        {stats.commonErrors.length > 0 &&
                            card(
                                <>
                                    <p
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: "0.12em",
                                            color: "var(--text-muted)",
                                            textTransform: "uppercase" as const,
                                            margin: "0 0 8px",
                                            fontFamily: "var(--font-display)",
                                        }}
                                    >
                                        Common Errors
                                    </p>
                                    {stats.commonErrors.map((e, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                padding: "4px 0",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--text-secondary)",
                                                    textTransform: "capitalize",
                                                }}
                                            >
                                                {e.type.replace(/_/g, " ")}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color: "var(--ruby)",
                                                }}
                                            >
                                                ×{e.count}
                                            </span>
                                        </div>
                                    ))}
                                </>,
                            )}

                        {stats.totalSubmissions === 0 && (
                            <p
                                style={{
                                    fontSize: 13,
                                    color: "var(--text-muted)",
                                    textAlign: "center",
                                    padding: 20,
                                }}
                            >
                                Chưa có dữ liệu. Nộp bài đầu tiên để xem thống
                                kê!
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
