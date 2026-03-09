"use client";

import { useEffect, useState, useCallback } from "react";
import { Flame, Trophy } from "lucide-react";

const STREAK_THEMES: Record<
    number,
    { color: string; bg: string; label: string; border: string }
> = {
    7: {
        color: "var(--cyan)",
        bg: "rgba(10,48,64,0.8)",
        label: "ONE WEEK",
        border: "rgba(34,211,238,0.4)",
    },
    14: {
        color: "var(--gold)",
        bg: "rgba(107,90,42,0.8)",
        label: "TWO WEEKS",
        border: "rgba(245,200,66,0.4)",
    },
    30: {
        color: "var(--violet)",
        bg: "rgba(30,10,60,0.9)",
        label: "ONE MONTH",
        border: "rgba(167,139,250,0.4)",
    },
    60: {
        color: "var(--ruby)",
        bg: "rgba(48,10,10,0.9)",
        label: "TWO MONTHS",
        border: "rgba(248,113,113,0.4)",
    },
    100: {
        color: "var(--gold)",
        bg: "rgba(80,60,0,0.9)",
        label: "100 DAYS",
        border: "rgba(255,224,102,0.5)",
    },
};

interface LevelUpOverlayProps {
    oldLevel: number;
    newLevel: number;
    kingdomName?: string;
    expGained: number;
    onDismiss: () => void;
}

export function LevelUpOverlay({
    oldLevel,
    newLevel,
    kingdomName,
    expGained,
    onDismiss,
}: LevelUpOverlayProps) {
    const [show, setShow] = useState(false);
    const [countedExp, setCountedExp] = useState(0);

    useEffect(() => {
        setTimeout(() => setShow(true), 50);
        // Count up EXP
        let start = 0;
        const step = Math.ceil(expGained / 40);
        const timer = setInterval(() => {
            start += step;
            if (start >= expGained) {
                setCountedExp(expGained);
                clearInterval(timer);
            } else setCountedExp(start);
        }, 30);
        // Auto-dismiss after 5s
        const dismiss = setTimeout(() => onDismiss(), 5000);
        return () => {
            clearInterval(timer);
            clearTimeout(dismiss);
        };
    }, [expGained, onDismiss]);

    return (
        <div
            onClick={onDismiss}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(7,8,13,0.96)",
                backdropFilter: "blur(12px)",
                opacity: show ? 1 : 0,
                transition: "opacity 0.4s",
            }}
        >
            {/* Gold particles (CSS only) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                {Array.from({ length: 16 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: `${5 + ((i * 6.5) % 95)}%`,
                            top: `${10 + ((i * 11) % 80)}%`,
                            width: `${3 + (i % 4)}px`,
                            height: `${3 + (i % 4)}px`,
                            borderRadius: "50%",
                            background:
                                i % 3 === 0
                                    ? "var(--gold)"
                                    : i % 3 === 1
                                      ? "var(--gold-muted)"
                                      : "rgba(245,200,66,0.4)",
                            animation: `floatUpFade ${1.5 + (i % 3) * 0.5}s ease-out ${i * 0.12}s infinite`,
                        }}
                    />
                ))}
            </div>

            <div
                style={{ textAlign: "center", position: "relative", zIndex: 1 }}
            >
                {/* YOU HAVE */}
                <p
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.25em",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                    }}
                >
                    YOU HAVE
                </p>

                {/* LEVELED UP */}
                <h1
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "32px",
                        fontWeight: 800,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "var(--gold)",
                        textShadow: "0 0 30px rgba(245,200,66,0.5)",
                        margin: "0 0 24px",
                    }}
                >
                    LEVELED UP
                </h1>

                {/* Level flip */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        justifyContent: "center",
                        marginBottom: "28px",
                    }}
                >
                    <div
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "56px",
                            fontWeight: 800,
                            color: "var(--text-muted)",
                            opacity: 0.4,
                        }}
                    >
                        {oldLevel}
                    </div>
                    <div style={{ fontSize: "24px", color: "var(--gold)" }}>
                        →
                    </div>
                    <div
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "80px",
                            fontWeight: 800,
                            color: "var(--gold)",
                            textShadow: "0 0 40px rgba(245,200,66,0.5)",
                            lineHeight: 1,
                        }}
                    >
                        {newLevel}
                    </div>
                </div>

                {/* Kingdom name if new */}
                {kingdomName && (
                    <div style={{ marginBottom: "20px" }}>
                        <p
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.15em",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                margin: "0 0 4px",
                            }}
                        >
                            NEW KINGDOM
                        </p>
                        <p
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "20px",
                                fontWeight: 700,
                                color: "var(--gold-bright)",
                                textShadow: "0 0 16px rgba(245,200,66,0.4)",
                                margin: 0,
                            }}
                        >
                            {kingdomName}
                        </p>
                    </div>
                )}

                {/* EXP gained */}
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 24px",
                        borderRadius: 99,
                        background: "rgba(107,90,42,0.4)",
                        border: "1px solid rgba(245,200,66,0.3)",
                        marginBottom: "40px",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "var(--gold)",
                        }}
                    >
                        +{countedExp.toLocaleString()} EXP
                    </span>
                </div>

                <p
                    style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                    }}
                >
                    Tap anywhere to continue
                </p>
            </div>
        </div>
    );
}

