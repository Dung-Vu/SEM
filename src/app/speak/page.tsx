"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CONVERSATION_MODES, type ConversationMode } from "@/lib/ai-client";
import { speak, stopSpeech, isSpeaking } from "@/lib/tts";
import {
    MessageCircle,
    Coffee,
    Briefcase,
    PlaneTakeoff,
    Swords,
    BookText,
    Stethoscope,
    Hotel,
    UtensilsCrossed,
    BadgeCheck,
    Shuffle,
    History,
    Mic2,
    Trophy,
    Bot,
    Brain,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    _streamId?: number;
}

// Unified icon + accent color config — NO bg diff per card
const MODE_CONFIG: Record<
    string,
    {
        icon: React.ComponentType<{
            size?: number;
            color?: string;
            strokeWidth?: number;
        }>;
        color: string;
        level: string;
    }
> = {
    free_talk: { icon: MessageCircle, color: "var(--cyan)", level: "A2" },
    roleplay_coffee: { icon: Coffee, color: "var(--gold)", level: "A2" },
    roleplay_office: {
        icon: Briefcase,
        color: "var(--violet-bright)",
        level: "B1",
    },
    roleplay_travel: {
        icon: PlaneTakeoff,
        color: "var(--cyan-bright)",
        level: "B1",
    },
    debate: { icon: Swords, color: "var(--ruby)", level: "B2" },
    vocab_practice: { icon: BookText, color: "var(--violet)", level: "A2" },
    roleplay_doctor: {
        icon: Stethoscope,
        color: "var(--emerald)",
        level: "B1",
    },
    roleplay_hotel: {
        icon: Hotel,
        color: "var(--emerald-bright)",
        level: "B1",
    },
    roleplay_restaurant: {
        icon: UtensilsCrossed,
        color: "var(--amber)",
        level: "A2",
    },

    roleplay_interview: { icon: BadgeCheck, color: "var(--gold)", level: "B2" },
};

