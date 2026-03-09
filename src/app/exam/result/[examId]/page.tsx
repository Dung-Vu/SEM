"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Trophy,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Flag,
    Clock,
} from "lucide-react";

interface ExamResult {
    totalScore: number;
    grammarScore: number;
    vocabScore: number;
    readingScore: number;
    listeningScore: number;
    totalCorrect: number;
    totalWrong: number;
    totalSkipped: number;
    accuracyRate: number;
    vsLastExam: number | null;
    isPersonalBest: boolean;
    aiAnalysis: string | null;
    weakTopics: string[];
    strongTopics: string[];
    levelRecommendation?: string | null;
}

interface ExamInfo {
    id: string;
    level: string;
    mode: string;
    timeSpent: number | null;
}

interface AnswerReview {
    questionId: string;
    section: string;
    level: string;
    topic: string | null;
    passage: string | null;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correct: string;
    explanation: string;
    userAnswer: string | null;
    isCorrect: boolean | null;
    flagged: boolean;
}

type ReviewFilter = "all" | "wrong" | "skipped" | "flagged";

export default function ExamResultPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId as string;

    const [result, setResult] = useState<ExamResult | null>(null);
    const [exam, setExam] = useState<ExamInfo | null>(null);
    const [answers, setAnswers] = useState<AnswerReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReview, setShowReview] = useState(false);
    const [filter, setFilter] = useState<ReviewFilter>("all");
    const [expandedQ, setExpandedQ] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/exam/history?examId=${examId}`);
                const data = await res.json();
                setResult(data.result);
                setExam(data.exam);
                setAnswers(data.answers || []);
            } catch {
                // ignore
            }
            setLoading(false);
        };
        load();
    }, [examId]);

    if (loading) {
        return (
            <div style={{ paddingTop: 8 }}>
                <div
                    className="skeleton"
                    style={{
                        width: 120,
                        height: 20,
                        marginBottom: 16,
                        borderRadius: 8,
                    }}
                />
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div
                        className="skeleton"
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            margin: "0 auto",
                        }}
                    />
                </div>
                <div
                    className="skeleton"
                    style={{
                        width: "100%",
                        height: 120,
                        borderRadius: 16,
                        marginBottom: 12,
                    }}
                />
                <div
                    className="skeleton"
                    style={{
                        width: "100%",
                        height: 80,
                        borderRadius: 16,
                        marginBottom: 12,
                    }}
                />
                <div
                    className="skeleton"
                    style={{ width: "100%", height: 100, borderRadius: 16 }}
                />
            </div>
        );
    }

    if (!result || !exam) {
        return (
            <div style={{ textAlign: "center", paddingTop: 100 }}>
                <p style={{ color: "var(--text-muted)" }}>
                    Không tìm thấy kết quả
                </p>
                <Link
                    href="/exam"
                    style={{
                        color: "var(--gold)",
                        textDecoration: "none",
                        fontSize: 13,
                    }}
                >
                    ← Quay lại
                </Link>
            </div>
        );
    }

    const scoreColor =
        result.totalScore >= 80
            ? "var(--emerald)"
            : result.totalScore >= 60
              ? "var(--gold)"
              : "var(--ruby)";
    const timeStr = result
        ? (() => {
              const t = exam.timeSpent ?? 0;
              return `${Math.floor(t / 60)} phút`;
          })()
        : "";
    const totalQ = answers.length || 1;
    const avgTimePerQ = exam.timeSpent
        ? Math.floor(exam.timeSpent / totalQ)
        : 0;
    const avgTimeStr =
        avgTimePerQ > 0
            ? `${Math.floor(avgTimePerQ / 60)}:${(avgTimePerQ % 60).toString().padStart(2, "0")}`
            : "-";

    const filteredAnswers = answers.filter((a) => {
        if (filter === "wrong") return a.isCorrect === false && a.userAnswer;
        if (filter === "skipped") return !a.userAnswer;
        if (filter === "flagged") return a.flagged;
        return true;
    });

    const sectionBars = [
        { key: "Grammar", score: result.grammarScore, color: "var(--gold)" },
        { key: "Vocabulary", score: result.vocabScore, color: "var(--cyan)" },
        { key: "Reading", score: result.readingScore, color: "var(--emerald)" },
        {
            key: "Listening",
            score: result.listeningScore,
            color: "var(--violet)",
        },
    ].filter((s) => s.score > 0);

    const card = (children: React.ReactNode, style?: React.CSSProperties) => (
        <div
            style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                ...style,
            }}
        >
            {children}
        </div>
    );

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
                    📊 Kết quả thi
                </h1>
            </div>

            <p
                style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginBottom: 16,
                }}
            >
                {exam.mode === "full"
                    ? "Full Exam"
                    : exam.mode === "quick"
                      ? "Quick"
                      : "Section"}{" "}
                · {exam.level} · {timeStr}
            </p>

            {/* Overall Score */}
            {card(
                <div style={{ textAlign: "center" }}>
                    {result.isPersonalBest && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                marginBottom: 8,
                            }}
                        >
                            <Trophy
                                size={16}
                                color="var(--gold)"
                                fill="var(--gold)"
                            />
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "var(--gold)",
                                    fontFamily: "var(--font-display)",
                                }}
                            >
                                Personal Best!
                            </span>
                        </div>
                    )}
                    <p
                        style={{
                            fontSize: 48,
                            fontWeight: 800,
                            color: scoreColor,
                            fontFamily: "var(--font-display)",
                            margin: "0 0 2px",
                            lineHeight: 1,
                        }}
                    >
                        {result.totalScore}
                    </p>
                    <p
                        style={{
                            fontSize: 14,
                            color: "var(--text-muted)",
                            margin: 0,
                        }}
                    >
                        /100
                    </p>
                    {result.vsLastExam != null && (
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 8,
                                padding: "3px 10px",
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 700,
                                background:
                                    result.vsLastExam >= 0
                                        ? "rgba(52,211,153,0.12)"
                                        : "rgba(248,113,113,0.12)",
                                color:
                                    result.vsLastExam >= 0
                                        ? "var(--emerald)"
                                        : "var(--ruby)",
                            }}
                        >
                            {result.vsLastExam >= 0 ? (
                                <TrendingUp size={12} />
                            ) : (
                                <TrendingDown size={12} />
                            )}
                            {result.vsLastExam >= 0 ? "+" : ""}
                            {result.vsLastExam} so với lần trước
                        </div>
                    )}
                </div>,
            )}

            {/* Section Breakdown */}
            {card(
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
                        BREAKDOWN
                    </p>
                    {sectionBars.map((s) => (
                        <div key={s.key} style={{ marginBottom: 10 }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 12,
                                    marginBottom: 3,
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    {s.key}
                                </span>
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color: s.color,
                                        fontFamily: "var(--font-mono)",
                                    }}
                                >
                                    {s.score}
                                </span>
                            </div>
                            <div
                                style={{
                                    height: 6,
                                    borderRadius: 3,
                                    background: "var(--bg-raised)",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${s.score}%`,
                                        borderRadius: 3,
                                        background: s.color,
                                        transition: "width 0.5s",
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </>,
            )}

            {/* Stats */}
            {card(
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
                        THỐNG KÊ
                    </p>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                            gap: 8,
                            textAlign: "center",
                        }}
                    >
                        {[
                            {
                                icon: CheckCircle2,
                                label: "Đúng",
                                value: result.totalCorrect,
                                color: "var(--emerald)",
                            },
                            {
                                icon: XCircle,
                                label: "Sai",
                                value: result.totalWrong,
                                color: "var(--ruby)",
                            },
                            {
                                icon: MinusCircle,
                                label: "Bỏ",
                                value: result.totalSkipped,
                                color: "var(--text-muted)",
                            },
                            {
                                icon: TrendingUp,
                                label: "Accuracy",
                                value: `${Math.round(result.accuracyRate * 100)}%`,
                                color: "var(--cyan)",
                            },
                            {
                                icon: Clock,
                                label: "TB/câu",
                                value: avgTimeStr,
                                color: "var(--violet)",
                            },
                        ].map((s) => (
                            <div key={s.label}>
                                <s.icon
                                    size={16}
                                    color={s.color}
                                    style={{ marginBottom: 4 }}
                                />
                                <p
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 800,
                                        color: s.color,
                                        margin: 0,
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    {s.value}
                                </p>
                                <p
                                    style={{
                                        fontSize: 10,
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

            {/* AI Analysis */}
            {result.aiAnalysis &&
                card(
                    <>
                        <p
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                margin: "0 0 8px",
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            🧠 AI NHẬN XÉT
                        </p>
                        <p
                            style={{
                                fontSize: 13,
                                lineHeight: 1.7,
                                color: "var(--text-secondary)",
                                margin: 0,
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            {result.aiAnalysis}
                        </p>
                    </>,
                )}

            {/* Level Recommendation (16B.8) */}
            {result.levelRecommendation &&
                card(
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <TrendingUp size={16} color="var(--violet)" />
                        <p
                            style={{
                                fontSize: 12,
                                color: "var(--text-secondary)",
                                margin: 0,
                                fontFamily: "var(--font-body)",
                                lineHeight: 1.5,
                            }}
                        >
                            {result.levelRecommendation}
                        </p>
                    </div>,
                )}

            {/* Weak / Strong Topics */}
            {(result.weakTopics.length > 0 || result.strongTopics.length > 0) &&
                card(
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                        }}
                    >
                        {result.strongTopics.length > 0 && (
                            <div>
                                <p
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: "var(--emerald)",
                                        margin: "0 0 6px",
                                    }}
                                >
                                    💪 MẠNH
                                </p>
                                {result.strongTopics.map((t) => (
                                    <p
                                        key={t}
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-secondary)",
                                            margin: "2px 0",
                                        }}
                                    >
                                        {t}
                                    </p>
                                ))}
                            </div>
                        )}
                        {result.weakTopics.length > 0 && (
                            <div>
                                <p
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: "var(--ruby)",
                                        margin: "0 0 6px",
                                    }}
                                >
                                    ⚠️ YẾU
                                </p>
                                {result.weakTopics.map((t) => (
                                    <p
                                        key={t}
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-secondary)",
                                            margin: "2px 0",
                                        }}
                                    >
                                        {t}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>,
                )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button
                    onClick={() => setShowReview(!showReview)}
                    style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-elevated)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                    }}
                >
                    {showReview ? (
                        <ChevronUp size={14} />
                    ) : (
                        <ChevronDown size={14} />
                    )}
                    Xem chi tiết
                </button>
                <Link
                    href="/exam"
                    style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 12,
                        border: "none",
                        background: "var(--gold)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--bg-base)",
                        textDecoration: "none",
                    }}
                >
                    <RefreshCw size={14} /> Thi lại
                </Link>
            </div>

            {/* Detail Review */}
            {showReview && (
                <div className="animate-fade-in-up">
                    {/* Filter tabs */}
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            marginBottom: 12,
                            overflowX: "auto",
                        }}
                    >
                        {(
                            [
                                { key: "all", label: "Tất cả" },
                                {
                                    key: "wrong",
                                    label: `Sai (${answers.filter((a) => a.isCorrect === false && a.userAnswer).length})`,
                                },
                                {
                                    key: "skipped",
                                    label: `Bỏ (${answers.filter((a) => !a.userAnswer).length})`,
                                },
                                {
                                    key: "flagged",
                                    label: `Flag (${answers.filter((a) => a.flagged).length})`,
                                },
                            ] as { key: ReviewFilter; label: string }[]
                        ).map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    border:
                                        filter === f.key
                                            ? "1px solid var(--gold)"
                                            : "1px solid var(--border-subtle)",
                                    background:
                                        filter === f.key
                                            ? "rgba(245,200,66,0.1)"
                                            : "var(--bg-raised)",
                                    color:
                                        filter === f.key
                                            ? "var(--gold)"
                                            : "var(--text-muted)",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {filteredAnswers.map((a, idx) => {
                        const expanded = expandedQ === a.questionId;
                        const icon = a.isCorrect
                            ? "✅"
                            : a.userAnswer
                              ? "❌"
                              : "⬜";
                        return (
                            <div
                                key={a.questionId}
                                style={{
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: 12,
                                    padding: "12px 14px",
                                    marginBottom: 8,
                                }}
                            >
                                <button
                                    onClick={() =>
                                        setExpandedQ(
                                            expanded ? null : a.questionId,
                                        )
                                    }
                                    style={{
                                        width: "100%",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        {icon} Câu {answers.indexOf(a) + 1} —{" "}
                                        {a.section}
                                        {a.flagged && (
                                            <Flag
                                                size={10}
                                                color="var(--cyan)"
                                                fill="var(--cyan)"
                                                style={{
                                                    marginLeft: 4,
                                                    verticalAlign: "middle",
                                                }}
                                            />
                                        )}
                                    </span>
                                    {expanded ? (
                                        <ChevronUp
                                            size={14}
                                            color="var(--text-muted)"
                                        />
                                    ) : (
                                        <ChevronDown
                                            size={14}
                                            color="var(--text-muted)"
                                        />
                                    )}
                                </button>
                                {expanded && (
                                    <div style={{ marginTop: 10 }}>
                                        {a.passage && (
                                            <p
                                                style={{
                                                    fontSize: 11,
                                                    color: "var(--text-muted)",
                                                    background:
                                                        "var(--bg-raised)",
                                                    padding: 10,
                                                    borderRadius: 8,
                                                    marginBottom: 8,
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                {a.passage}
                                            </p>
                                        )}
                                        <p
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "var(--text-primary)",
                                                marginBottom: 8,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {a.question}
                                        </p>
                                        {(["A", "B", "C", "D"] as const).map(
                                            (opt) => {
                                                const optVal: Record<
                                                    string,
                                                    string
                                                > = {
                                                    A: a.optionA,
                                                    B: a.optionB,
                                                    C: a.optionC,
                                                    D: a.optionD,
                                                };
                                                const isCorrect =
                                                    opt === a.correct;
                                                const isUserPick =
                                                    opt === a.userAnswer;
                                                let bg = "transparent";
                                                let col =
                                                    "var(--text-secondary)";
                                                if (isCorrect) {
                                                    bg = "rgba(52,211,153,0.1)";
                                                    col = "var(--emerald)";
                                                }
                                                if (isUserPick && !isCorrect) {
                                                    bg =
                                                        "rgba(248,113,113,0.1)";
                                                    col = "var(--ruby)";
                                                }
                                                return (
                                                    <div
                                                        key={opt}
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                            padding: "6px 10px",
                                                            borderRadius: 8,
                                                            background: bg,
                                                            marginBottom: 3,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                color: col,
                                                                width: 16,
                                                            }}
                                                        >
                                                            {opt}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: 12,
                                                                color: col,
                                                            }}
                                                        >
                                                            {optVal[opt]}
                                                        </span>
                                                        {isCorrect && (
                                                            <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    marginLeft:
                                                                        "auto",
                                                                }}
                                                            >
                                                                ✅
                                                            </span>
                                                        )}
                                                        {isUserPick &&
                                                            !isCorrect && (
                                                                <span
                                                                    style={{
                                                                        fontSize: 10,
                                                                        marginLeft:
                                                                            "auto",
                                                                    }}
                                                                >
                                                                    ❌
                                                                </span>
                                                            )}
                                                    </div>
                                                );
                                            },
                                        )}
                                        <div
                                            style={{
                                                marginTop: 8,
                                                padding: "8px 10px",
                                                background:
                                                    "rgba(56,189,248,0.06)",
                                                borderRadius: 8,
                                                borderLeft:
                                                    "3px solid var(--cyan)",
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: "var(--cyan)",
                                                    margin: "0 0 4px",
                                                }}
                                            >
                                                💡 GIẢI THÍCH
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: 12,
                                                    lineHeight: 1.6,
                                                    color: "var(--text-secondary)",
                                                    margin: 0,
                                                    fontFamily:
                                                        "var(--font-body)",
                                                }}
                                            >
                                                {a.explanation}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
