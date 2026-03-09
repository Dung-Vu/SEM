"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Swords, Trophy, CheckCircle2 } from "lucide-react";

interface Achievement {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    condition: string;
    unlocked: boolean;
    unlockedAt: string | null;
    progress: { current: number; target: number } | null;
}

export default function AchievementsPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [stats, setStats] = useState({ total: 0, unlocked: 0 });
    const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [bossHistory, setBossHistory] = useState<{
        history: Array<{
            id: number;
            weekNumber: number;
            year: number;
            challengeName: string;
            completedAt: string;
        }>;
        stats: { total: number; consecutiveWeeks: number };
    }>({ history: [], stats: { total: 0, consecutiveWeeks: 0 } });

    const fetchAchievements = useCallback(async () => {
        try {
            const res = await fetch("/api/achievements");
            if (!res.ok) throw new Error("API");
            const data = await res.json();
            setAchievements(data.achievements ?? []);
            setStats({ total: data.total, unlocked: data.unlocked });
            setNewlyUnlocked(data.newlyUnlocked ?? []);
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAchievements();
        // Fetch boss history
        fetch("/api/boss-history")
            .then((r) => r.json())
            .then((d) => setBossHistory(d))
            .catch(() => {});
    }, [fetchAchievements]);

    if (loading) {
        return (
            <div style={{ paddingTop: "8px" }}>
                <div
                    className="skeleton"
                    style={{ height: 140, borderRadius: 20, marginBottom: 12 }}
                />
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                    }}
                >
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="skeleton"
                            style={{ height: 120, borderRadius: 16 }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    const pct =
        stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0;

    // SVG ring
    const r = 38,
        cx = 48,
        cy = 48;
    const circumference = 2 * Math.PI * r;
    const strokeDashoffset = circumference * (1 - pct / 100);

    const unlocked = achievements.filter((a) => a.unlocked);
    const inProgress = achievements.filter((a) => !a.unlocked && a.progress);
    const locked = achievements.filter((a) => !a.unlocked && !a.progress);

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
            {/* Newly Unlocked Toast */}
            {newlyUnlocked.length > 0 && (
                <div className="toast animate-scale-in">
                    <div
                        className="glass-card"
                        style={{
                            padding: "13px 18px",
                            borderColor: "rgba(245,200,66,0.4)",
                        }}
                    >
                        <p
                            style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                textAlign: "center",
                                color: "var(--gold)",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            Unlocked: {newlyUnlocked.join(", ")}! +50 EXP each
                        </p>
                    </div>
                </div>
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

                {/* Ring */}
                <div
                    style={{
                        flexShrink: 0,
                        position: "relative",
                        width: 96,
                        height: 96,
                    }}
                >
                    <svg
                        width="96"
                        height="96"
                        style={{ transform: "rotate(-90deg)" }}
                    >
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke="var(--bg-raised)"
                            strokeWidth="6"
                        />
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke="var(--gold)"
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
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "var(--gold)",
                                lineHeight: 1,
                            }}
                        >
                            {pct}%
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
                        }}
                    >
                        AWARDS
                    </h1>
                    <p
                        style={{
                            margin: 0,
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                            {stats.unlocked}
                        </span>{" "}
                        / {stats.total} unlocked
                    </p>
                    {newlyUnlocked.length > 0 && (
                        <div
                            style={{
                                marginTop: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "11px",
                                    color: "var(--gold)",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                New: {newlyUnlocked[0]}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Unlocked */}
            {unlocked.length > 0 && (
                <div
                    className="animate-fade-in-up stagger-1"
                    style={{ marginBottom: "14px" }}
                >
                    <SectionHeader title="UNLOCKED" accent="var(--gold)" />
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                        }}
                    >
                        {unlocked.map((a) => (
                            <AchievementCard key={a.id} achievement={a} />
                        ))}
                    </div>
                </div>
            )}

            {/* In Progress */}
            {inProgress.length > 0 && (
                <div
                    className="animate-fade-in-up stagger-2"
                    style={{ marginBottom: "14px" }}
                >
                    <SectionHeader title="IN PROGRESS" accent="var(--cyan)" />
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                        }}
                    >
                        {inProgress.map((a) => (
                            <AchievementCard key={a.id} achievement={a} />
                        ))}
                    </div>
                </div>
            )}

            {/* Locked */}
            {locked.length > 0 && (
                <div className="animate-fade-in-up stagger-3">
                    <SectionHeader
                        title="🔒 LOCKED"
                        accent="var(--text-disabled)"
                    />
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                        }}
                    >
                        {locked.map((a) => (
                            <AchievementCard key={a.id} achievement={a} />
                        ))}
                    </div>
                </div>
            )}
            {/* Boss History */}
            <div
                className="animate-fade-in-up stagger-4"
                style={{ marginTop: "14px" }}
            >
                <SectionHeader
                    title="BOSS HISTORY"
                    accent="var(--ruby, #E05252)"
                />
                {bossHistory.history.length > 0 ? (
                    <div
                        style={{
                            borderRadius: "16px",
                            padding: "16px",
                            background: "rgba(19,25,32,0.6)",
                            border: "1px solid var(--border-subtle)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                marginBottom: "14px",
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: "12px",
                                    background: "var(--bg-raised)",
                                    textAlign: "center",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: 700,
                                        fontFamily: "var(--font-mono)",
                                        color: "var(--gold)",
                                    }}
                                >
                                    {bossHistory.stats.total}
                                </div>
                                <div
                                    style={{
                                        fontSize: "9px",
                                        color: "var(--text-muted)",
                                        fontWeight: 600,
                                        letterSpacing: "0.08em",
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    BATTLES WON
                                </div>
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: "12px",
                                    background: "var(--bg-raised)",
                                    textAlign: "center",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: 700,
                                        fontFamily: "var(--font-mono)",
                                        color: "var(--emerald)",
                                    }}
                                >
                                    {bossHistory.stats.consecutiveWeeks}
                                </div>
                                <div
                                    style={{
                                        fontSize: "9px",
                                        color: "var(--text-muted)",
                                        fontWeight: 600,
                                        letterSpacing: "0.08em",
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    WEEK STREAK
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                            }}
                        >
                            {bossHistory.history.slice(0, 8).map((entry) => (
                                <div
                                    key={entry.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "8px 10px",
                                        borderRadius: "10px",
                                        background: "var(--bg-surface)",
                                        border: "1px solid var(--border-subtler)",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            fontSize: "16px",
                                        }}
                                    >
                                        <Swords
                                            size={16}
                                            color="var(--ruby)"
                                            strokeWidth={2}
                                        />
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                fontFamily: "var(--font-body)",
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            Week {entry.weekNumber},{" "}
                                            {entry.year}
                                        </p>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: "10px",
                                                color: "var(--text-muted)",
                                                fontFamily: "var(--font-body)",
                                            }}
                                        >
                                            {entry.challengeName ||
                                                "Weekly Challenge"}
                                        </p>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: "9px",
                                            color: "var(--emerald)",
                                            fontWeight: 600,
                                            fontFamily: "var(--font-mono)",
                                        }}
                                    >
                                        <CheckCircle2
                                            size={12}
                                            color="var(--emerald)"
                                            strokeWidth={2}
                                            style={{
                                                display: "inline",
                                                verticalAlign: "middle",
                                                marginRight: "3px",
                                            }}
                                        />
                                        {new Date(
                                            entry.completedAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            borderRadius: "16px",
                            padding: "24px 16px",
                            background: "rgba(19,25,32,0.4)",
                            border: "1px solid var(--border-subtle)",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: "8px",
                            }}
                        >
                            <Swords
                                size={32}
                                color="var(--text-muted)"
                                strokeWidth={1.5}
                            />
                        </div>
                        <p
                            style={{
                                fontSize: "12px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                                margin: 0,
                            }}
                        >
                            Complete Weekly Boss Challenges to build your
                            history!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function SectionHeader({ title, accent }: { title: string; accent: string }) {
    return (
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
                    background: accent,
                    flexShrink: 0,
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
                {title}
            </h3>
        </div>
    );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
    return (
        <div
            style={{
                borderRadius: "16px",
                padding: "14px",
                background: a.unlocked
                    ? "rgba(19,25,32,0.8)"
                    : "rgba(19,25,32,0.4)",
                border: a.unlocked
                    ? "1px solid rgba(245,200,66,0.25)"
                    : "1px solid rgba(255,255,255,0.04)",
                opacity: a.unlocked ? 1 : a.progress ? 0.8 : 0.45,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Gold glow for unlocked */}
            {a.unlocked && (
                <div
                    style={{
                        position: "absolute",
                        top: -20,
                        right: -20,
                        width: 80,
                        height: 80,
                        background:
                            "radial-gradient(circle, rgba(245,200,66,0.08) 0%, transparent 70%)",
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Icon */}
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    background: a.unlocked
                        ? "var(--gold-dim)"
                        : "var(--bg-raised)",
                    border: a.unlocked
                        ? "1px solid var(--gold-muted)"
                        : "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: a.unlocked ? "22px" : "18px",
                    filter:
                        !a.unlocked && !a.progress ? "grayscale(1)" : "none",
                    boxShadow: a.unlocked
                        ? "0 0 12px rgba(245,200,66,0.15)"
                        : "none",
                }}
            >
                {a.unlocked ? a.icon : a.progress ? a.icon : "🔒"}
            </div>

            {/* Info */}
            <div>
                <p
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "12px",
                        fontWeight: 700,
                        margin: "0 0 2px",
                        color: a.unlocked
                            ? "var(--text-primary)"
                            : "var(--text-muted)",
                    }}
                >
                    {a.unlocked ? a.name : a.progress ? a.name : "???"}
                </p>
                <p
                    style={{
                        margin: 0,
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                        lineHeight: 1.4,
                    }}
                >
                    {a.unlocked ? a.description : a.condition}
                </p>
            </div>

            {/* Progress bar for in-progress */}
            {a.progress && !a.unlocked && (
                <div>
                    <div
                        style={{
                            height: 4,
                            background: "var(--bg-raised)",
                            borderRadius: 99,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                borderRadius: 99,
                                width: `${Math.min(100, (a.progress.current / a.progress.target) * 100)}%`,
                                background:
                                    "linear-gradient(to right, var(--cyan-muted), var(--cyan))",
                                transition: "width 0.6s ease-out",
                            }}
                        />
                    </div>
                    <p
                        style={{
                            margin: "3px 0 0",
                            fontSize: "9px",
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-muted)",
                        }}
                    >
                        {a.progress.current}/{a.progress.target}
                    </p>
                </div>
            )}

            {/* Unlock date */}
            {a.unlocked && a.unlockedAt && (
                <span
                    style={{
                        fontSize: "9px",
                        color: "var(--emerald)",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                    }}
                >
                    <CheckCircle2
                        size={9}
                        color="var(--emerald)"
                        strokeWidth={2.5}
                        style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: 3,
                        }}
                    />
                    {new Date(a.unlockedAt).toLocaleDateString()}
                </span>
            )}
        </div>
    );
}
