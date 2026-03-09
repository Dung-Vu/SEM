"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ArrowLeft,
    Brain,
    Zap,
    BookOpen,
    TrendingUp,
    TrendingDown,
    Minus,
    Loader2,
    Crosshair,
    Sparkles,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface ErrorPattern {
    type: string;
    subtype?: string;
    count: number;
    trend: "increasing" | "decreasing" | "stable";
    examples: string[];
}

interface VocabTarget {
    word: string;
    definition: string;
    level: string;
}

interface KnownVocab {
    word: string;
    level: string;
    usedInSpeak: number;
}

interface DifficultyEntry {
    date: string;
    score: number;
    difficulty: number;
}

interface RecentSession {
    id: string;
    mode: string;
    durationSec: number;
    performanceScore: number;
    difficultyUsed: number;
    vocabUsed: string[];
    aiDebrief: string | null;
    createdAt: string;
}

interface MemoryData {
    memory: {
        currentDifficulty: number;
        autoAdjust: boolean;
        totalSessions: number;
        lastSessionAt: string | null;
        journeySummary: string | null;
        strengths: string[];
        persistentWeaknesses: string[];
        errorPatterns: ErrorPattern[];
        activeVocabTargets: VocabTarget[];
        knownVocab: KnownVocab[];
        difficultyHistory: DifficultyEntry[];
    };
    recommendations: { mode: string; reason: string; priority: number }[];
    recentSessions: RecentSession[];
}

function TrendIcon({ trend }: { trend: string }) {
    if (trend === "increasing")
        return <TrendingUp size={12} style={{ color: "var(--ruby)" }} />;
    if (trend === "decreasing")
        return <TrendingDown size={12} style={{ color: "var(--emerald)" }} />;
    return <Minus size={12} style={{ color: "var(--text-muted)" }} />;
}

const ERROR_COLORS: Record<string, string> = {
    tense: "var(--ruby)",
    article: "var(--gold)",
    preposition: "var(--gold)",
    subject_verb: "var(--ruby)",
    word_choice: "var(--cyan)",
    word_order: "var(--cyan)",
    vocab_missing: "var(--violet-bright)",
    other: "var(--text-muted)",
};