export default function SpeakPage() {
    const [mode, setMode] = useState<ConversationMode | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionStart, setSessionStart] = useState<Date | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [summary, setSummary] = useState<string | null>(null);
    const [ending, setEnding] = useState(false);
    const [debrief, setDebrief] = useState<{
        performanceScore: number;
        difficultyUsed: number;
        nextDifficulty: number;
        correctionsCount: number;
        vocabUsed: string[];
        debrief: string;
    } | null>(null);
    const [recommendations, setRecommendations] = useState<
        { mode: string; reason: string }[]
    >([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!sessionStart || summary) return;
        const interval = setInterval(() => {
            setElapsed(
                Math.floor((Date.now() - sessionStart.getTime()) / 1000),
            );
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionStart, summary]);

    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, loading]);

    // Phase 15: fetch SENSEI recommendations
    useEffect(() => {
        fetch("/api/ai/tutor-memory")
            .then((r) => r.json())
            .then((d) => {
                if (d.recommendations) setRecommendations(d.recommendations);
            })
            .catch(() => {});
    }, []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const startSession = (selectedMode: ConversationMode) => {
        setMode(selectedMode);
        setSessionStart(new Date());
        setMessages([]);
        setSummary(null);
        setElapsed(0);
        sendInitialMessage(selectedMode);
    };

    // Shared streaming helper — reads SSE and appends tokens in real-time
    const streamMessage = async (
        messageHistory: Array<{ role: string; content: string }>,
        selectedMode: ConversationMode,
    ): Promise<string> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch("/api/ai/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mode: selectedMode,
                messages: messageHistory,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok || !res.body) {
            throw new Error(`Stream error: ${res.status}`);
        }

        // Add a placeholder assistant message immediately (shows typing effect)
        const streamId = Date.now();
        setMessages((prev) => [
            ...prev,
            {
                role: "assistant",
                content: "",
                timestamp: new Date(),
                _streamId: streamId,
            } as Message,
        ]);
        setLoading(false); // Hide spinner — text will stream in below

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (data === "[DONE]") break;
                try {
                    const json = JSON.parse(data);
                    const delta = json.choices?.[0]?.delta?.content ?? "";
                    if (delta) {
                        fullText += delta;
                        // Update last message in real-time
                        setMessages((prev) => {
                            const updated = [...prev];
                            const lastIdx = updated.length - 1;
                            if (
                                lastIdx >= 0 &&
                                updated[lastIdx].role === "assistant"
                            ) {
                                updated[lastIdx] = {
                                    ...updated[lastIdx],
                                    content: fullText,
                                };
                            }
                            return updated;
                        });
                    }
                } catch {
                    // Partial JSON chunk — skip
                }
            }
        }

        return fullText;
    };

    const sendInitialMessage = async (selectedMode: ConversationMode) => {
        setLoading(true);
        try {
            const initialMsg = {
                role: "user" as const,
                content: "Hi! Let\'s start.",
            };
            setMessages([
                {
                    role: "user",
                    content: initialMsg.content,
                    timestamp: new Date(),
                },
            ]);
            await streamMessage(
                [{ role: "user", content: initialMsg.content }],
                selectedMode,
            );
        } catch {
            setMessages([
                {
                    role: "assistant",
                    content: "⚠️ Could not connect to AI. Check your API key.",
                    timestamp: new Date(),
                },
            ]);
        }
        setLoading(false);
    };

    const sendMessage = async () => {
        if (!input.trim() || loading || !mode) return;
        const userMsg: Message = {
            role: "user",
            content: input.trim(),
            timestamp: new Date(),
        };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);
        try {
            const historyForAPI = updatedMessages.map((m) => ({
                role: m.role,
                content: m.content,
            }));
            await streamMessage(historyForAPI, mode);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "⚠️ Network error. Try again.",
                    timestamp: new Date(),
                },
            ]);
        }
        setLoading(false);
        inputRef.current?.focus();
    };

    const endSession = async () => {
        if (messages.length < 2) {
            setMode(null);
            return;
        }
        setEnding(true);
        try {
            const chatHistory = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));
            const mins = Math.floor(elapsed / 60);
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "summary",
                    mode,
                    messages: chatHistory,
                    durationMinutes: mins,
                }),
            });
            const data = await res.json();
            setSummary(data.summary || "Summary generation failed.");
            const expAmount = Math.max(20, mins * 5);
            await fetch("/api/exp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source: "ai_conversation",
                    amount: expAmount,
                    description: `AI Conversation (${CONVERSATION_MODES[mode!].name}, ${mins} min)`,
                }),
            });
            const convRes = await fetch("/api/ai/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    title: CONVERSATION_MODES[mode!].name,
                    duration: elapsed,
                    expGained: expAmount,
                    summary: data.summary,
                    messages: chatHistory,
                }),
            });
            // Phase 15: capture SENSEI debrief
            try {
                const convJson = await convRes.json();
                if (convJson.debrief) setDebrief(convJson.debrief);
            } catch {
                /* non-blocking */
            }
            // Trigger milestone check (fire-and-forget)
            fetch("/api/milestones", { method: "POST" }).catch(() => {});
        } catch {
            setSummary("Could not generate summary.");
        }
        setEnding(false);
    };

    const renderCorrectionHighlight = (text: string) => {
        const parts: React.ReactNode[] = [];
        const regex = /❌\s*(.+?)\s*→\s*✅\s*(.+?)(?:\s*·\s*(.+?))?(?=\n|$)/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex)
                parts.push(text.slice(lastIndex, match.index));
            parts.push(
                <span
                    key={match.index}
                    style={{
                        display: "inline-flex",
                        flexWrap: "wrap",
                        gap: "4px",
                        alignItems: "center",
                        margin: "2px 0",
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: "rgba(30,10,60,0.6)",
                        border: "1px solid rgba(167,139,250,0.2)",
                        width: "100%",
                    }}
                >
                    <span
                        style={{
                            background: "rgba(248,113,113,0.15)",
                            color: "var(--ruby)",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: "12px",
                            textDecoration: "line-through",
                        }}
                    >
                        {match[1].trim()}
                    </span>
                    <span
                        style={{ color: "var(--text-muted)", fontSize: "12px" }}
                    >
                        →
                    </span>
                    <span
                        style={{
                            background: "rgba(52,211,153,0.15)",
                            color: "var(--emerald)",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: "12px",
                            fontWeight: 600,
                        }}
                    >
                        {match[2].trim()}
                    </span>
                    {match[3] && (
                        <span
                            style={{
                                color: "var(--violet)",
                                fontSize: "11px",
                                fontStyle: "italic",
                            }}
                        >
                            · {match[3].trim()}
                        </span>
                    )}
                </span>,
            );
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) parts.push(text.slice(lastIndex));
        return parts.length > 0 ? parts : text;
    };

    // ─── Mode Selection ───
    if (!mode) {
        return (
            <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
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
                        <Mic2
                            size={20}
                            color="var(--cyan)"
                            strokeWidth={2}
                            style={{
                                display: "inline",
                                verticalAlign: "middle",
                                marginRight: "6px",
                            }}
                        />
                        AI Conversation
                    </h1>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        Chọn chế độ hội thoại để luyện tập
                    </p>
                </div>

                {/* SENSEI Recommendation Banner */}
                {recommendations.length > 0 && (
                    <div
                        style={{
                            background: "var(--bg-raised)",
                            border: "1px solid rgba(245,200,66,0.25)",
                            borderRadius: 14,
                            padding: 12,
                            marginBottom: 12,
                        }}
                    >
                        <p
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                color: "var(--gold)",
                                textTransform: "uppercase" as const,
                                margin: "0 0 8px",
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            🧠 SENSEI gợi ý
                        </p>
                        {recommendations.map((r, i) => (
                            <p
                                key={i}
                                style={{
                                    fontSize: 12,
                                    color: "var(--text-secondary)",
                                    margin:
                                        i < recommendations.length - 1
                                            ? "0 0 4px"
                                            : 0,
                                }}
                            >
                                {i + 1}. {r.mode.replace(/_/g, " ")} —{" "}
                                {r.reason}
                            </p>
                        ))}
                    </div>
                )}

                {/* SENSEI Memory Link */}
                <Link href="/speak/memory" style={{ textDecoration: "none" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            background: "var(--bg-raised)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 12,
                            marginBottom: 12,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <Brain
                                size={16}
                                style={{ color: "var(--violet-bright)" }}
                            />
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                }}
                            >
                                Tutor Memory
                            </span>
                        </div>
                        <ChevronRight
                            size={14}
                            style={{ color: "var(--text-muted)" }}
                        />
                    </div>
                </Link>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginBottom: "16px",
                    }}
                >
                    {Object.entries(CONVERSATION_MODES).map(([key, config]) => {
                        const mCfg = MODE_CONFIG[key] ?? MODE_CONFIG.free_talk;
                        const Icon = mCfg.icon;
                        return (
                            <button
                                key={key}
                                onClick={() =>
                                    startSession(key as ConversationMode)
                                }
                                className="animate-fade-in-up speak-mode-card"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                    padding: "16px",
                                    borderRadius: "16px",
                                    textAlign: "left",
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border-subtle)",
                                    cursor: "pointer",
                                    position: "relative",
                                    overflow: "hidden",
                                }}
                            >
                                {/* Level badge top-right */}
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "8px",
                                        right: "8px",
                                        fontSize: "9px",
                                        fontWeight: 700,
                                        color: mCfg.color,
                                        fontFamily: "var(--font-mono)",
                                        background: "var(--bg-raised)",
                                        padding: "2px 6px",
                                        borderRadius: "6px",
                                        letterSpacing: "0.06em",
                                    }}
                                >
                                    {mCfg.level}
                                </span>

                                {/* Icon */}
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: "12px",
                                        background: "var(--bg-raised)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Icon
                                        size={22}
                                        color={mCfg.color}
                                        strokeWidth={2}
                                    />
                                </div>

                                <div>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontFamily: "var(--font-display)",
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        {config.name
                                            .split(" ")
                                            .slice(1)
                                            .join(" ") || config.name}
                                    </p>
                                    <p
                                        style={{
                                            margin: "3px 0 0",
                                            fontSize: "10px",
                                            color: "var(--text-muted)",
                                            fontFamily: "var(--font-body)",
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {config.description?.slice(0, 38) ??
                                            "Practice"}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Random Mode Button */}
                <button
                    onClick={() => {
                        const keys = Object.keys(
                            CONVERSATION_MODES,
                        ) as ConversationMode[];
                        const randomKey =
                            keys[Math.floor(Math.random() * keys.length)];
                        startSession(randomKey);
                    }}
                    className="animate-fade-in-up"
                    style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "14px",
                        background:
                            "linear-gradient(135deg, var(--gold-dim), rgba(245,200,66,0.08))",
                        border: "1px solid var(--gold-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        marginBottom: "16px",
                    }}
                >
                    <span style={{ fontSize: "18px" }}>🎲</span>
                    <span
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--gold)",
                        }}
                    >
                        Random Topic
                    </span>
                </button>

                <a
                    href="/speak/history"
                    style={{
                        display: "block",
                        textAlign: "center",
                        fontSize: "13px",
                        color: "var(--violet)",
                        textDecoration: "none",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                    }}
                >
                    <History
                        size={14}
                        color="var(--violet)"
                        strokeWidth={2}
                        style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: "4px",
                        }}
                    />
                    Conversation History
                </a>
            </div>
        );
    }

    // ─── Summary ───
    if (summary) {
        return (
            <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
                <div
                    className="animate-fade-in-up"
                    style={{ textAlign: "center", marginBottom: "24px" }}
                >
                    <div
                        style={{
                            fontSize: "56px",
                            marginBottom: "8px",
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <Trophy
                            size={56}
                            color="var(--gold)"
                            strokeWidth={1.5}
                        />
                    </div>
                    <h2
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "22px",
                            fontWeight: 800,
                            margin: "0 0 6px",
                        }}
                    >
                        Session Complete!
                    </h2>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        {formatTime(elapsed)} · {messages.length} messages
                    </p>
                </div>

                <div
                    className="glass-card animate-fade-in-up stagger-1"
                    style={{
                        padding: "16px",
                        marginBottom: "12px",
                        borderColor: "rgba(167,139,250,0.2)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "12px",
                        }}
                    >
                        <Bot size={16} color="var(--violet)" strokeWidth={2} />
                        <h3
                            style={{
                                margin: 0,
                                fontFamily: "var(--font-display)",
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--violet)",
                            }}
                        >
                            AI Session Summary
                        </h3>
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
                        {summary}
                    </div>
                </div>

                {/* Phase 15: SENSEI Debrief */}
                {debrief && (
                    <div
                        className="glass-card animate-fade-in-up stagger-2"
                        style={{
                            padding: "16px",
                            marginBottom: "12px",
                            borderColor: "rgba(245,200,66,0.25)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "12px",
                            }}
                        >
                            <Brain
                                size={16}
                                color="var(--gold)"
                                strokeWidth={2}
                            />
                            <h3
                                style={{
                                    margin: 0,
                                    fontFamily: "var(--font-display)",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "var(--gold)",
                                }}
                            >
                                SENSEI Debrief
                            </h3>
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 8,
                                marginBottom: 12,
                            }}
                        >
                            <div style={{ textAlign: "center" }}>
                                <p
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 800,
                                        margin: "0 0 2px",
                                        fontFamily: "var(--font-display)",
                                        color:
                                            debrief.performanceScore >= 70
                                                ? "var(--emerald)"
                                                : debrief.performanceScore >= 50
                                                  ? "var(--gold)"
                                                  : "var(--ruby)",
                                    }}
                                >
                                    {debrief.performanceScore}
                                </p>
                                <p
                                    style={{
                                        fontSize: 10,
                                        color: "var(--text-muted)",
                                        margin: 0,
                                    }}
                                >
                                    Performance
                                </p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 800,
                                        color: "var(--cyan)",
                                        margin: "0 0 2px",
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    {debrief.difficultyUsed}→
                                    {debrief.nextDifficulty}
                                </p>
                                <p
                                    style={{
                                        fontSize: 10,
                                        color: "var(--text-muted)",
                                        margin: 0,
                                    }}
                                >
                                    Difficulty
                                </p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 800,
                                        color: "var(--violet-bright)",
                                        margin: "0 0 2px",
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    {debrief.correctionsCount}
                                </p>
                                <p
                                    style={{
                                        fontSize: 10,
                                        color: "var(--text-muted)",
                                        margin: 0,
                                    }}
                                >
                                    Corrections
                                </p>
                            </div>
                        </div>
                        {debrief.vocabUsed.length > 0 && (
                            <p
                                style={{
                                    fontSize: 11,
                                    color: "var(--emerald)",
                                    margin: "0 0 10px",
                                }}
                            >
                                ✓ Vocab used: {debrief.vocabUsed.join(", ")}
                            </p>
                        )}
                        <p
                            style={{
                                fontSize: 13,
                                lineHeight: 1.7,
                                color: "var(--text-secondary)",
                                whiteSpace: "pre-wrap",
                                fontFamily: "var(--font-body)",
                                margin: 0,
                            }}
                        >
                            {debrief.debrief}
                        </p>
                    </div>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={() => {
                            setMode(null);
                            setMessages([]);
                            setSummary(null);
                            setDebrief(null);
                        }}
                        className="btn-primary"
                        style={{ flex: 2 }}
                    >
                        ← Choose Mode
                    </button>
                    <a
                        href="/speak/history"
                        className="btn-secondary"
                        style={{
                            flex: 1,
                            textDecoration: "none",
                            textAlign: "center",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: "13px",
                        }}
                    >
                        <History
                            size={16}
                            color="var(--text-secondary)"
                            strokeWidth={2}
                        />
                    </a>
                </div>
            </div>
        );
    }

    // ─── Chat Interface ───
    const currentMode = CONVERSATION_MODES[mode];
    const modeAccent = MODE_CONFIG[mode]?.color ?? "var(--gold)";
    const ModeIcon = MODE_CONFIG[mode]?.icon ?? MessageCircle;
    const timerGlowing = elapsed > 300; // 5 min milestone

    const chatUI = (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
                paddingLeft: "16px",
                paddingRight: "16px",
                background: "var(--bg-void)",
                zIndex: 50,
                boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    marginBottom: "8px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <button
                        onClick={() => {
                            setMode(null);
                            setMessages([]);
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
                    <span
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: modeAccent,
                        }}
                    >
                        {currentMode.name}
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: timerGlowing
                                ? "var(--gold)"
                                : "var(--text-secondary)",
                            textShadow: timerGlowing
                                ? "0 0 8px rgba(245,200,66,0.5)"
                                : "none",
                        }}
                    >
                        {formatTime(elapsed)}
                    </span>
                    <button
                        onClick={endSession}
                        disabled={ending}
                        style={{
                            fontSize: "11px",
                            padding: "6px 12px",
                            borderRadius: "99px",
                            background: "var(--ruby-dim)",
                            border: "1px solid var(--ruby-muted)",
                            color: "var(--ruby)",
                            cursor: ending ? "not-allowed" : "pointer",
                            fontFamily: "var(--font-body)",
                            fontWeight: 600,
                        }}
                    >
                        {ending ? "Ending..." : "End Session"}
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    paddingBottom: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                }}
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            justifyContent:
                                msg.role === "user" ? "flex-end" : "flex-start",
                            alignItems: "flex-end",
                            gap: "6px",
                        }}
                    >
                        {msg.role === "assistant" && (
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    flexShrink: 0,
                                    background:
                                        "linear-gradient(135deg, var(--violet-muted), var(--violet))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    color: "white",
                                    fontFamily: "var(--font-display)",
                                }}
                            >
                                Q
                            </div>
                        )}
                        <div
                            className={
                                msg.role === "user"
                                    ? "bubble-user"
                                    : "bubble-ai"
                            }
                        >
                            {msg.role === "assistant"
                                ? renderCorrectionHighlight(msg.content)
                                : msg.content}
                        </div>
                        {msg.role === "assistant" && msg.content.length > 0 && (
                            <button
                                onClick={() => {
                                    if (isSpeaking()) {
                                        stopSpeech();
                                    } else {
                                        speak(
                                            msg.content
                                                .replace(/\*\*[^*]+\*\*/g, "")
                                                .replace(/\[.*?\]/g, ""),
                                            { rate: 0.9 },
                                        );
                                    }
                                }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    padding: "4px",
                                    flexShrink: 0,
                                    opacity: 0.6,
                                    alignSelf: "flex-start",
                                    marginTop: "2px",
                                }}
                                title="Listen to AI response"
                            >
                                🔊
                            </button>
                        )}
                    </div>
                ))}

                {loading && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: "6px",
                        }}
                    >
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background:
                                    "linear-gradient(135deg, var(--violet-muted), var(--violet))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontWeight: 800,
                                color: "white",
                            }}
                        >
                            Q
                        </div>
                        <div
                            className="bubble-ai"
                            style={{ padding: "14px 16px" }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: "5px",
                                    alignItems: "center",
                                }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="typing-dot"
                                        style={{
                                            animationDelay: `${i * 0.2}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div
                style={{
                    flexShrink: 0,
                    paddingTop: "10px",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "flex-end",
                    }}
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Type your message in English..."
                        style={{
                            flex: 1,
                            background: "var(--bg-raised)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "14px",
                            padding: "12px 14px",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            fontFamily: "var(--font-body)",
                            resize: "none",
                            outline: "none",
                            minHeight: "48px",
                            maxHeight: "120px",
                            lineHeight: 1.5,
                        }}
                        rows={1}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        style={{
                            width: 46,
                            height: 46,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: input.trim()
                                ? "linear-gradient(135deg, var(--cyan-muted), var(--cyan))"
                                : "var(--bg-raised)",
                            border: "none",
                            cursor: input.trim() ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                            boxShadow: input.trim()
                                ? "0 0 12px rgba(34,211,238,0.3)"
                                : "none",
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={
                                input.trim() ? "#07080D" : "var(--text-muted)"
                            }
                            strokeWidth="2.5"
                        >
                            <path d="M22 2L11 13" />
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return chatUI;
    return createPortal(chatUI, document.body);
}
