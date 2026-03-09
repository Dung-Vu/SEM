"use client";

import { Zap } from "lucide-react";

interface UserData {
    username: string;
    level: number;
    exp: number;
    createdAt: string;
    levelProgress: { current: number; needed: number };
    kingdom: { name: string; title: string; cefr: string; icon: string };
}

interface Props {
    user: UserData;
    expProgress: number;
    daysSinceStart: number;
}

export function HeroCard({ user, expProgress, daysSinceStart }: Props) {
    return (
        <div
            className="hero-mesh-bg animate-fade-in-up"
            style={{
                marginBottom: "16px",
                position: "relative",
                padding: "20px",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid var(--border-gold)",
                boxShadow: "var(--shadow-gold)",
            }}
        >
            {/* Gold radial glow top-right */}
            <div
                style={{
                    position: "absolute",
                    top: -60,
                    right: -60,
                    width: 220,
                    height: 220,
                    background:
                        "radial-gradient(circle, rgba(245,166,35,0.18) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    position: "relative",
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Kingdom badge */}
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "3px 10px",
                            borderRadius: "99px",
                            background: "var(--gold-dim)",
                            border: "1px solid rgba(245,166,35,0.35)",
                            marginBottom: "10px",
                        }}
                    >
                        <span style={{ fontSize: "12px" }}>
                            {user.kingdom.icon}
                        </span>
                        <span
                            style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "var(--gold)",
                                fontFamily: "var(--font-body)",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                            }}
                        >
                            {user.kingdom.cefr} · {user.kingdom.name}
                        </span>
                    </div>

                    {/* Username */}
                    <h1
                        style={{
                            margin: 0,
                            fontFamily: "var(--font-display)",
                            fontSize: "28px",
                            fontWeight: 800,
                            lineHeight: 1.1,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        {user.username}
                    </h1>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        Day {daysSinceStart} · {user.kingdom.title}
                    </p>
                </div>

                {/* Level badge */}
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: "18px",
                        background: "var(--bg-elevated)",
                        border: "2px solid var(--gold)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--shadow-gold)",
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "24px",
                            fontWeight: 700,
                            color: "var(--gold)",
                            lineHeight: 1,
                        }}
                    >
                        {user.level}
                    </span>
                    <span
                        style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "var(--gold-muted)",
                            letterSpacing: "0.1em",
                            marginTop: "2px",
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        LEVEL
                    </span>
                </div>
            </div>

            {/* EXP Bar */}
            <div style={{ marginTop: "18px" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "7px",
                    }}
                >
                    <span
                        style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <Zap size={12} color="var(--gold)" />
                        EXP Progress
                    </span>
                    <span
                        style={{
                            fontSize: "12px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                            color: "var(--gold)",
                        }}
                    >
                        {user.exp.toLocaleString()} /{" "}
                        {user.levelProgress.needed.toLocaleString()}
                    </span>
                </div>
                <div className="exp-bar-container">
                    <div
                        className="exp-bar-fill"
                        style={{ width: `${Math.min(expProgress, 100)}%` }}
                    />
                </div>
                <p
                    style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textAlign: "right",
                        marginTop: "4px",
                        fontFamily: "var(--font-mono)",
                    }}
                >
                    {Math.round(expProgress)}% → Lv {user.level + 1}
                </p>
            </div>
        </div>
    );
}