interface StreakMilestoneProps {
    streak: number;
    onDismiss: () => void;
}

export function StreakMilestone({ streak, onDismiss }: StreakMilestoneProps) {
    const [show, setShow] = useState(false);
    const milestones = [100, 60, 30, 14, 7];
    const milestone = milestones.find((m) => streak >= m) ?? 7;
    const theme = STREAK_THEMES[milestone] ?? STREAK_THEMES[7];

    useEffect(() => {
        setTimeout(() => setShow(true), 50);
        const t = setTimeout(() => onDismiss(), 5000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div
            onClick={onDismiss}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(7,8,13,0.95)",
                backdropFilter: "blur(16px)",
                opacity: show ? 1 : 0,
                transition: "opacity 0.4s",
            }}
        >
            <div style={{ textAlign: "center" }}>
                {/* Flame emoji with pulse */}
                <div
                    style={{
                        fontSize: "80px",
                        marginBottom: "16px",
                        animation: "goldPulse 1.5s ease-in-out infinite",
                    }}
                >
                    <Flame
                        size={80}
                        color="var(--ruby)"
                        fill="var(--ruby)"
                        strokeWidth={1}
                    />
                </div>

                {/* Streak number */}
                <div
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "96px",
                        fontWeight: 800,
                        lineHeight: 1,
                        color: theme.color,
                        textShadow: `0 0 50px ${theme.border}`,
                        marginBottom: "8px",
                    }}
                >
                    {streak}
                </div>

                {/* "X DAY STREAK" */}
                <p
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "20px",
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        color: theme.color,
                        margin: "0 0 6px",
                        textTransform: "uppercase",
                    }}
                >
                    DAY STREAK
                </p>

                {/* Milestone label */}
                <div
                    style={{
                        display: "inline-block",
                        padding: "6px 20px",
                        borderRadius: 99,
                        background: theme.bg,
                        border: `1px solid ${theme.border}`,
                        marginBottom: "32px",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: theme.color,
                            letterSpacing: "0.08em",
                        }}
                    >
                        {theme.label} MILESTONE
                    </span>
                </div>

                <p
                    style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                    }}
                >
                    Keep it up! Tap to continue
                </p>
            </div>
        </div>
    );
}

// Demo page for testing — in production import and use in page.tsx
export default function SpecialScreensDemo() {
    const [screen, setScreen] = useState<"levelup" | "streak" | null>(null);
    const dismiss = useCallback(() => setScreen(null), []);

    return (
        <div style={{ paddingTop: "8px" }}>
            {screen === "levelup" && (
                <LevelUpOverlay
                    oldLevel={4}
                    newLevel={5}
                    kingdomName="Grammar Forest"
                    expGained={450}
                    onDismiss={dismiss}
                />
            )}
            {screen === "streak" && (
                <StreakMilestone streak={14} onDismiss={dismiss} />
            )}

            <h1
                style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "22px",
                    fontWeight: 800,
                    marginBottom: "16px",
                }}
            >
                Special Screens
            </h1>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                }}
            >
                <button
                    onClick={() => setScreen("levelup")}
                    className="btn-primary"
                    style={{ fontSize: "15px" }}
                >
                    Preview Level Up Screen
                </button>
                <button
                    onClick={() => setScreen("streak")}
                    style={{
                        width: "100%",
                        minHeight: 52,
                        borderRadius: 14,
                        cursor: "pointer",
                        background: "rgba(48,10,10,0.6)",
                        border: "1px solid rgba(248,113,113,0.3)",
                        color: "var(--ruby)",
                        fontFamily: "var(--font-display)",
                        fontSize: "15px",
                        fontWeight: 700,
                    }}
                >
                    Preview Streak Milestone
                </button>
            </div>
        </div>
    );
}
