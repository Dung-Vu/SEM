"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Headphones,
    Library,
    Bot,
    PenLine,
    Target,
    Timer,
    Star,
} from "lucide-react";

interface ShadowLog {
    id: string;
    source: string;
    minutes: number;
    rating: number;
    date: string;
}

export default function ShadowPage() {
    const [mode, setMode] = useState<"script" | "generate" | "library" | null>(
        null,
    );
    const [script, setScript] = useState("");
    const [topic, setTopic] = useState("");
    const [generating, setGenerating] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [currentLine, setCurrentLine] = useState(-1);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [rating, setRating] = useState(3);
    const [toast, setToast] = useState<string | null>(null);
    const [logs, setLogs] = useState<ShadowLog[]>([]);
    const [saving, setSaving] = useState(false);
    // Library state
    const [libScripts, setLibScripts] = useState<
        {
            id: string;
            title: string;
            content: string;
            level: string;
            topic: string;
            durationSeconds: number;
            accent: string;
        }[]
    >([]);
    const [libFilter, setLibFilter] = useState("ALL");
    const [libLoading, setLibLoading] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const lines = script.split("\n").filter((l) => l.trim());

    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning]);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await fetch("/api/shadow");
            const data = await res.json();
            setLogs(data.sessions ?? []);
        } catch {
            /* empty */
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const fetchLibrary = useCallback(async () => {
        setLibLoading(true);
        try {
            const res = await fetch("/api/shadow/scripts");
            const data = await res.json();
            setLibScripts(data.scripts ?? []);
        } catch {
            /* empty */
        }
        setLibLoading(false);
    }, []);

    useEffect(() => {
        if (mode === "library" && libScripts.length === 0) fetchLibrary();
    }, [mode, libScripts.length, fetchLibrary]);

    const fmt = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    const generateScript = async () => {
        if (!topic.trim()) return;
        setGenerating(true);
        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "chat",
                    mode: "free_talk",
                    messages: [
                        {
                            role: "user",
                            content: `Generate a 1-2 minute English monologue script for shadowing practice about: "${topic}". Use clear, natural spoken English at B1-B2 level. Each sentence should be on a new line. No quotation marks. Just the script.`,
                        },
                    ],
                }),
            });
            const data = await res.json();
            if (data.reply) {
                setScript(data.reply);
                setMode("script");
            }
        } catch {
            setToast("Failed to generate script");
            setTimeout(() => setToast(null), 3000);
        }
        setGenerating(false);
    };

    const playLine = (idx: number) => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(lines[idx]);
            utterance.lang = "en-US";
            utterance.rate = 0.85;
            utterance.onend = () => setPlaying(false);
            setCurrentLine(idx);
            setPlaying(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    const playAll = () => {
        if (lines.length === 0) return;
        setIsTimerRunning(true);
        let idx = 0;
        const playNext = () => {
            if (idx >= lines.length) {
                setPlaying(false);
                return;
            }
            setCurrentLine(idx);
            setPlaying(true);
            const u = new SpeechSynthesisUtterance(lines[idx]);
            u.lang = "en-US";
            u.rate = 0.85;
            u.onend = () => {
                idx++;
                setTimeout(playNext, 400);
            };
            window.speechSynthesis.speak(u);
        };
        playNext();
    };

    const stopAll = () => {
        window.speechSynthesis.cancel();
        setPlaying(false);
        setCurrentLine(-1);
    };

    const saveSession = async () => {
        const minutes = Math.max(1, Math.floor(timer / 60));
        setSaving(true);
        try {
            const res = await fetch("/api/shadow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source: topic || "Custom script",
                    minutes,
                    rating,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setToast(`Saved! +${data.expGain} EXP`);
                setTimer(0);
                setIsTimerRunning(false);
                await fetchLogs();
            }
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast("Error saving");
            setTimeout(() => setToast(null), 3000);
        }
        setSaving(false);
    };

    // ─── Library View ───
    if (mode === "library") {
        const levelMeta: Record<
            string,
            { color: string; bg: string; border: string }
        > = {
            A2: {
                color: "var(--cyan)",
                bg: "rgba(34,211,238,0.08)",
                border: "rgba(34,211,238,0.3)",
            },
            B1: {
                color: "var(--gold)",
                bg: "rgba(245,200,66,0.08)",
                border: "rgba(245,200,66,0.3)",
            },
            B2: {
                color: "var(--violet)",
                bg: "rgba(167,139,250,0.08)",
                border: "rgba(167,139,250,0.3)",
            },
            C1: {
                color: "var(--ruby)",
                bg: "rgba(248,113,113,0.08)",
                border: "rgba(248,113,113,0.3)",
            },
        };
        const filtered =
            libFilter === "ALL"
                ? libScripts
                : libScripts.filter((s) => s.level === libFilter);
        return (
            <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "16px",
                    }}
                >
                    <button
                        onClick={() => setMode(null)}
                        style={{
                            background: "var(--border-subtle)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                            fontSize: "13px",
                        }}
                    >
                        ← Back
                    </button>
                    <h1
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "18px",
                            fontWeight: 800,
                            margin: 0,
                        }}
                    >
                        Scripts Library
                    </h1>
                </div>
                {/* Level filter */}
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "14px",
                        flexWrap: "wrap",
                    }}
                >
                    {["ALL", "A2", "B1", "B2", "C1"].map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => setLibFilter(lvl)}
                            style={{
                                padding: "5px 12px",
                                borderRadius: "99px",
                                cursor: "pointer",
                                fontFamily: "var(--font-body)",
                                fontSize: "13px",
                                fontWeight: 600,
                                border: `1px solid ${libFilter === lvl ? levelMeta[lvl]?.color || "var(--gold)" : "rgba(255,255,255,0.1)"}`,
                                background:
                                    libFilter === lvl
                                        ? levelMeta[lvl]?.bg ||
                                          "rgba(245,200,66,0.1)"
                                        : "rgba(255,255,255,0.04)",
                                color:
                                    libFilter === lvl
                                        ? levelMeta[lvl]?.color || "var(--gold)"
                                        : "var(--text-muted)",
                            }}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
                {libLoading ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <div
                            className="loading-spinner"
                            style={{ margin: "0 auto" }}
                        />
                    </div>
                ) : filtered.length === 0 ? (
                    <div
                        className="glass-card"
                        style={{ padding: "32px", textAlign: "center" }}
                    >
                        <p
                            style={{
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            No scripts available yet.
                        </p>
                    </div>
                ) : (
                    filtered.map((s) => {
                        const meta = levelMeta[s.level] ?? levelMeta.B1;
                        return (
                            <div
                                key={s.id}
                                className="glass-card animate-fade-in-up"
                                style={{
                                    padding: "14px 16px",
                                    marginBottom: "10px",
                                    borderLeft: `4px solid ${meta.border}`,
                                    cursor: "pointer",
                                }}
                                onClick={() => {
                                    setScript(s.content);
                                    setTopic(s.title);
                                    setMode("script");
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "4px",
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontFamily: "var(--font-display)",
                                            fontSize: "15px",
                                            fontWeight: 700,
                                            margin: 0,
                                        }}
                                    >
                                        {s.title}
                                    </h3>
                                    <span
                                        style={{
                                            padding: "2px 8px",
                                            borderRadius: "99px",
                                            background: meta.bg,
                                            color: meta.color,
                                            border: `1px solid ${meta.border}`,
                                            fontSize: "10px",
                                            fontWeight: 700,
                                            fontFamily: "var(--font-body)",
                                            flexShrink: 0,
                                            marginLeft: "8px",
                                        }}
                                    >
                                        {s.level}
                                    </span>
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "12px",
                                        color: "var(--text-muted)",
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    {s.topic} · ~{s.durationSeconds}s ·{" "}
                                    {s.accent}
                                </p>
                            </div>
                        );
                    })
                )}
            </div>
        );
    }

    // ─── Home Screen ───
    if (!mode) {
        return (
            <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
                {/* Header */}
                <div
                    className="animate-fade-in-up"
                    style={{ marginBottom: "20px" }}
                >
                    <h1
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "22px",
                            fontWeight: 800,
                            margin: "0 0 4px",
                        }}
                    >
                        Shadowing
                    </h1>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                            margin: 0,
                        }}
                    >
                        Luyện phát âm bằng cách nói theo text/audio
                    </p>
                </div>

                {/* Paste Script */}
                <div
                    className="glass-card animate-fade-in-up stagger-1"
                    style={{
                        padding: "16px",
                        marginBottom: "10px",
                        borderColor: "rgba(245,200,66,0.12)",
                    }}
                >
                    <h3
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "14px",
                            fontWeight: 700,
                            margin: "0 0 4px",
                            color: "var(--gold)",
                        }}
                    >
                        Paste Script
                    </h3>
                    <p
                        style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                            margin: "0 0 10px",
                        }}
                    >
                        Paste từ YouTube, podcast, hoặc bất kỳ nguồn nào
                    </p>
                    <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="Paste your script here... (one sentence per line)"
                        rows={4}
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "12px",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            resize: "vertical",
                            fontFamily: "var(--font-body)",
                            outline: "none",
                            marginBottom: "10px",
                        }}
                    />
                    <button
                        onClick={() => {
                            if (script.trim()) setMode("script");
                        }}
                        disabled={!script.trim()}
                        className="btn-primary"
                    >
                        Start Shadowing →
                    </button>
                </div>

                {/* Scripts Library */}
                <div
                    className="glass-card animate-fade-in-up stagger-2"
                    style={{
                        padding: "16px",
                        marginBottom: "10px",
                        borderColor: "rgba(34,211,238,0.12)",
                        cursor: "pointer",
                    }}
                    onClick={() => setMode("library")}
                >
                    <h3
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "14px",
                            fontWeight: 700,
                            margin: "0 0 4px",
                            color: "var(--cyan)",
                        }}
                    >
                        Scripts Library
                    </h3>
                    <p
                        style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                            margin: 0,
                        }}
                    >
                        Chọn script A2→C1 · Topics: Work, Finance, AI, Ethics
                    </p>
                </div>

                {/* AI Generate */}
                <div
                    className="glass-card animate-fade-in-up stagger-2"
                    style={{
                        padding: "16px",
                        marginBottom: "12px",
                        borderColor: "rgba(167,139,250,0.12)",
                    }}
                >
                    <h3
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "14px",
                            fontWeight: 700,
                            margin: "0 0 4px",
                            color: "var(--violet)",
                        }}
                    >
                        AI Generate Script
                    </h3>
                    <p
                        style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                            margin: "0 0 10px",
                        }}
                    >
                        Nhập chủ đề → AI tạo monologue 1-2 phút
                    </p>
                    <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. My morning routine, Climate change..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter") generateScript();
                        }}
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "12px",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            fontFamily: "var(--font-body)",
                            outline: "none",
                            marginBottom: "10px",
                        }}
                    />
                    <button
                        onClick={generateScript}
                        disabled={generating || !topic.trim()}
                        style={{
                            width: "100%",
                            minHeight: 52,
                            borderRadius: 14,
                            background: "rgba(30,10,60,0.6)",
                            border: "1px solid rgba(167,139,250,0.3)",
                            color: "var(--violet)",
                            fontFamily: "var(--font-display)",
                            fontSize: "15px",
                            fontWeight: 700,
                            cursor:
                                generating || !topic.trim()
                                    ? "default"
                                    : "pointer",
                            opacity: !topic.trim() ? 0.4 : 1,
                            transition: "all 0.2s",
                        }}
                    >
                        {generating ? "Generating..." : "Generate Script →"}
                    </button>
                </div>

                {/* Session History */}
                {logs.length > 0 && (
                    <div className="animate-fade-in-up stagger-3">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "8px",
                                paddingLeft: "4px",
                            }}
                        >
                            <div
                                style={{
                                    width: 3,
                                    height: 14,
                                    borderRadius: 99,
                                    background: "var(--text-muted)",
                                }}
                            />
                            <h3
                                style={{
                                    margin: 0,
                                    fontFamily: "var(--font-display)",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.12em",
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase",
                                }}
                            >
                                Session History
                            </h3>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                            }}
                        >
                            {logs.slice(0, 8).map((l) => (
                                <div
                                    key={l.id}
                                    className="glass-card"
                                    style={{
                                        padding: "10px 14px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <div>
                                        <p
                                            style={{
                                                fontFamily:
                                                    "var(--font-display)",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                margin: "0 0 2px",
                                            }}
                                        >
                                            {l.source}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "11px",
                                                color: "var(--text-muted)",
                                                margin: 0,
                                                fontFamily: "var(--font-body)",
                                            }}
                                        >
                                            {l.minutes} min ·{" "}
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    gap: "1px",
                                                    verticalAlign: "middle",
                                                }}
                                            >
                                                {Array.from(
                                                    { length: l.rating },
                                                    (_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={10}
                                                            color="var(--gold)"
                                                            fill="var(--gold)"
                                                        />
                                                    ),
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "10px",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        {l.date}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── Practice Screen ───
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "var(--app-height, 100dvh)",
                paddingTop: "4px",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 70px)",
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
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

            {/* Top Bar */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    flexShrink: 0,
                    marginBottom: "10px",
                }}
            >
                <button
                    onClick={() => {
                        stopAll();
                        setMode(null);
                        setIsTimerRunning(false);
                    }}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: "13px",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                    }}
                >
                    ← Back
                </button>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "20px",
                            fontWeight: 600,
                            color: isTimerRunning
                                ? "var(--gold)"
                                : "var(--text-secondary)",
                            textShadow: isTimerRunning
                                ? "0 0 12px rgba(245,200,66,0.4)"
                                : "none",
                        }}
                    >
                        {fmt(timer)}
                    </span>
                    <button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        style={{
                            padding: "6px 14px",
                            borderRadius: 99,
                            border: "none",
                            cursor: "pointer",
                            background: isTimerRunning
                                ? "var(--gold-dim)"
                                : "var(--bg-raised)",
                            color: isTimerRunning
                                ? "var(--gold)"
                                : "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                            fontSize: "12px",
                            fontWeight: 600,
                        }}
                    >
                        {isTimerRunning ? "⏸ Pause" : "▶ Start"}
                    </button>
                </div>
            </div>

            {/* Play control */}
            <div style={{ flexShrink: 0, marginBottom: "10px" }}>
                <button
                    onClick={playing ? stopAll : playAll}
                    style={{
                        width: "100%",
                        minHeight: 48,
                        borderRadius: 14,
                        border: "none",
                        cursor: "pointer",
                        background: playing
                            ? "rgba(248,113,113,0.15)"
                            : "linear-gradient(135deg, var(--cyan-muted), var(--cyan))",
                        color: playing ? "var(--ruby)" : "#07080D",
                        fontFamily: "var(--font-display)",
                        fontSize: "14px",
                        fontWeight: 700,
                        boxShadow: !playing
                            ? "0 0 16px rgba(34,211,238,0.25)"
                            : "none",
                        transition: "all 0.2s",
                    }}
                >
                    {playing ? "⏹ Stop" : "▶ Play All Lines"}
                </button>
            </div>

            {/* Script lines */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    paddingBottom: "8px",
                }}
            >
                {lines.map((line, i) => (
                    <div
                        key={i}
                        onClick={() => playLine(i)}
                        style={{
                            padding: "12px 14px",
                            borderRadius: "12px",
                            cursor: "pointer",
                            display: "flex",
                            gap: "10px",
                            alignItems: "flex-start",
                            background:
                                currentLine === i
                                    ? "rgba(34,211,238,0.08)"
                                    : "var(--bg-surface)",
                            border: `1px solid ${currentLine === i ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.04)"}`,
                            boxShadow:
                                currentLine === i
                                    ? "0 0 12px rgba(34,211,238,0.1)"
                                    : "none",
                            transition: "all 0.2s",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                color:
                                    currentLine === i
                                        ? "var(--cyan)"
                                        : "var(--text-muted)",
                                minWidth: "18px",
                                paddingTop: "2px",
                            }}
                        >
                            {i + 1}
                        </span>
                        <p
                            style={{
                                fontSize: "14px",
                                lineHeight: 1.6,
                                margin: 0,
                                color:
                                    currentLine === i
                                        ? "var(--text-primary)"
                                        : "var(--text-secondary)",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            {currentLine === i && (
                                <span
                                    style={{
                                        marginRight: "6px",
                                        color: "var(--cyan)",
                                    }}
                                >
                                    ▶
                                </span>
                            )}
                            {line}
                        </p>
                    </div>
                ))}
            </div>

            {/* Save Session */}
            <div
                style={{
                    flexShrink: 0,
                    paddingTop: "10px",
                    paddingBottom:
                        "calc(env(safe-area-inset-bottom, 0px) + 4px)",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: "4px",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: "8px",
                    }}
                >
                    {[1, 2, 3, 4, 5].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRating(r)}
                            style={{
                                width: 40,
                                height: 36,
                                borderRadius: "10px",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                    rating >= r
                                        ? "rgba(251,191,36,0.2)"
                                        : "var(--bg-raised)",
                                filter:
                                    rating >= r
                                        ? "none"
                                        : "grayscale(1) opacity(0.4)",
                                transition: "all 0.15s",
                            }}
                        >
                            <Star
                                size={16}
                                color="var(--gold)"
                                fill={rating >= r ? "var(--gold)" : "none"}
                            />
                        </button>
                    ))}
                </div>
                <button
                    onClick={saveSession}
                    disabled={saving || timer < 10}
                    className="btn-primary"
                    style={{ fontSize: "14px" }}
                >
                    {saving ? "Saving..." : `💾 Save Session (${fmt(timer)})`}
                </button>
            </div>
        </div>
    );
}