export default function MemoryDashboardPage() {
    const [data, setData] = useState<MemoryData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/ai/tutor-memory");
            const json = await res.json();
            if (!json.error) setData(json);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const card = (children: React.ReactNode, mb = 12) => (
        <div
            style={{
                background: "var(--bg-raised)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 16,
                marginBottom: mb,
            }}
        >
            {children}
        </div>
    );

    const label = (text: string) => (
        <p
            style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                textTransform: "uppercase" as const,
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
                <div style={{ paddingTop: 8 }}>
                    <div
                        className="skeleton"
                        style={{
                            width: 160,
                            height: 24,
                            marginBottom: 16,
                            borderRadius: 8,
                        }}
                    />
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
            </div>
        );

    if (!data)
        return (
            <div style={{ padding: 24, textAlign: "center" }}>
                <Brain
                    size={40}
                    style={{ color: "var(--text-muted)", marginBottom: 12 }}
                />
                <p style={{ color: "var(--text-secondary)" }}>
                    Chưa có dữ liệu Tutor Memory.
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Hãy tập Speak với AI để SENSEI bắt đầu nhớ bạn.
                </p>
                <Link
                    href="/speak"
                    style={{
                        display: "inline-block",
                        marginTop: 16,
                        color: "var(--gold)",
                        fontSize: 14,
                    }}
                >
                    ← Quay lại Speak
                </Link>
            </div>
        );

    const { memory, recommendations, recentSessions } = data;

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
                        href="/speak"
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
                                textTransform: "uppercase" as const,
                                fontFamily: "var(--font-display)",
                                margin: 0,
                            }}
                        >
                            SENSEI · TUTOR MEMORY
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
                            SENSEI biết gì về bạn
                        </h1>
                    </div>
                </div>
            </div>

            <div style={{ padding: "16px 16px 0" }}>
                {/* Difficulty */}
                {card(
                    <>
                        {label("Difficulty Level")}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <Zap size={18} style={{ color: "var(--gold)" }} />
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        marginBottom: 6,
                                    }}
                                >
                                    {Array.from({ length: 10 }, (_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: "100%",
                                                height: 6,
                                                borderRadius: 3,
                                                background:
                                                    i < memory.currentDifficulty
                                                        ? "var(--gold)"
                                                        : "rgba(255,255,255,0.08)",
                                                transition: "background 0.3s",
                                            }}
                                        />
                                    ))}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 800,
                                            color: "var(--text-primary)",
                                            fontFamily: "var(--font-display)",
                                        }}
                                    >
                                        {memory.currentDifficulty}/10
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        {memory.autoAdjust
                                            ? "Tự động điều chỉnh"
                                            : "Thủ công"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>,
                )}

                {/* Error Patterns */}
                {memory.errorPatterns.length > 0 &&
                    card(
                        <>
                            {label("Lỗi thường gặp")}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {memory.errorPatterns.map((e, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <AlertTriangle
                                            size={14}
                                            style={{
                                                color:
                                                    ERROR_COLORS[e.type] ??
                                                    "var(--text-muted)",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: "var(--text-primary)",
                                                    }}
                                                >
                                                    {e.type}
                                                    {e.subtype
                                                        ? `/${e.subtype}`
                                                        : ""}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color: "var(--text-muted)",
                                                    }}
                                                >
                                                    ×{e.count}
                                                </span>
                                                <TrendIcon trend={e.trend} />
                                            </div>
                                            {e.examples[0] && (
                                                <p
                                                    style={{
                                                        fontSize: 11,
                                                        color: "var(--text-secondary)",
                                                        margin: "2px 0 0",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    {e.examples[0]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>,
                    )}

                {/* Vocab Targets */}
                {memory.activeVocabTargets.length > 0 &&
                    card(
                        <>
                            {label("Vocab đang reinforce")}
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                }}
                            >
                                {memory.activeVocabTargets.map((v, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: 8,
                                            padding: "6px 10px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            {v.word}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: "var(--text-muted)",
                                                marginLeft: 6,
                                            }}
                                        >
                                            {v.level}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>,
                    )}

                {/* Known Vocab */}
                {memory.knownVocab.length > 0 &&
                    card(
                        <>
                            {label(
                                `Vocab đã master (${memory.knownVocab.length} từ)`,
                            )}
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 4,
                                }}
                            >
                                {memory.knownVocab.slice(0, 15).map((v, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-secondary)",
                                            background:
                                                "rgba(255,255,255,0.03)",
                                            borderRadius: 4,
                                            padding: "3px 6px",
                                        }}
                                    >
                                        {v.word}{" "}
                                        {v.usedInSpeak > 0 && (
                                            <span
                                                style={{
                                                    color: "var(--emerald)",
                                                }}
                                            >
                                                ·{v.usedInSpeak}×
                                            </span>
                                        )}
                                    </span>
                                ))}
                                {memory.knownVocab.length > 15 && (
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-muted)",
                                            padding: "3px 6px",
                                        }}
                                    >
                                        +{memory.knownVocab.length - 15} more
                                    </span>
                                )}
                            </div>
                        </>,
                    )}

                {/* Journey Narrative */}
                {memory.journeySummary &&
                    card(
                        <>
                            {label("Hành trình của bạn")}
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
                                    {memory.journeySummary}
                                </p>
                            </div>
                        </>,
                    )}

                {/* Stats */}
                {card(
                    <>
                        {label("Tổng quan")}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 8,
                            }}
                        >
                            {[
                                {
                                    l: "Sessions",
                                    v: `${memory.totalSessions}`,
                                    icon: BookOpen,
                                    c: "var(--cyan)",
                                },
                                {
                                    l: "Difficulty",
                                    v: `${memory.currentDifficulty}/10`,
                                    icon: Zap,
                                    c: "var(--gold)",
                                },
                                {
                                    l: "Strengths",
                                    v: `${memory.strengths.length}`,
                                    icon: TrendingUp,
                                    c: "var(--emerald)",
                                },
                                {
                                    l: "Weaknesses",
                                    v: `${memory.persistentWeaknesses.length}`,
                                    icon: Crosshair,
                                    c: "var(--ruby)",
                                },
                            ].map(({ l, v, icon: Icon, c }) => (
                                <div
                                    key={l}
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        borderRadius: 10,
                                        padding: "10px 12px",
                                        textAlign: "center",
                                    }}
                                >
                                    <Icon
                                        size={14}
                                        style={{ color: c, marginBottom: 4 }}
                                    />
                                    <p
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 800,
                                            color: "var(--text-primary)",
                                            margin: "0 0 2px",
                                            fontFamily: "var(--font-display)",
                                        }}
                                    >
                                        {v}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 10,
                                            color: "var(--text-muted)",
                                            margin: 0,
                                        }}
                                    >
                                        {l}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>,
                )}

                {/* Recommendations */}
                {recommendations.length > 0 &&
                    card(
                        <>
                            {label("SENSEI gợi ý hôm nay")}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {recommendations.map((r, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            gap: 10,
                                            alignItems: "flex-start",
                                            background:
                                                "rgba(255,255,255,0.03)",
                                            borderRadius: 10,
                                            padding: 12,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 800,
                                                color: "var(--gold)",
                                                minWidth: 20,
                                            }}
                                        >
                                            {i + 1}.
                                        </span>
                                        <div>
                                            <p
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: "var(--text-primary)",
                                                    margin: "0 0 2px",
                                                }}
                                            >
                                                {r.mode
                                                    .replace(/_/g, " ")
                                                    .replace(/\b\w/g, (c) =>
                                                        c.toUpperCase(),
                                                    )}
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: 11,
                                                    color: "var(--text-secondary)",
                                                    margin: 0,
                                                }}
                                            >
                                                {r.reason}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>,
                    )}

                {/* Recent Sessions */}
                {recentSessions.length > 0 &&
                    card(
                        <>
                            {label("Sessions gần đây")}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {recentSessions.map((s) => (
                                    <div
                                        key={s.id}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            background:
                                                "rgba(255,255,255,0.03)",
                                            borderRadius: 10,
                                            padding: "10px 12px",
                                        }}
                                    >
                                        <div>
                                            <p
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: "var(--text-primary)",
                                                    margin: "0 0 2px",
                                                }}
                                            >
                                                {s.mode.replace(/_/g, " ")} ·{" "}
                                                {Math.round(s.durationSec / 60)}
                                                m
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: 10,
                                                    color: "var(--text-muted)",
                                                    margin: 0,
                                                }}
                                            >
                                                {new Date(
                                                    s.createdAt,
                                                ).toLocaleDateString("vi-VN")}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <span
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 800,
                                                    fontFamily:
                                                        "var(--font-display)",
                                                    color:
                                                        s.performanceScore >= 70
                                                            ? "var(--emerald)"
                                                            : s.performanceScore >=
                                                                50
                                                              ? "var(--gold)"
                                                              : "var(--ruby)",
                                                }}
                                            >
                                                {s.performanceScore}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                /100
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>,
                        0,
                    )}
            </div>
        </div>
    );
}
