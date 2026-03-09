"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    Shield,
    ScrollText,
    Crown,
    Activity,
    CheckCircle2,
    Trophy,
} from "lucide-react";

interface Quest {
    key: string;
    name: string;
    description: string;
    expReward: number;
    type: string;
    icon: string;
    completed: boolean;
    completedAt: string | null;
}

interface QuestsData {
    main: Quest[];
    side: Quest[];
    weekly: Quest[];
}

export default function QuestsPage() {
    const [quests, setQuests] = useState<QuestsData>({
        main: [],
        side: [],
        weekly: [],
    });
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [confirming, setConfirming] = useState<Quest | null>(null);
    const [expParticles, setExpParticles] = useState<
        Array<{ id: number; x: number; y: number; amount: number }>
    >([]);

    const triggerQuestParticle = (amount: number) => {
        const id = Date.now();
        setExpParticles((prev) => [
            ...prev,
            {
                id,
                x: window.innerWidth / 2,
                y: window.innerHeight * 0.45,
                amount,
            },
        ]);
        setTimeout(
            () => setExpParticles((prev) => prev.filter((p) => p.id !== id)),
            1400,
        );
    };

    const fetchQuests = useCallback(async () => {
        try {
            const res = await fetch("/api/quests");
            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            setQuests(data.quests ?? { main: [], side: [], weekly: [] });
            setProgress(data.progress ?? { completed: 0, total: 0 });
        } catch {
            console.error("Failed to fetch quests");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuests();
    }, [fetchQuests]);

    const handleComplete = async (questKey: string) => {
        setConfirming(null);
        try {
            const res = await fetch("/api/quests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questKey }),
            });
            const data = await res.json();
            setToast(
                data.success
                    ? data.message
                    : data.message || "Already completed",
            );
            if (data.success) {
                // Find quest EXP reward for particle
                const q = [
                    ...quests.main,
                    ...quests.side,
                    ...quests.weekly,
                ].find((q) => q.key === questKey);
                if (q) triggerQuestParticle(q.expReward);
                await fetchQuests();
            }
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast("Error completing quest");
            setTimeout(() => setToast(null), 3000);
        }
    };

    if (loading) {
        return (
            <div style={{ paddingTop: "8px" }}>
                <div
                    className="skeleton"
                    style={{ height: 140, borderRadius: 20, marginBottom: 12 }}
                />
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="skeleton"
                        style={{
                            height: 72,
                            borderRadius: 14,
                            marginBottom: 8,
                        }}
                    />
                ))}
            </div>
        );
    }

    const progressPct =
        progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    const allDone = progress.completed === progress.total && progress.total > 0;

    // SVG circle ring
    const r = 42;
    const cx = 52;
    const cy = 52;
    const circumference = 2 * Math.PI * r;
    const strokeDashoffset = circumference * (1 - progressPct / 100);

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
            {/* EXP Particles */}
            {typeof document !== "undefined" &&
                createPortal(
                    <>
                        {expParticles.map((p) => (
                            <div
                                key={p.id}
                                className="exp-particle"
                                style={{ left: p.x, top: p.y }}
                            >
                                +{p.amount} EXP ✨
                            </div>
                        ))}
                    </>,
                    document.body,
                )}

            {/* Toast */}
            {toast &&
                typeof document !== "undefined" &&
                createPortal(
                    <div className="toast animate-scale-in">
                        <div
                            className="glass-card"
                            style={{
                                padding: "13px 18px",
                                borderColor: "rgba(245,200,66,0.3)",
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
                    </div>,
                    document.body,
                )}

            {/* Confirm Bottom Sheet */}
            {confirming &&
                typeof document !== "undefined" &&
                createPortal(
                    <>
                        <div
                            className="more-drawer-backdrop"
                            onClick={() => setConfirming(null)}
                            style={{ zIndex: 1000 }}
                        />
                        <div className="more-drawer" style={{ zIndex: 1001 }}>
                            <div className="more-drawer-handle" />
                            <div style={{ marginBottom: "16px" }}>
                                <p
                                    style={{
                                        fontFamily: "var(--font-display)",
                                        fontSize: "18px",
                                        fontWeight: 800,
                                        marginBottom: "6px",
                                    }}
                                >
                                    {confirming.icon} {confirming.name}
                                </p>
                                <p
                                    style={{
                                        fontSize: "13px",
                                        color: "var(--text-secondary)",
                                        fontFamily: "var(--font-body)",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Bạn đã thực sự hoàn thành quest này chưa?
                                    Hãy trung thực với bản thân. 🙏
                                </p>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                }}
                            >
                                <button
                                    onClick={() =>
                                        handleComplete(confirming.key)
                                    }
                                    style={{
                                        width: "100%",
                                        minHeight: 48,
                                        borderRadius: 12,
                                        background:
                                            "linear-gradient(135deg, var(--emerald-muted), var(--emerald))",
                                        border: "none",
                                        color: "var(--bg-void)",
                                        fontWeight: 700,
                                        fontSize: 14,
                                        cursor: "pointer",
                                        fontFamily: "var(--font-display)",
                                    }}
                                >
                                    Xác nhận!
                                </button>
                                <button
                                    onClick={() => setConfirming(null)}
                                    style={{
                                        width: "100%",
                                        minHeight: 48,
                                        borderRadius: 12,
                                        background: "var(--bg-raised)",
                                        border: "1px solid var(--border-subtle)",
                                        color: "var(--text-muted)",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        cursor: "pointer",
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    ✗ Chưa xong
                                </button>
                            </div>
                        </div>
                    </>,
                    document.body,
                )}

            {/* ─── HEADER ─── */}
            <div
                className="animate-fade-in-up"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "20px",
                    borderRadius: "20px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    marginBottom: "14px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Glow background */}
                <div
                    style={{
                        position: "absolute",
                        top: -30,
                        right: -30,
                        width: 140,
                        height: 140,
                        background:
                            "radial-gradient(circle, rgba(245,200,66,0.1) 0%, transparent 70%)",
                        pointerEvents: "none",
                    }}
                />

                {/* Circular Progress Ring */}
                <div
                    style={{
                        flexShrink: 0,
                        position: "relative",
                        width: 104,
                        height: 104,
                    }}
                >
                    <svg
                        width="104"
                        height="104"
                        style={{ transform: "rotate(-90deg)" }}
                    >
                        {/* Track */}
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke="var(--bg-raised)"
                            strokeWidth="6"
                        />
                        {/* Progress */}
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={allDone ? "var(--emerald)" : "var(--gold)"}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{
                                transition: "stroke-dashoffset 0.8s ease-out",
                            }}
                        />
                    </svg>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "20px",
                                fontWeight: 600,
                                color: allDone
                                    ? "var(--emerald)"
                                    : "var(--gold)",
                                lineHeight: 1,
                            }}
                        >
                            {Math.round(progressPct)}%
                        </span>
                        <span
                            style={{
                                fontSize: "9px",
                                color: "var(--text-muted)",
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                marginTop: "2px",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            DONE
                        </span>
                    </div>
                </div>

                <div>
                    <h1
                        style={{
                            margin: "0 0 4px",
                            fontFamily: "var(--font-display)",
                            fontSize: "22px",
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                            color: "var(--text-primary)",
                        }}
                    >
                        QUEST LOG
                    </h1>
                    <p
                        style={{
                            margin: 0,
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        {progress.completed} of {progress.total} completed
                    </p>
                    {allDone && (
                        <p
                            style={{
                                margin: "6px 0 0",
                                fontSize: "12px",
                                color: "var(--emerald)",
                                fontWeight: 600,
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            All quests done today!
                        </p>
                    )}
                </div>
            </div>

            {/* Main Quests */}
            <QuestSection
                title="MAIN QUESTS"
                icon={Shield}
                accent="var(--gold)"
                quests={quests.main}
                onComplete={setConfirming}
                delay="stagger-1"
            />

            {/* Side Quests */}
            <QuestSection
                title="SIDE QUESTS"
                icon={ScrollText}
                accent="var(--cyan)"
                quests={quests.side}
                onComplete={setConfirming}
                delay="stagger-2"
            />

            {/* Weekly */}
            {quests.weekly.length > 0 && (
                <QuestSection
                    title="WEEKLY CHALLENGE"
                    icon={Crown}
                    accent="var(--violet)"
                    quests={quests.weekly}
                    onComplete={setConfirming}
                    delay="stagger-3"
                />
            )}

            {/* Empty state */}
            {quests.main.length === 0 && quests.side.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 16px" }}>
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            background: "rgba(52,211,153,0.1)",
                            border: "2px solid var(--emerald)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px",
                        }}
                    >
                        <Trophy size={32} color="var(--emerald)" />
                    </div>
                    <h2
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "var(--emerald)",
                            marginBottom: "8px",
                        }}
                    >
                        All Quests Complete!
                    </h2>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        Come back tomorrow for new quests
                    </p>
                </div>
            )}

            {/* Activity link */}
            <div
                className="stagger-4 animate-fade-in-up"
                style={{ marginTop: "12px" }}
            >
                <a
                    href="/log"
                    className="btn-secondary"
                    style={{
                        textDecoration: "none",
                        textAlign: "center",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <Activity size={15} color="var(--text-muted)" />
                    View Activity Log
                </a>
            </div>
        </div>
    );
}

function QuestSection({
    title,
    icon: Icon,
    accent,
    quests,
    onComplete,
    delay,
}: {
    title: string;
    icon: React.ComponentType<{
        size?: number;
        color?: string;
        strokeWidth?: number;
    }>;
    accent: string;
    quests: Quest[];
    onComplete: (quest: Quest) => void;
    delay: string;
}) {
    if (quests.length === 0) return null;
    return (
        <div
            className={`animate-fade-in-up ${delay}`}
            style={{ marginBottom: "14px" }}
        >
            {/* Section header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                    paddingLeft: "2px",
                }}
            >
                <Icon size={14} color={accent} strokeWidth={2.5} />
                <h3
                    style={{
                        margin: 0,
                        fontFamily: "var(--font-display)",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        color: accent,
                        textTransform: "uppercase",
                    }}
                >
                    {title}
                </h3>
            </div>

            <div
                style={{ display: "flex", flexDirection: "column", gap: "7px" }}
            >
                {quests.map((quest) => (
                    <button
                        key={quest.key}
                        onClick={() => !quest.completed && onComplete(quest)}
                        disabled={quest.completed}
                        className="quest-item"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "14px",
                            borderRadius: "14px",
                            background: quest.completed
                                ? "var(--bg-surface)"
                                : "var(--bg-elevated)",
                            border: quest.completed
                                ? `1px solid ${accent}30`
                                : "1px solid var(--border-subtle)",
                            borderLeft: `3px solid ${quest.completed ? accent : "transparent"}`,
                            opacity: quest.completed ? 0.6 : 1,
                            cursor: quest.completed ? "default" : "pointer",
                            textAlign: "left",
                            width: "100%",
                            transition: "all 0.2s var(--ease-spring)",
                        }}
                    >
                        {/* Checkbox */}
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                flexShrink: 0,
                                border: quest.completed
                                    ? `2px solid var(--emerald)`
                                    : "2px solid var(--border-medium)",
                                background: quest.completed
                                    ? "rgba(52,211,153,0.15)"
                                    : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.3s",
                            }}
                        >
                            {quest.completed && (
                                <CheckCircle2
                                    size={16}
                                    color="var(--emerald)"
                                    strokeWidth={2.5}
                                />
                            )}
                        </div>

                        {/* Content */}
                        <div
                            style={{ flex: 1, minWidth: 0, textAlign: "left" }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginBottom: "2px",
                                }}
                            >
                                <span style={{ fontSize: "15px" }}>
                                    {quest.icon}
                                </span>
                                <span
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        fontFamily: "var(--font-body)",
                                        textDecoration: quest.completed
                                            ? "line-through"
                                            : "none",
                                        color: quest.completed
                                            ? "var(--text-muted)"
                                            : "var(--text-primary)",
                                    }}
                                >
                                    {quest.name}
                                </span>
                            </div>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                    fontFamily: "var(--font-body)",
                                    lineHeight: 1.4,
                                }}
                            >
                                {quest.description}
                            </p>
                        </div>

                        {/* EXP Badge */}
                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                fontFamily: "var(--font-mono)",
                                color: quest.completed
                                    ? "var(--emerald)"
                                    : "var(--gold)",
                                padding: "5px 10px",
                                borderRadius: "8px",
                                background: quest.completed
                                    ? "rgba(52,211,153,0.1)"
                                    : "var(--gold-dim)",
                                border: quest.completed
                                    ? "1px solid rgba(52,211,153,0.25)"
                                    : "1px solid rgba(245,200,66,0.25)",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                                boxShadow: quest.completed
                                    ? "none"
                                    : "0 0 10px rgba(245,200,66,0.1)",
                            }}
                        >
                            {quest.completed ? "✓" : "+"}
                            {quest.expReward} EXP
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
