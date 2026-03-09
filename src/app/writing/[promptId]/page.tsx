"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowLeft, Loader2, Clock, Send, Eye, EyeOff } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface PromptData {
    id: string;
    title: string;
    instruction: string;
    type: string;
    level: string;
    minWords: number;
    maxWords: number;
    timeLimit: number | null;
}

const LEVEL_COLORS: Record<string, string> = {
    B1: "var(--emerald)",
    B2: "var(--gold)",
    C1: "var(--violet-bright)",
    C2: "var(--ruby)",
};

export default function WritingEditorPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const promptId = params.promptId as string;
    const rewriteId = searchParams.get("rewrite");

    const [prompt, setPrompt] = useState<PromptData | null>(null);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [startTime] = useState(() => Date.now());
    const [elapsed, setElapsed] = useState(0);
    const [draftRestored, setDraftRestored] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const autoSaveRef = useRef<ReturnType<typeof setInterval> | undefined>(
        undefined,
    );

    // Rewrite mode state
    const [originalContent, setOriginalContent] = useState<string | null>(null);
    const [originalErrors, setOriginalErrors] = useState<
        { original: string; corrected: string; type: string }[]
    >([]);
    const [showReference, setShowReference] = useState(false);

    // Fetch prompt
    useEffect(() => {
        fetch(`/api/writing/prompts?type=&level=`)
            .then((r) => r.json())
            .then((json) => {
                const found = (json.prompts as PromptData[])?.find(
                    (p) => p.id === promptId,
                );
                if (found) setPrompt(found);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [promptId]);

    // Fetch original submission for rewrite mode
    useEffect(() => {
        if (!rewriteId) return;
        fetch(`/api/writing/submissions?id=${rewriteId}`)
            .then((r) => r.json())
            .then((json) => {
                if (json.submission) {
                    setOriginalContent(json.submission.content);
                    setOriginalErrors(
                        Array.isArray(json.submission.grammarErrors)
                            ? json.submission.grammarErrors
                            : [],
                    );
                    setShowReference(true);
                }
            })
            .catch(() => {});
    }, [rewriteId]);

    // Restore draft from localStorage
    useEffect(() => {
        const key = `writing_draft_${promptId}`;
        const saved = localStorage.getItem(key);
        if (saved && !draftRestored) {
            setContent(saved);
            setDraftRestored(true);
        }
    }, [promptId, draftRestored]);

    // Auto-save draft every 30 seconds
    useEffect(() => {
        autoSaveRef.current = setInterval(() => {
            if (content.trim().length > 0) {
                localStorage.setItem(`writing_draft_${promptId}`, content);
            }
        }, 30000);
        return () => clearInterval(autoSaveRef.current);
    }, [content, promptId]);

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const wordCount =
        content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;
    const minWords = prompt?.minWords ?? 150;
    const maxWords = prompt?.maxWords ?? 350;
    const progress = Math.min(100, Math.round((wordCount / minWords) * 100));
    const canSubmit = wordCount >= minWords && !submitting;

    // Timer display
    const remaining = prompt?.timeLimit
        ? Math.max(0, prompt.timeLimit * 60 - elapsed)
        : null;
    const timedOut = remaining !== null && remaining <= 0;

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const getProgressColor = useCallback(() => {
        if (wordCount < minWords) return "var(--ruby)";
        if (wordCount > maxWords) return "var(--amber)";
        return "var(--gold)";
    }, [wordCount, minWords, maxWords]);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);

        try {
            const timeSpentSec = Math.floor((Date.now() - startTime) / 1000);

            // Use rewrite endpoint if in rewrite mode
            const endpoint = rewriteId
                ? "/api/writing/rewrite"
                : "/api/writing/submit";
            const body = rewriteId
                ? { parentSubmissionId: rewriteId, content, timeSpentSec }
                : { promptId, content, timeSpentSec };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();

            // Clear draft
            localStorage.removeItem(`writing_draft_${promptId}`);

            if (json.submissionId) {
                router.push(`/writing/result/${json.submissionId}`);
            }
        } catch {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ paddingTop: 8 }}>
                <div
                    className="skeleton"
                    style={{
                        width: 100,
                        height: 18,
                        marginBottom: 12,
                        borderRadius: 6,
                    }}
                />
                <div
                    className="skeleton"
                    style={{
                        width: "100%",
                        height: 40,
                        borderRadius: 12,
                        marginBottom: 16,
                    }}
                />
                <div
                    className="skeleton"
                    style={{
                        width: "100%",
                        height: 280,
                        borderRadius: 16,
                        marginBottom: 12,
                    }}
                />
                <div
                    className="skeleton"
                    style={{ width: "100%", height: 52, borderRadius: 14 }}
                />
            </div>
        );
    }

    if (!prompt) {
        return (
            <div style={{ padding: 20, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)" }}>Prompt not found</p>
                <Link href="/writing" style={{ color: "var(--gold)" }}>
                    ← Back
                </Link>
            </div>
        );
    }

    return (
        <div
            style={{
                maxWidth: 480,
                margin: "0 auto",
                paddingBottom: 100,
                display: "flex",
                flexDirection: "column",
                minHeight: "100dvh",
            }}
        >
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase" as const,
                            color:
                                LEVEL_COLORS[prompt.level] ??
                                "var(--text-muted)",
                            background: `color-mix(in srgb, ${LEVEL_COLORS[prompt.level] ?? "var(--text-muted)"} 12%, transparent)`,
                            padding: "2px 8px",
                            borderRadius: 6,
                        }}
                    >
                        {prompt.level}
                    </span>
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "capitalize" as const,
                            color: "var(--text-muted)",
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-subtle)",
                        }}
                    >
                        {prompt.type}
                    </span>
                </div>
            </div>

            {/* Prompt */}
            <div style={{ padding: "0 16px 12px" }}>
                <div
                    style={{
                        background: "var(--bg-raised)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 14,
                        padding: 16,
                    }}
                >
                    <p
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            margin: "0 0 6px",
                            lineHeight: 1.5,
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        &ldquo;{prompt.instruction}&rdquo;
                    </p>
                    <p
                        style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            margin: 0,
                        }}
                    >
                        {prompt.minWords}–{prompt.maxWords} words
                        {prompt.timeLimit
                            ? ` · ${prompt.timeLimit} min limit`
                            : " · No time limit"}
                    </p>
                </div>
            </div>

            {/* Rewrite reference panel */}
            {rewriteId && originalContent && (
                <div style={{ padding: "0 16px 8px" }}>
                    <button
                        onClick={() => setShowReference(!showReference)}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "var(--font-display)",
                            background: showReference
                                ? "rgba(139,92,246,0.1)"
                                : "var(--bg-elevated)",
                            border: showReference
                                ? "1px solid rgba(139,92,246,0.3)"
                                : "1px solid var(--border-subtle)",
                            color: showReference
                                ? "var(--violet-bright)"
                                : "var(--text-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            transition: "all 0.15s",
                        }}
                    >
                        {showReference ? (
                            <EyeOff size={13} />
                        ) : (
                            <Eye size={13} />
                        )}
                        {showReference
                            ? "Ẩn bài gốc"
                            : "Xem bài gốc (có highlight lỗi)"}
                    </button>
                    {showReference && (
                        <div
                            style={{
                                marginTop: 8,
                                padding: 12,
                                borderRadius: 12,
                                background: "rgba(139,92,246,0.06)",
                                border: "1px solid rgba(139,92,246,0.15)",
                                maxHeight: 200,
                                overflowY: "auto",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    color: "var(--violet-bright)",
                                    textTransform: "uppercase" as const,
                                    margin: "0 0 6px",
                                }}
                            >
                                ✏️ Bài gốc — sửa những lỗi được đánh dấu
                            </p>
                            <p
                                style={{
                                    fontSize: 12,
                                    lineHeight: 1.7,
                                    color: "var(--text-secondary)",
                                    margin: 0,
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                {originalErrors.length > 0
                                    ? (() => {
                                          // Simple highlight: wrap each error in red styled spans
                                          const parts: React.ReactNode[] = [];
                                          let cursor = 0;
                                          const sorted = originalErrors
                                              .map((err) => ({
                                                  ...err,
                                                  pos: originalContent
                                                      .toLowerCase()
                                                      .indexOf(
                                                          err.original.toLowerCase(),
                                                      ),
                                              }))
                                              .filter((e) => e.pos >= 0)
                                              .sort((a, b) => a.pos - b.pos);
                                          for (const e of sorted) {
                                              if (e.pos < cursor) continue;
                                              if (e.pos > cursor) {
                                                  parts.push(
                                                      originalContent.slice(
                                                          cursor,
                                                          e.pos,
                                                      ),
                                                  );
                                              }
                                              parts.push(
                                                  <span
                                                      key={e.pos}
                                                      style={{
                                                          color: "var(--ruby)",
                                                          textDecoration:
                                                              "underline wavy",
                                                          textDecorationColor:
                                                              "var(--ruby)",
                                                          textUnderlineOffset:
                                                              "3px",
                                                          fontWeight: 600,
                                                      }}
                                                      title={`✅ ${e.corrected}`}
                                                  >
                                                      {originalContent.slice(
                                                          e.pos,
                                                          e.pos +
                                                              e.original.length,
                                                      )}
                                                  </span>,
                                              );
                                              cursor =
                                                  e.pos + e.original.length;
                                          }
                                          if (cursor < originalContent.length) {
                                              parts.push(
                                                  originalContent.slice(cursor),
                                              );
                                          }
                                          return parts;
                                      })()
                                    : originalContent}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Timer (if applicable) */}
            {remaining !== null && (
                <div
                    style={{
                        padding: "0 16px",
                        marginBottom: 8,
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            color:
                                remaining < 120
                                    ? "var(--ruby)"
                                    : "var(--text-muted)",
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        <Clock size={14} />
                        {formatTime(remaining)}
                    </span>
                </div>
            )}

            {/* Editor */}
            <div style={{ flex: 1, padding: "0 16px 12px" }}>
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing here..."
                    disabled={timedOut || submitting}
                    style={{
                        width: "100%",
                        minHeight: 280,
                        resize: "vertical",
                        padding: 16,
                        borderRadius: 14,
                        fontSize: 14,
                        lineHeight: 1.8,
                        fontFamily: "var(--font-body)",
                        background: "var(--bg-raised)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        outline: "none",
                    }}
                />
            </div>

            {/* Word count + Progress */}
            <div style={{ padding: "0 16px 6px" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: getProgressColor(),
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        {wordCount} / {minWords}–{maxWords} words
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {formatTime(elapsed)} elapsed
                    </span>
                </div>
                <div
                    style={{
                        height: 6,
                        background: "var(--bg-elevated)",
                        borderRadius: 3,
                    }}
                >
                    <div
                        style={{
                            width: `${Math.min(100, (wordCount / maxWords) * 100)}%`,
                            height: "100%",
                            borderRadius: 3,
                            background: getProgressColor(),
                            transition: "width 0.3s, background 0.3s",
                        }}
                    />
                </div>
            </div>

            {/* Submit */}
            <div style={{ padding: "12px 16px" }}>
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    style={{
                        width: "100%",
                        padding: "14px 0",
                        borderRadius: 14,
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "var(--font-display)",
                        border: "none",
                        background: canSubmit
                            ? "var(--gold)"
                            : "var(--bg-elevated)",
                        color: canSubmit
                            ? "var(--bg-base)"
                            : "var(--text-muted)",
                        cursor: canSubmit ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.2s",
                    }}
                >
                    {submitting ? (
                        <>
                            <Loader2
                                size={16}
                                style={{ animation: "spin 1s linear infinite" }}
                            />
                            🧠 SENSEI đang chấm bài...
                        </>
                    ) : (
                        <>
                            <Send size={16} />
                            Submit for Grading
                        </>
                    )}
                </button>
                {wordCount < minWords && wordCount > 0 && (
                    <p
                        style={{
                            fontSize: 11,
                            color: "var(--ruby)",
                            textAlign: "center",
                            margin: "6px 0 0",
                        }}
                    >
                        Cần thêm {minWords - wordCount} từ nữa
                    </p>
                )}
            </div>
        </div>
    );
}
