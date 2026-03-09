"use client";

import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Loader2,
    Trophy,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Lightbulb,
    Sparkles,
    PenTool,
} from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────

interface GrammarError {
    original: string;
    corrected: string;
    explanation: string;
    type: string;
}

interface VocabSuggestion {
    original: string;
    better_option: string;
    reason: string;
}

interface SubmissionData {
    id: string;
    content: string;
    wordCount: number;
    timeSpentSec: number;
    overallScore: number | null;
    grammarScore: number | null;
    vocabScore: number | null;
    coherenceScore: number | null;
    taskScore: number | null;
    aiFeedback: string | null;
    grammarErrors: GrammarError[];
    vocabSuggestions: VocabSuggestion[];
    rewriteSample: string | null;
    strengths: string[];
    improvements: string[];
    improvementVsLast: number | null;
    isPersonalBest: boolean;
    parentSubmissionId: string | null;
    submittedAt: string;
    prompt: {
        id: string;
        title: string;
        instruction: string;
        type: string;
        level: string;
    } | null;
    rewrites: {
        id: string;
        overallScore: number | null;
        submittedAt: string;
    }[];
    parentSubmission: {
        id: string;
        overallScore: number | null;
        content: string;
    } | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
    if (score >= 75) return "var(--emerald)";
    if (score >= 55) return "var(--gold)";
    return "var(--ruby)";
}

const ERROR_TYPE_LABELS: Record<string, string> = {
    tense: "Tense Error",
    article: "Article Usage",
    preposition: "Preposition",
    subject_verb: "Subject-Verb Agreement",
    word_choice: "Word Choice",
    word_order: "Word Order",
    other: "Other Error",
};

// ─── Page ───────────────────────────────────────────────────────────────

// ─── SubmissionViewer with Error Highlighting ───────────────────────────

function SubmissionViewer({
    content,
    errors,
}: {
    content: string;
    errors: GrammarError[];
}) {
    const [activeError, setActiveError] = useState<number | null>(null);

    // Build highlighted segments
    const segments: { text: string; errorIndex: number | null }[] = [];
    let remaining = content;

    // Sort errors by their position in the text (first occurrence)
    const errorPositions = errors
        .map((err, idx) => {
            const pos = content
                .toLowerCase()
                .indexOf(err.original.toLowerCase());
            return { err, idx, pos };
        })
        .filter((e) => e.pos >= 0)
        .sort((a, b) => a.pos - b.pos);

    let cursor = 0;
    for (const { err, idx, pos } of errorPositions) {
        if (pos < cursor) continue; // skip overlapping errors
        // Add non-error text before this error
        if (pos > cursor) {
            segments.push({
                text: content.slice(cursor, pos),
                errorIndex: null,
            });
        }
        // Add error text
        segments.push({
            text: content.slice(pos, pos + err.original.length),
            errorIndex: idx,
        });
        cursor = pos + err.original.length;
    }
    // Add remaining text
    if (cursor < content.length) {
        segments.push({ text: content.slice(cursor), errorIndex: null });
    }

    return (
        <div style={{ position: "relative" }}>
            <p
                style={{
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: "var(--text-secondary)",
                    margin: 0,
                    fontFamily: "var(--font-body)",
                    whiteSpace: "pre-wrap",
                }}
            >
                {segments.map((seg, i) =>
                    seg.errorIndex !== null ? (
                        <span
                            key={i}
                            onClick={() =>
                                setActiveError(
                                    activeError === seg.errorIndex
                                        ? null
                                        : seg.errorIndex,
                                )
                            }
                            style={{
                                textDecoration: "underline wavy",
                                textDecorationColor: "var(--ruby)",
                                textUnderlineOffset: "3px",
                                color: "var(--ruby)",
                                cursor: "pointer",
                                position: "relative",
                                fontWeight: 500,
                                background:
                                    activeError === seg.errorIndex
                                        ? "rgba(248,113,113,0.12)"
                                        : "transparent",
                                borderRadius: 3,
                                padding: "0 1px",
                                transition: "background 0.15s",
                            }}
                        >
                            {seg.text}
                            {activeError === seg.errorIndex && (
                                <span
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        position: "absolute",
                                        bottom: "calc(100% + 6px)",
                                        left: 0,
                                        width: 260,
                                        padding: 10,
                                        borderRadius: 10,
                                        background: "var(--bg-base)",
                                        border: "1px solid var(--border-subtle)",
                                        boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                                        zIndex: 20,
                                        whiteSpace: "normal",
                                        fontSize: 12,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "block",
                                            color: "var(--ruby)",
                                            marginBottom: 2,
                                        }}
                                    >
                                        ❌{" "}
                                        <span
                                            style={{
                                                textDecoration: "line-through",
                                            }}
                                        >
                                            {errors[seg.errorIndex!].original}
                                        </span>
                                    </span>
                                    <span
                                        style={{
                                            display: "block",
                                            color: "var(--emerald)",
                                            fontWeight: 600,
                                            marginBottom: 4,
                                        }}
                                    >
                                        ✅ {errors[seg.errorIndex!].corrected}
                                    </span>
                                    <span
                                        style={{
                                            display: "block",
                                            color: "var(--text-muted)",
                                            fontSize: 11,
                                        }}
                                    >
                                        💡 {errors[seg.errorIndex!].explanation}
                                    </span>
                                </span>
                            )}
                        </span>
                    ) : (
                        <span key={i}>{seg.text}</span>
                    ),
                )}
            </p>
            {activeError !== null && (
                <div
                    onClick={() => setActiveError(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 10,
                    }}
                />
            )}
        </div>
    );
}

