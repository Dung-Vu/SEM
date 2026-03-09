"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Flag,
    Clock,
    Send,
    Headphones,
    Play,
    Grid3X3,
    X,
} from "lucide-react";

interface Question {
    id: string;
    section: string;
    level: string;
    topic: string | null;
    passage: string | null;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
}

interface ListeningPassage {
    questionId: string;
    transcript: string;
}

interface AnswerState {
    answer: string | null;
    flagged: boolean;
    timeStart: number;
}

export default function ExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId as string;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [listeningPassages, setListeningPassages] = useState<
        ListeningPassage[]
    >([]);
    const [timeLimit, setTimeLimit] = useState(60);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
    const answersRef = useRef<Record<string, AnswerState>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showNav, setShowNav] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [listenCounts, setListenCounts] = useState<Record<string, number>>(
        {},
    );
    const sessionStartRef = useRef(Date.now());
    const timeExpiredRef = useRef(false);
    const [timeExpired, setTimeExpired] = useState(false);

    // Load exam data from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem(`exam_${examId}`);
        if (stored) {
            const data = JSON.parse(stored);
            setQuestions(data.questions);
            setListeningPassages(data.listeningPassages || []);
            setTimeLimit(data.timeLimit);
            setTimeLeft(data.timeLimit * 60);
            // Init answer state
            const init: Record<string, AnswerState> = {};
            for (const q of data.questions) {
                init[q.id] = {
                    answer: null,
                    flagged: false,
                    timeStart: Date.now(),
                };
            }
            setAnswers(init);
            answersRef.current = init;
            setLoading(false);
        } else {
            // No data — redirect back
            router.push("/exam");
        }
    }, [examId, router]);

    // Timer countdown
    // Timer countdown — sets a flag when expired, actual submit happens via separate useEffect
    useEffect(() => {
        if (loading || submitting) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    timeExpiredRef.current = true;
                    setTimeExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [loading, submitting]);

    // Auto-submit when time expires (safe — runs outside state setter)
    useEffect(() => {
        if (timeExpired && !submitting) {
            handleSubmit();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeExpired]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const selectAnswer = useCallback(
        (qId: string, option: string) => {
            setAnswers((prev) => {
                const current = prev[qId];
                const newAnswer = current?.answer === option ? null : option;
                const updated = {
                    ...prev,
                    [qId]: { ...current, answer: newAnswer },
                };
                answersRef.current = updated;

                // Save answer to server (fire-and-forget) — computed from prev, not stale outer scope
                const timeSpent = Math.floor(
                    (Date.now() - (current?.timeStart ?? Date.now())) / 1000,
                );
                void fetch("/api/exam/answer", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        examId,
                        questionId: qId,
                        userAnswer: newAnswer,
                        timeSpent,
                    }),
                }).catch(() => {});

                return updated;
            });
        },
        [examId],
    );

    const toggleFlag = useCallback(
        (qId: string) => {
            setAnswers((prev) => {
                const current = prev[qId];
                const newFlagged = !current.flagged;
                const updated = {
                    ...prev,
                    [qId]: { ...current, flagged: newFlagged },
                };
                answersRef.current = updated;

                void fetch("/api/exam/answer", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        examId,
                        questionId: qId,
                        flagged: newFlagged,
                    }),
                }).catch(() => {});

                return updated;
            });
        },
        [examId],
    );

    const goTo = (idx: number) => {
        // Reset timeStart for next question
        const currentQ = questions[currentIdx];
        if (currentQ) {
            setAnswers((prev) => {
                const a = prev[currentQ.id];
                if (!a) return prev;
                const updated = {
                    ...prev,
                    [currentQ.id]: { ...a, timeStart: Date.now() },
                };
                answersRef.current = updated;
                return updated;
            });
        }
        setCurrentIdx(idx);
        setShowNav(false);
    };

    const playListening = (qId: string) => {
        const count = listenCounts[qId] ?? 0;
        if (count >= 2) return;

        const passage = listeningPassages.find((p) => p.questionId === qId);
        if (!passage) return;

        const utterance = new SpeechSynthesisUtterance(passage.transcript);
        utterance.lang = "en-US";
        const q = questions.find((q) => q.id === qId);
        const level = q?.level ?? "B2";
        utterance.rate = level === "B1" ? 0.9 : level === "C1" ? 1.1 : 1.0;
        speechSynthesis.speak(utterance);

        setListenCounts((prev) => ({ ...prev, [qId]: count + 1 }));
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        const totalTime = Math.floor(
            (Date.now() - sessionStartRef.current) / 1000,
        );
        try {
            const res = await fetch("/api/exam/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examId, timeSpent: totalTime }),
            });
            if (res.ok) {
                sessionStorage.removeItem(`exam_${examId}`);
                router.push(`/exam/result/${examId}`);
            }
        } catch {
            setSubmitting(false);
        }
    };

    const confirmSubmit = () => {
        const unanswered = questions.filter(
            (q) => !answers[q.id]?.answer,
        ).length;
        if (unanswered > 0) {
            setShowConfirm(true);
        } else {
            handleSubmit();
        }
    };

    if (loading) {
        return (
            <div style={{ paddingTop: 8 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 12,
                    }}
                >
                    <div
                        className="skeleton"
                        style={{ width: 80, height: 16, borderRadius: 6 }}
                    />
                    <div
                        className="skeleton"
                        style={{ width: 60, height: 16, borderRadius: 6 }}
                    />
                </div>
                <div
                    className="skeleton"
                    style={{
                        width: "100%",
                        height: 6,
                        borderRadius: 3,
                        marginBottom: 16,
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
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="skeleton"
                        style={{
                            width: "100%",
                            height: 48,
                            borderRadius: 12,
                            marginBottom: 8,
                        }}
                    />
                ))}
            </div>
        );
    }

    if (submitting) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                    gap: 16,
                }}
            >
                <span style={{ display: "inline-flex", gap: 3 }}>
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "var(--gold)",
                                animation: `thinking-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                            }}
                        />
                    ))}
                </span>
                <p
                    style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-display)",
                    }}
                >
                    Đang chấm bài...
                </p>
            </div>
        );
    }

    const q = questions[currentIdx];
    if (!q) return null;

    const isListening = q.section === "listening";
    const listCount = listenCounts[q.id] ?? 0;
    const hasPlayed = listCount >= 1; // Options visible only after first play for listening
    const answeredCount = questions.filter((q) => answers[q.id]?.answer).length;
    const progress = Math.round((answeredCount / questions.length) * 100);
    const isTimeLow = timeLeft <= 300; // 5 minutes

    const OPTIONS = ["A", "B", "C", "D"] as const;
    const optionValues: Record<string, string> = {
        A: q.optionA,
        B: q.optionB,
        C: q.optionC,
        D: q.optionD,
    };

    return (
        <div style={{ paddingTop: 4, paddingBottom: 16, minHeight: "100vh" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    marginBottom: 8,
                }}
            >
                <span
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                    }}
                >
                    Câu {currentIdx + 1}/{questions.length}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        onClick={() => setShowNav(true)}
                        style={{
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: 8,
                            padding: "4px 8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        <Grid3X3 size={14} color="var(--text-secondary)" />
                    </button>
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontFamily: "var(--font-mono)",
                            fontSize: 14,
                            fontWeight: 700,
                            color: isTimeLow
                                ? "var(--ruby)"
                                : "var(--text-primary)",
                        }}
                    >
                        <Clock size={14} />
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div
                style={{
                    height: 4,
                    borderRadius: 2,
                    background: "var(--bg-raised)",
                    marginBottom: 16,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: "var(--gold)",
                        borderRadius: 2,
                        transition: "width 0.3s",
                    }}
                />
            </div>

            {/* Section badge */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--cyan)",
                        fontFamily: "var(--font-display)",
                        background: "rgba(56,189,248,0.1)",
                        padding: "3px 8px",
                        borderRadius: 6,
                    }}
                >
                    {q.section}
                </span>
                <button
                    onClick={() => toggleFlag(q.id)}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                    }}
                >
                    <Flag
                        size={16}
                        color={
                            answers[q.id]?.flagged
                                ? "var(--gold)"
                                : "var(--text-muted)"
                        }
                        fill={answers[q.id]?.flagged ? "var(--gold)" : "none"}
                        strokeWidth={2}
                    />
                </button>
            </div>

            {/* Passage (reading) */}
            {q.passage && !isListening && (
                <div
                    style={{
                        background: "var(--bg-raised)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 14,
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        maxHeight: 200,
                        overflowY: "auto",
                    }}
                >
                    {q.passage}
                </div>
            )}

            {/* Listening player */}
            {isListening && (
                <div
                    style={{
                        background: "var(--bg-raised)",
                        border: "1px solid rgba(56,189,248,0.2)",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 14,
                        textAlign: "center",
                    }}
                >
                    <Headphones
                        size={28}
                        color="var(--cyan)"
                        style={{ marginBottom: 8 }}
                    />
                    <p
                        style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            margin: "0 0 10px",
                        }}
                    >
                        Nghe đoạn hội thoại rồi chọn đáp án
                    </p>
                    <button
                        onClick={() => playListening(q.id)}
                        disabled={listCount >= 2}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: "none",
                            background:
                                listCount >= 2
                                    ? "var(--bg-elevated)"
                                    : "rgba(56,189,248,0.15)",
                            color:
                                listCount >= 2
                                    ? "var(--text-muted)"
                                    : "var(--cyan)",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: listCount >= 2 ? "not-allowed" : "pointer",
                        }}
                    >
                        <Play size={14} />
                        {listCount === 0
                            ? "Phát"
                            : listCount === 1
                              ? "Phát lại"
                              : "Đã nghe 2 lần"}
                    </button>
                    <p
                        style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
                            margin: "6px 0 0",
                        }}
                    >
                        Nghe lại: {2 - listCount}/2
                    </p>
                </div>
            )}

            {/* Question */}
            <p
                style={{
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: 1.6,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    marginBottom: 14,
                }}
            >
                {q.question}
            </p>

            {/* Options — hidden for listening until user has played audio */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 20,
                    opacity: isListening && !hasPlayed ? 0 : 1,
                    pointerEvents: isListening && !hasPlayed ? "none" : "auto",
                    transition: "opacity 0.3s",
                }}
            >
                {OPTIONS.map((opt) => {
                    const selected = answers[q.id]?.answer === opt;
                    return (
                        <button
                            key={opt}
                            onClick={() => selectAnswer(q.id, opt)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "12px 14px",
                                borderRadius: 12,
                                border: selected
                                    ? "2px solid var(--gold)"
                                    : "1px solid var(--border-subtle)",
                                background: selected
                                    ? "rgba(245,200,66,0.08)"
                                    : "var(--bg-elevated)",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.15s",
                            }}
                        >
                            <span
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    fontFamily: "var(--font-display)",
                                    background: selected
                                        ? "var(--gold)"
                                        : "var(--bg-raised)",
                                    color: selected
                                        ? "var(--bg-base)"
                                        : "var(--text-muted)",
                                    flexShrink: 0,
                                }}
                            >
                                {opt}
                            </span>
                            <span
                                style={{
                                    fontSize: 14,
                                    color: selected
                                        ? "var(--text-primary)"
                                        : "var(--text-secondary)",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                {optionValues[opt]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: "flex", gap: 8 }}>
                {currentIdx > 0 && (
                    <button
                        onClick={() => goTo(currentIdx - 1)}
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
                            color: "var(--text-secondary)",
                        }}
                    >
                        <ArrowLeft size={14} /> Trước
                    </button>
                )}
                {currentIdx < questions.length - 1 ? (
                    <button
                        onClick={() => goTo(currentIdx + 1)}
                        style={{
                            flex: 1,
                            padding: 12,
                            borderRadius: 12,
                            border: "none",
                            background: "var(--gold)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--bg-base)",
                        }}
                    >
                        Tiếp <ArrowRight size={14} />
                    </button>
                ) : (
                    <button
                        onClick={confirmSubmit}
                        style={{
                            flex: 1,
                            padding: 12,
                            borderRadius: 12,
                            border: "none",
                            background: "var(--emerald)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--bg-base)",
                        }}
                    >
                        <Send size={14} /> Nộp bài
                    </button>
                )}
            </div>

            {/* Question Navigator Modal */}
            {showNav && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        zIndex: 100,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                    }}
                    onClick={() => setShowNav(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: 430,
                            background: "var(--bg-elevated)",
                            borderRadius: "20px 20px 0 0",
                            padding: "16px 16px 24px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 14,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                }}
                            >
                                Danh sách câu hỏi
                            </span>
                            <button
                                onClick={() => setShowNav(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                <X size={18} color="var(--text-muted)" />
                            </button>
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(8, 1fr)",
                                gap: 6,
                                marginBottom: 16,
                            }}
                        >
                            {questions.map((q, i) => {
                                const a = answers[q.id];
                                const isCurrent = i === currentIdx;
                                let bg = "var(--bg-raised)";
                                let borderCol = "var(--border-subtle)";
                                let textCol = "var(--text-muted)";

                                if (a?.flagged) {
                                    bg = "rgba(56,189,248,0.15)";
                                    borderCol = "var(--cyan)";
                                    textCol = "var(--cyan)";
                                } else if (a?.answer) {
                                    bg = "rgba(245,200,66,0.15)";
                                    borderCol = "var(--gold)";
                                    textCol = "var(--gold)";
                                }

                                if (isCurrent) {
                                    borderCol = "var(--text-primary)";
                                }

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => goTo(i)}
                                        style={{
                                            width: "100%",
                                            aspectRatio: "1",
                                            borderRadius: 6,
                                            border: `1.5px solid ${borderCol}`,
                                            background: bg,
                                            color: textCol,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            fontFamily: "var(--font-mono)",
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => {
                                setShowNav(false);
                                confirmSubmit();
                            }}
                            style={{
                                width: "100%",
                                padding: 12,
                                borderRadius: 12,
                                border: "none",
                                background: "var(--emerald)",
                                color: "var(--bg-base)",
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: "pointer",
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            Nộp bài
                        </button>
                    </div>
                </div>
            )}

            {/* Submit Confirmation Dialog */}
            {showConfirm && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        zIndex: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                    }}
                    onClick={() => setShowConfirm(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "var(--bg-elevated)",
                            borderRadius: 16,
                            padding: 24,
                            maxWidth: 320,
                            width: "100%",
                            textAlign: "center",
                        }}
                    >
                        <p
                            style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: 8,
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            Nộp bài?
                        </p>
                        <p
                            style={{
                                fontSize: 13,
                                color: "var(--text-secondary)",
                                marginBottom: 20,
                            }}
                        >
                            Còn{" "}
                            {
                                questions.filter((q) => !answers[q.id]?.answer)
                                    .length
                            }{" "}
                            câu chưa trả lời
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => setShowConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: 10,
                                    borderRadius: 10,
                                    border: "1px solid var(--border-subtle)",
                                    background: "var(--bg-raised)",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                }}
                            >
                                Tiếp tục
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    handleSubmit();
                                }}
                                style={{
                                    flex: 1,
                                    padding: 10,
                                    borderRadius: 10,
                                    border: "none",
                                    background: "var(--emerald)",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    color: "var(--bg-base)",
                                }}
                            >
                                Nộp bài
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
