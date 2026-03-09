"use client";

import { useEffect, useState, useCallback } from "react";
import { PenLine, BookOpen, Bot, Bookmark } from "lucide-react";

interface JournalEntry {
    id: string;
    content: string;
    wordCount: number;
    newWords: string;
    grammar: string;
    difficulty: string;
    date: string;
    createdAt: string;
}

interface JournalStats {
    totalEntries: number;
    totalWords: number;
    avgWords: number;
    journalStreak: number;
}

const DIFFICULTY_CONFIG = {
    easy: {
        emoji: "😊",
        color: "var(--emerald)",
        bg: "var(--emerald-dim)",
        border: "rgba(52,211,153,0.3)",
    },
    medium: {
        emoji: "🤔",
        color: "var(--gold)",
        bg: "var(--gold-dim)",
        border: "rgba(245,200,66,0.3)",
    },
    hard: {
        emoji: "😤",
        color: "var(--ruby)",
        bg: "var(--ruby-dim)",
        border: "rgba(248,113,113,0.3)",
    },
};

export default function JournalPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [stats, setStats] = useState<JournalStats>({
        totalEntries: 0,
        totalWords: 0,
        avgWords: 0,
        journalStreak: 0,
    });
    const [calendarDates, setCalendarDates] = useState<string[]>([]);
    const [content, setContent] = useState("");
    const [newWords, setNewWords] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [view, setView] = useState<"write" | "history">("write");
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    const fetchJournal = useCallback(async () => {
        try {
            const res = await fetch("/api/journal");
            if (!res.ok) throw new Error("API");
            const data = await res.json();
            setEntries(data.entries ?? []);
            setStats(
                data.stats ?? {
                    totalEntries: 0,
                    totalWords: 0,
                    avgWords: 0,
                    journalStreak: 0,
                },
            );
            setCalendarDates(data.calendarDates ?? []);
            const today = new Date().toISOString().slice(0, 10);
            const todayEntry = data.entries?.find(
                (e: JournalEntry) => e.date === today,
            );
            if (todayEntry) {
                setContent(todayEntry.content);
                setNewWords(todayEntry.newWords);
                setDifficulty(todayEntry.difficulty);
            }
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJournal();
    }, [fetchJournal]);

    const handleSubmit = async () => {
        if (content.trim().length < 10) {
            setToast("Write at least 10 characters");
            setTimeout(() => setToast(null), 3000);
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, newWords, difficulty }),
            });
            const data = await res.json();
            if (data.success) {
                setToast(
                    `Saved! +${data.expGain} EXP · ${data.wordCount} words`,
                );
                await fetchJournal();
            } else {
                setToast(data.error || "Error saving");
            }
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast("Error saving");
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleAiFeedback = async () => {
        if (content.trim().length < 20) {
            setToast("Write at least 20 characters for AI feedback");
            setTimeout(() => setToast(null), 3000);
            return;
        }
        setLoadingFeedback(true);
        setAiFeedback(null);
        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "chat",
                    mode: "free_talk",
                    messages: [
                        {
                            role: "system",
                            content: `You are an English writing tutor for a Vietnamese learner. Analyze the following journal entry and provide feedback in this format:\n\n## ✅ Điểm mạnh\n- [1-2 things done well]\n\n## 📝 Sửa lỗi\n- ❌ [original] → ✅ [corrected] · [explanation in Vietnamese]\n(List all grammar/vocabulary errors)\n\n## 💡 Gợi ý cải thiện\n- [2-3 tips to improve, in Vietnamese]\n\n## 📚 Từ vựng nên học\n- [3-5 useful words/phrases related to the topic, with Vietnamese translation]\n\nKeep it concise and encouraging. Max 250 words.`,
                        },
                        { role: "user", content },
                    ],
                }),
            });
            const data = await res.json();
            if (data.reply) setAiFeedback(data.reply);
            else {
                setToast(data.error || "AI feedback failed");
                setTimeout(() => setToast(null), 3000);
            }
        } catch {
            setToast("AI feedback error");
            setTimeout(() => setToast(null), 3000);
        } finally {
            setLoadingFeedback(false);
        }
    };

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    const calendarDays: {
        date: string;
        isToday: boolean;
        hasEntry: boolean;
    }[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const isToday = i === 0;
        calendarDays.push({
            date: dateStr,
            isToday,
            hasEntry: calendarDates.includes(dateStr),
        });
    }

    if (loading) {
        return (
            <div style={{ paddingTop: "8px" }}>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="skeleton"
                        style={{
                            height: 70,
                            borderRadius: 16,
                            marginBottom: 10,
                        }}
                    />
                ))}
            </div>
        );
    }

    const diffCfg =
        DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG] ??
        DIFFICULTY_CONFIG.medium;

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
            {toast && (
                <div className="toast animate-scale-in">
                    <div
                        className="glass-card"
                        style={{
                            padding: "13px 18px",
                            borderColor: "rgba(52,211,153,0.3)",
                        }}
                    >
                        <p
                            style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                textAlign: "center",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            {toast}
                        </p>
                    </div>
                </div>
            )}

            {/* ─── HEADER ─── */}
            <div
                className="animate-fade-in-up"
                style={{ marginBottom: "16px" }}
            >
                <h1
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "22px",
                        fontWeight: 800,
                        margin: "0 0 4px",
                    }}
                >
                    English Journal
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        margin: 0,
                    }}
                >
                    Write daily to improve your English
                </p>
            </div>

            {/* ─── STATS ROW ─── */}
            <div
                className="animate-fade-in-up stagger-1"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "6px",
                    marginBottom: "12px",
                }}
            >
                {[
                    {
                        value: stats.totalEntries,
                        label: "Entries",
                        color: "var(--violet)",
                    },
                    {
                        value: stats.totalWords,
                        label: "Words",
                        color: "var(--emerald)",
                    },
                    {
                        value: stats.avgWords,
                        label: "Avg/Entry",
                        color: "var(--gold)",
                    },
                    {
                        value: stats.journalStreak,
                        label: "Streak",
                        color: "var(--ruby)",
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="glass-card"
                        style={{ padding: "10px", textAlign: "center" }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "17px",
                                fontWeight: 600,
                                color: item.color,
                                margin: "0 0 2px",
                            }}
                        >
                            {item.value}
                        </p>
                        <p
                            style={{
                                fontSize: "9px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                                margin: 0,
                                letterSpacing: "0.04em",
                            }}
                        >
                            {item.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* ─── CALENDAR STRIP ─── */}
            <div
                className="glass-card animate-fade-in-up stagger-2"
                style={{ padding: "12px 14px", marginBottom: "12px" }}
            >
                <h3
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "var(--text-muted)",
                        margin: "0 0 10px",
                        textTransform: "uppercase",
                    }}
                >
                    Last 30 Days
                </h3>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(10, 1fr)",
                        gap: "4px",
                    }}
                >
                    {calendarDays.map((day) => (
                        <div
                            key={day.date}
                            title={day.date}
                            style={{
                                width: "100%",
                                aspectRatio: "1",
                                borderRadius: "5px",
                                background: day.hasEntry
                                    ? "var(--emerald)"
                                    : "var(--bg-raised)",
                                border: day.isToday
                                    ? "2px solid var(--gold)"
                                    : "none",
                                boxShadow: day.hasEntry
                                    ? "0 0 6px rgba(52,211,153,0.3)"
                                    : "none",
                                transition: "all 0.2s",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* ─── TAB TOGGLE ─── */}
            <div
                className="animate-fade-in-up stagger-3"
                style={{ display: "flex", gap: "6px", marginBottom: "12px" }}
            >
                {(["write", "history"] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        style={{
                            flex: 1,
                            minHeight: 44,
                            borderRadius: 12,
                            fontFamily: "var(--font-body)",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                            background:
                                view === v
                                    ? "linear-gradient(135deg, var(--gold-muted), var(--gold))"
                                    : "var(--bg-raised)",
                            color: view === v ? "#07080D" : "var(--text-muted)",
                            transition: "all 0.2s",
                        }}
                    >
                        {v === "write"
                            ? "Write"
                            : `History (${entries.length})`}
                    </button>
                ))}
            </div>

            {/* ─── WRITE VIEW ─── */}
            {view === "write" && (
                <div className="animate-fade-in-up">
                    {/* Textarea */}
                    <div
                        className="glass-card"
                        style={{ padding: "16px", marginBottom: "10px" }}
                    >
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={
                                "Write about your day in English...\n\nWhat did you learn today?\nWhat was challenging?"
                            }
                            style={{
                                width: "100%",
                                minHeight: "180px",
                                background: "transparent",
                                border: "none",
                                color: "var(--text-primary)",
                                fontSize: "16px",
                                lineHeight: "1.8",
                                resize: "vertical",
                                outline: "none",
                                fontFamily: "var(--font-body)",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingTop: "10px",
                                borderTop: "1px solid rgba(255,255,255,0.05)",
                                flexWrap: "wrap",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontFamily: "var(--font-mono)",
                                    color:
                                        wordCount >= 100
                                            ? "var(--emerald)"
                                            : "var(--text-muted)",
                                }}
                            >
                                {wordCount} words{" "}
                                {wordCount >= 100
                                    ? "✨ Bonus EXP!"
                                    : "(100+ for bonus)"}
                            </span>
                            <div style={{ display: "flex", gap: "5px" }}>
                                {(["easy", "medium", "hard"] as const).map(
                                    (d) => {
                                        const cfg = DIFFICULTY_CONFIG[d];
                                        return (
                                            <button
                                                key={d}
                                                onClick={() => setDifficulty(d)}
                                                style={{
                                                    fontSize: "11px",
                                                    padding: "5px 10px",
                                                    borderRadius: "99px",
                                                    border: `1px solid ${difficulty === d ? cfg.border : "transparent"}`,
                                                    background:
                                                        difficulty === d
                                                            ? cfg.bg
                                                            : "var(--bg-raised)",
                                                    color:
                                                        difficulty === d
                                                            ? cfg.color
                                                            : "var(--text-muted)",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    fontFamily:
                                                        "var(--font-body)",
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                {cfg.emoji} {d}
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    </div>

                    {/* New Words */}
                    <div
                        className="glass-card"
                        style={{ padding: "14px", marginBottom: "10px" }}
                    >
                        <label
                            style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                display: "block",
                                marginBottom: "8px",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            New words learned today
                        </label>
                        <input
                            type="text"
                            value={newWords}
                            onChange={(e) => setNewWords(e.target.value)}
                            placeholder="e.g., resilient, procrastinate, coherent"
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                background: "var(--bg-raised)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "10px",
                                color: "var(--text-primary)",
                                fontSize: "16px",
                                fontFamily: "var(--font-body)",
                                outline: "none",
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="btn-primary"
                            style={{ flex: 2 }}
                        >
                            {saving ? "Saving..." : "Save Entry"}
                        </button>
                        <button
                            onClick={handleAiFeedback}
                            disabled={
                                loadingFeedback || content.trim().length < 20
                            }
                            style={{
                                flex: 1,
                                minHeight: 52,
                                borderRadius: 14,
                                background: "rgba(30,10,60,0.6)",
                                border: "1px solid rgba(167,139,250,0.3)",
                                color: "var(--violet)",
                                fontWeight: 600,
                                fontSize: "14px",
                                cursor:
                                    content.trim().length < 20
                                        ? "default"
                                        : "pointer",
                                fontFamily: "var(--font-body)",
                                opacity: content.trim().length < 20 ? 0.4 : 1,
                            }}
                        >
                            {loadingFeedback ? (
                                <span
                                    style={{
                                        display: "inline-flex",
                                        gap: 3,
                                        justifyContent: "center",
                                    }}
                                >
                                    {[0, 1, 2].map((i) => (
                                        <span
                                            key={i}
                                            style={{
                                                width: 5,
                                                height: 5,
                                                borderRadius: "50%",
                                                background: "var(--violet)",
                                                animation: `thinking-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                                            }}
                                        />
                                    ))}
                                </span>
                            ) : (
                                <>
                                    <Bot
                                        size={16}
                                        style={{
                                            display: "inline",
                                            verticalAlign: "middle",
                                            marginRight: "4px",
                                        }}
                                    />
                                    AI
                                </>
                            )}
                        </button>
                    </div>

                    {/* AI Feedback */}
                    {aiFeedback && (
                        <div
                            className="glass-card animate-fade-in-up"
                            style={{
                                padding: "16px",
                                marginTop: "12px",
                                borderColor: "rgba(167,139,250,0.25)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "12px",
                                }}
                            >
                                <h3
                                    style={{
                                        margin: 0,
                                        fontFamily: "var(--font-display)",
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        color: "var(--violet)",
                                    }}
                                >
                                    AI Writing Feedback
                                </h3>
                                <button
                                    onClick={() => setAiFeedback(null)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "var(--text-muted)",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <div
                                style={{
                                    fontSize: "13px",
                                    lineHeight: 1.7,
                                    color: "var(--text-secondary)",
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                {aiFeedback}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── HISTORY VIEW ─── */}
            {view === "history" && (
                <div
                    className="animate-fade-in-up"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    {entries.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "48px 16px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    marginBottom: "16px",
                                }}
                            >
                                <PenLine
                                    size={48}
                                    color="var(--text-muted)"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <h2
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "18px",
                                    color: "var(--text-primary)",
                                    marginBottom: "8px",
                                }}
                            >
                                Start your first entry
                            </h2>
                            <p
                                style={{
                                    fontSize: "13px",
                                    color: "var(--text-muted)",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                Track your journey · Write daily
                            </p>
                        </div>
                    ) : (
                        entries.map((entry) => {
                            const diffCfg =
                                DIFFICULTY_CONFIG[
                                    entry.difficulty as keyof typeof DIFFICULTY_CONFIG
                                ] ?? DIFFICULTY_CONFIG.medium;
                            return (
                                <div
                                    key={entry.id}
                                    className="glass-card"
                                    style={{ padding: "14px" }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: "var(--font-mono)",
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "var(--cyan)",
                                            }}
                                        >
                                            {entry.date}
                                        </span>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "10px",
                                                    padding: "2px 8px",
                                                    borderRadius: 99,
                                                    background: diffCfg.bg,
                                                    color: diffCfg.color,
                                                    fontFamily:
                                                        "var(--font-body)",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {diffCfg.emoji}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "11px",
                                                    color: "var(--text-muted)",
                                                    fontFamily:
                                                        "var(--font-mono)",
                                                }}
                                            >
                                                {entry.wordCount}w
                                            </span>
                                        </div>
                                    </div>
                                    <p
                                        style={{
                                            fontSize: "13px",
                                            color: "var(--text-secondary)",
                                            lineHeight: "1.6",
                                            margin: 0,
                                            overflow: "hidden",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient:
                                                "vertical" as const,
                                            fontFamily: "var(--font-body)",
                                        }}
                                    >
                                        {entry.content}
                                    </p>
                                    {entry.newWords && (
                                        <p
                                            style={{
                                                fontSize: "11px",
                                                color: "var(--emerald)",
                                                marginTop: "8px",
                                                fontFamily: "var(--font-body)",
                                            }}
                                        >
                                            New words: {entry.newWords}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