export default function WritingResultPage() {
    const params = useParams();
    const submissionId = params.submissionId as string;
    const [data, setData] = useState<SubmissionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        fetch(`/api/writing/submissions?id=${submissionId}`)
            .then((r) => r.json())
            .then((json) => {
                if (json.submission) setData(json.submission);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [submissionId]);

    if (loading) {
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
                            width: 120,
                            height: 20,
                            marginBottom: 16,
                            borderRadius: 8,
                        }}
                    />
                    <div
                        className="skeleton"
                        style={{
                            width: "100%",
                            height: 160,
                            borderRadius: 20,
                            marginBottom: 12,
                        }}
                    />
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
                            height: 200,
                            borderRadius: 16,
                            marginBottom: 12,
                        }}
                    />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: 20, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)" }}>
                    Submission not found
                </p>
                <Link href="/writing" style={{ color: "var(--gold)" }}>
                    ← Back
                </Link>
            </div>
        );
    }

    const overall = data.overallScore ?? 0;
    const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
        <div
            style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                ...extra,
            }}
        >
            {children}
        </div>
    );

    const sectionTitle = (text: string) => (
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
            {text}
        </p>
    );

    const skillBar = (label: string, score: number) => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
            }}
        >
            <span
                style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    width: 70,
                    fontWeight: 600,
                }}
            >
                {label}
            </span>
            <div
                style={{
                    flex: 1,
                    height: 6,
                    background: "var(--bg-elevated)",
                    borderRadius: 3,
                }}
            >
                <div
                    style={{
                        width: `${score}%`,
                        height: "100%",
                        background: scoreColor(score),
                        borderRadius: 3,
                        transition: "width 0.5s",
                    }}
                />
            </div>
            <span
                style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: scoreColor(score),
                    width: 28,
                    textAlign: "right",
                }}
            >
                {score}
            </span>
        </div>
    );

    return (
        <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
            {/* Header */}
            <div
                style={{
                    padding: "16px 16px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Link
                    href="/writing"
                    style={{
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                    }}
                >
                    <ArrowLeft size={18} /> Back
                </Link>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {data.wordCount} words ·{" "}
                    {Math.round(data.timeSpentSec / 60)} min
                </span>
            </div>

            <div style={{ padding: "0 16px" }}>
                {/* Prompt title */}
                {data.prompt && (
                    <p
                        style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            margin: "0 0 12px",
                            fontStyle: "italic",
                        }}
                    >
                        &ldquo;{data.prompt.instruction}&rdquo;
                    </p>
                )}

                {/* ─── OVERALL SCORE ─── */}
                {card(
                    <div style={{ textAlign: "center" }}>
                        {sectionTitle("Grading Result")}
                        <p
                            style={{
                                fontSize: 56,
                                fontWeight: 900,
                                margin: "0 0 2px",
                                fontFamily: "var(--font-display)",
                                color: scoreColor(overall),
                                textShadow: `0 0 30px color-mix(in srgb, ${scoreColor(overall)} 40%, transparent)`,
                            }}
                        >
                            {overall}
                        </p>
                        <p
                            style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                                margin: "0 0 8px",
                            }}
                        >
                            /100
                        </p>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            {data.improvementVsLast !== null && (
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color:
                                            data.improvementVsLast >= 0
                                                ? "var(--emerald)"
                                                : "var(--ruby)",
                                    }}
                                >
                                    {data.improvementVsLast >= 0 ? (
                                        <TrendingUp size={14} />
                                    ) : (
                                        <TrendingDown size={14} />
                                    )}
                                    {data.improvementVsLast >= 0 ? "+" : ""}
                                    {data.improvementVsLast} từ bài trước
                                </span>
                            )}
                            {data.isPersonalBest && (
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: "var(--gold)",
                                    }}
                                >
                                    <Trophy size={14} /> Personal Best!
                                </span>
                            )}
                        </div>
                    </div>,
                )}

                {/* ─── BREAKDOWN ─── */}
                {card(
                    <>
                        {sectionTitle("Breakdown")}
                        {skillBar("Grammar", data.grammarScore ?? 0)}
                        {skillBar("Vocabulary", data.vocabScore ?? 0)}
                        {skillBar("Coherence", data.coherenceScore ?? 0)}
                        {skillBar("Task", data.taskScore ?? 0)}
                    </>,
                )}

                {/* ─── AI FEEDBACK ─── */}
                {data.aiFeedback &&
                    card(
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginBottom: 8,
                                }}
                            >
                                <Sparkles size={14} color="var(--gold)" />
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        color: "var(--gold)",
                                        textTransform: "uppercase" as const,
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    SENSEI nhận xét
                                </span>
                            </div>
                            <p
                                style={{
                                    fontSize: 13,
                                    lineHeight: 1.7,
                                    color: "var(--text-secondary)",
                                    margin: 0,
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                {data.aiFeedback}
                            </p>
                        </>,
                    )}

                {/* ─── GRAMMAR ERRORS ─── */}
                {data.grammarErrors.length > 0 &&
                    card(
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginBottom: 10,
                                }}
                            >
                                <AlertCircle size={14} color="var(--ruby)" />
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        color: "var(--ruby)",
                                        textTransform: "uppercase" as const,
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    Lỗi cần sửa ({data.grammarErrors.length})
                                </span>
                            </div>
                            {data.grammarErrors.map((err, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: 10,
                                        borderRadius: 10,
                                        marginBottom:
                                            i < data.grammarErrors.length - 1
                                                ? 8
                                                : 0,
                                        background: "rgba(248,113,113,0.05)",
                                        border: "1px solid rgba(248,113,113,0.12)",
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: "var(--text-muted)",
                                            margin: "0 0 6px",
                                        }}
                                    >
                                        #{i + 1}{" "}
                                        {ERROR_TYPE_LABELS[err.type] ??
                                            err.type}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            margin: "0 0 2px",
                                        }}
                                    >
                                        <span style={{ color: "var(--ruby)" }}>
                                            ❌{" "}
                                        </span>
                                        <span
                                            style={{
                                                color: "var(--ruby)",
                                                textDecoration: "line-through",
                                                opacity: 0.8,
                                            }}
                                        >
                                            {err.original}
                                        </span>
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            margin: "0 0 4px",
                                        }}
                                    >
                                        <span
                                            style={{ color: "var(--emerald)" }}
                                        >
                                            ✅{" "}
                                        </span>
                                        <span
                                            style={{
                                                color: "var(--emerald)",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {err.corrected}
                                        </span>
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-muted)",
                                            margin: 0,
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 4,
                                        }}
                                    >
                                        <Lightbulb
                                            size={12}
                                            style={{
                                                flexShrink: 0,
                                                marginTop: 2,
                                            }}
                                        />
                                        {err.explanation}
                                    </p>
                                </div>
                            ))}
                        </>,
                    )}

                {/* ─── VOCAB SUGGESTIONS ─── */}
                {data.vocabSuggestions.length > 0 &&
                    card(
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginBottom: 10,
                                }}
                            >
                                <Lightbulb size={14} color="var(--cyan)" />
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        color: "var(--cyan)",
                                        textTransform: "uppercase" as const,
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    Gợi ý từ vựng (
                                    {data.vocabSuggestions.length})
                                </span>
                            </div>
                            {data.vocabSuggestions.map((s, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "6px 0",
                                        borderBottom:
                                            i < data.vocabSuggestions.length - 1
                                                ? "1px solid var(--border-subtle)"
                                                : "none",
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: 13,
                                            margin: "0 0 2px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            &ldquo;{s.original}&rdquo;
                                        </span>
                                        <span
                                            style={{
                                                color: "var(--text-muted)",
                                                margin: "0 6px",
                                            }}
                                        >
                                            →
                                        </span>
                                        <span
                                            style={{
                                                color: "var(--cyan)",
                                                fontWeight: 700,
                                            }}
                                        >
                                            &ldquo;{s.better_option}&rdquo;
                                        </span>
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-muted)",
                                            margin: 0,
                                        }}
                                    >
                                        {s.reason}
                                    </p>
                                </div>
                            ))}
                        </>,
                    )}

                {/* ─── REWRITE SAMPLE ─── */}
                {data.rewriteSample &&
                    card(
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginBottom: 8,
                                }}
                            >
                                <Sparkles
                                    size={14}
                                    color="var(--violet-bright)"
                                />
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        color: "var(--violet-bright)",
                                        textTransform: "uppercase" as const,
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    Bài mẫu (đoạn cải tiến)
                                </span>
                            </div>
                            <p
                                style={{
                                    fontSize: 13,
                                    lineHeight: 1.8,
                                    color: "var(--text-secondary)",
                                    margin: 0,
                                    padding: 12,
                                    borderRadius: 10,
                                    background: "rgba(139,92,246,0.06)",
                                    border: "1px solid rgba(139,92,246,0.12)",
                                    fontFamily: "var(--font-body)",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {data.rewriteSample}
                            </p>
                        </>,
                    )}

                {/* ─── STRENGTHS & IMPROVEMENTS ─── */}
                {(data.strengths.length > 0 || data.improvements.length > 0) &&
                    card(
                        <>
                            {data.strengths.length > 0 && (
                                <>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <TrendingUp
                                            size={14}
                                            color="var(--emerald)"
                                        />
                                        <span
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.12em",
                                                color: "var(--emerald)",
                                                textTransform:
                                                    "uppercase" as const,
                                                fontFamily:
                                                    "var(--font-display)",
                                            }}
                                        >
                                            Điểm mạnh
                                        </span>
                                    </div>
                                    {data.strengths.map((s, i) => (
                                        <p
                                            key={i}
                                            style={{
                                                fontSize: 12,
                                                color: "var(--text-secondary)",
                                                margin: "0 0 4px",
                                                paddingLeft: 20,
                                            }}
                                        >
                                            ✅ {s}
                                        </p>
                                    ))}
                                </>
                            )}
                            {data.improvements.length > 0 && (
                                <>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            marginTop:
                                                data.strengths.length > 0
                                                    ? 10
                                                    : 0,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <AlertCircle
                                            size={14}
                                            color="var(--amber)"
                                        />
                                        <span
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.12em",
                                                color: "var(--amber)",
                                                textTransform:
                                                    "uppercase" as const,
                                                fontFamily:
                                                    "var(--font-display)",
                                            }}
                                        >
                                            Cần cải thiện
                                        </span>
                                    </div>
                                    {data.improvements.map((s, i) => (
                                        <p
                                            key={i}
                                            style={{
                                                fontSize: 12,
                                                color: "var(--text-secondary)",
                                                margin: "0 0 4px",
                                                paddingLeft: 20,
                                            }}
                                        >
                                            ⚡ {s}
                                        </p>
                                    ))}
                                </>
                            )}
                        </>,
                    )}

                {/* ─── COMPARISON (Rewrite mode) ─── */}
                {data.parentSubmission &&
                    data.improvementVsLast !== null &&
                    card(
                        <>
                            {sectionTitle("So sánh với bài gốc")}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: 16,
                                    marginBottom: 8,
                                }}
                            >
                                <div style={{ textAlign: "center" }}>
                                    <p
                                        style={{
                                            fontSize: 9,
                                            color: "var(--text-muted)",
                                            margin: "0 0 2px",
                                        }}
                                    >
                                        Bài gốc
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 20,
                                            fontWeight: 800,
                                            color: scoreColor(
                                                data.parentSubmission
                                                    .overallScore ?? 0,
                                            ),
                                            margin: 0,
                                            fontFamily: "var(--font-display)",
                                        }}
                                    >
                                        {data.parentSubmission.overallScore ??
                                            "—"}
                                    </p>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        fontSize: 18,
                                        fontWeight: 800,
                                        color:
                                            (data.improvementVsLast ?? 0) >= 0
                                                ? "var(--emerald)"
                                                : "var(--ruby)",
                                    }}
                                >
                                    →{" "}
                                    {(data.improvementVsLast ?? 0) >= 0
                                        ? "+"
                                        : ""}
                                    {data.improvementVsLast}
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <p
                                        style={{
                                            fontSize: 9,
                                            color: "var(--text-muted)",
                                            margin: "0 0 2px",
                                        }}
                                    >
                                        Viết lại
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 20,
                                            fontWeight: 800,
                                            color: scoreColor(overall),
                                            margin: 0,
                                            fontFamily: "var(--font-display)",
                                        }}
                                    >
                                        {overall}
                                    </p>
                                </div>
                            </div>
                        </>,
                    )}
                <button
                    onClick={() => setShowContent(!showContent)}
                    style={{
                        width: "100%",
                        padding: "10px 0",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        marginBottom: 10,
                    }}
                >
                    {showContent
                        ? "Ẩn bài viết"
                        : "📝 Xem bài viết (lỗi highlight)"}
                </button>
                {showContent &&
                    card(
                        <SubmissionViewer
                            content={data.content}
                            errors={data.grammarErrors}
                        />,
                    )}

                {/* ─── ACTIONS ─── */}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {data.prompt && (
                        <Link
                            href={`/writing/${data.prompt.id}?rewrite=${data.id}`}
                            style={{
                                flex: 2,
                                padding: "12px 0",
                                borderRadius: 12,
                                fontSize: 13,
                                fontWeight: 700,
                                fontFamily: "var(--font-display)",
                                textDecoration: "none",
                                textAlign: "center",
                                background: "var(--gold)",
                                color: "var(--bg-base)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                            }}
                        >
                            <PenTool size={14} /> Viết lại
                        </Link>
                    )}
                    <Link
                        href="/writing"
                        style={{
                            flex: 1,
                            padding: "12px 0",
                            borderRadius: 12,
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: "var(--font-display)",
                            textDecoration: "none",
                            textAlign: "center",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        Đề mới
                    </Link>
                </div>

                {/* Rewrites */}
                {data.rewrites.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                        {sectionTitle("Các lần viết lại")}
                        {data.rewrites.map((r) => (
                            <Link
                                key={r.id}
                                href={`/writing/result/${r.id}`}
                                style={{ textDecoration: "none" }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "8px 12px",
                                        borderRadius: 10,
                                        marginBottom: 4,
                                        background: "var(--bg-elevated)",
                                        border: "1px solid var(--border-subtle)",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        {new Date(
                                            r.submittedAt,
                                        ).toLocaleDateString("vi-VN")}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: scoreColor(
                                                r.overallScore ?? 0,
                                            ),
                                        }}
                                    >
                                        {r.overallScore ?? "—"}/100
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
