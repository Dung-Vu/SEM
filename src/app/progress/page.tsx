"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Home,
    TreePine,
    Castle,
    Swords,
    Crown,
    BookMarked,
    Ruler,
    Ear,
    Mic2,
    PenLine,
    BarChart3,
    Trophy,
    PenSquare,
    CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Pure-SVG Radar Chart ──────────────────────────────────────────────────────
function RadarChart({
    stats,
}: {
    stats: {
        vocab: number;
        grammar: number;
        listening: number;
        speaking: number;
        writing: number;
    };
}) {
    const SIZE = 160;
    const CENTER = SIZE / 2;
    const RADIUS = 62;
    const skills = [
        { label: "Vocab", value: stats.vocab, color: "var(--cyan)" },
        { label: "Grammar", value: stats.grammar, color: "var(--emerald)" },
        { label: "Listening", value: stats.listening, color: "var(--gold)" },
        { label: "Speaking", value: stats.speaking, color: "var(--violet)" },
        { label: "Writing", value: stats.writing, color: "var(--ruby)" },
    ];
    const n = skills.length;
    // Angle: start at top (−π/2), go clockwise
    const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
    const pt = (i: number, r: number) => ({
        x: CENTER + r * Math.cos(angle(i)),
        y: CENTER + r * Math.sin(angle(i)),
    });

    // Grid lines — 5 levels (0–10)
    const gridLevels = [2, 4, 6, 8, 10];

    const dataPoints = skills.map((s, i) =>
        pt(i, (Math.min(s.value, 10) / 10) * RADIUS),
    );
    const dataPath =
        dataPoints
            .map(
                (p, i) =>
                    `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
            )
            .join(" ") + "Z";

    return (
        <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ overflow: "visible" }}
        >
            {/* Grid polygons */}
            {gridLevels.map((level) => {
                const pts = Array.from({ length: n }, (_, i) =>
                    pt(i, (level / 10) * RADIUS),
                );
                const d =
                    pts
                        .map(
                            (p, i) =>
                                `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
                        )
                        .join(" ") + "Z";
                return (
                    <path
                        key={level}
                        d={d}
                        fill="none"
                        stroke="var(--border-subtle)"
                        strokeWidth={0.8}
                    />
                );
            })}
            {/* Axis lines */}
            {Array.from({ length: n }, (_, i) => {
                const outer = pt(i, RADIUS);
                return (
                    <line
                        key={i}
                        x1={CENTER}
                        y1={CENTER}
                        x2={outer.x}
                        y2={outer.y}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={0.8}
                    />
                );
            })}
            {/* Data fill */}
            <path
                d={dataPath}
                fill="rgba(34,211,238,0.12)"
                stroke="rgba(34,211,238,0.7)"
                strokeWidth={1.5}
                strokeLinejoin="round"
            />
            {/* Data dots */}
            {dataPoints.map((p, i) => (
                <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill={skills[i].color}
                    stroke="rgba(7,8,13,0.8)"
                    strokeWidth={1}
                />
            ))}
            {/* Labels */}
            {skills.map((s, i) => {
                const labelR = RADIUS + 18;
                const p = pt(i, labelR);
                const anchor =
                    Math.abs(Math.cos(angle(i))) < 0.15
                        ? "middle"
                        : Math.cos(angle(i)) > 0
                          ? "start"
                          : "end";
                return (
                    <text
                        key={s.label}
                        x={p.x}
                        y={p.y + 4}
                        textAnchor={anchor}
                        fontSize={8}
                        fontFamily="var(--font-body)"
                        fontWeight={600}
                        fill={s.color}
                        opacity={0.85}
                    >
                        {s.label}
                    </text>
                );
            })}
        </svg>
    );
}

interface ProgressData {
    user: { username: string; exp: number; streak: number; createdAt: string };
    level: number;
    levelProgress: { current: number; needed: number; percentage: number };
    kingdom: { name: string; icon: string; tier: string };
    words: { total: number; mastered: number; learning: number; new: number };
    activity: { daysActive: number; daysSinceStart: number; totalExp: number };
    expByWeek: { week: string; exp: number }[];
    heatmapData: Record<string, number>;
    stats: {
        vocab: number;
        grammar: number;
        listening: number;
        speaking: number;
        writing: number;
    } | null;
    journalCount: number;
    resourcesDone: number;
    questsDoneToday: number;
}

const KINGDOMS = [
    {
        name: "Beginner Village",
        levels: "1-5",
        tier: "A1-A2",
        icon: Home,
        color: "var(--cyan)",
        dim: "rgba(10,48,64,0.5)",
        border: "rgba(34,211,238,0.3)",
    },
    {
        name: "Grammar Forest",
        levels: "6-10",
        tier: "A2-B1",
        icon: TreePine,
        color: "var(--emerald)",
        dim: "rgba(5,46,22,0.5)",
        border: "rgba(52,211,153,0.3)",
    },
    {
        name: "Fluency Castle",
        levels: "11-15",
        tier: "B1-B2",
        icon: Castle,
        color: "var(--gold)",
        dim: "rgba(107,90,42,0.4)",
        border: "rgba(245,200,66,0.3)",
    },
    {
        name: "IELTS Arena",
        levels: "16-20",
        tier: "B2-C1",
        icon: Swords,
        color: "var(--ruby)",
        dim: "rgba(48,10,10,0.5)",
        border: "rgba(248,113,113,0.3)",
    },
    {
        name: "Legend Realm",
        levels: "21+",
        tier: "C1-C2",
        icon: Crown,
        color: "var(--violet)",
        dim: "rgba(30,10,60,0.5)",
        border: "rgba(167,139,250,0.3)",
    },
];

const SKILL_CONFIG: Record<string, { color: string; icon: LucideIcon }> = {
    vocab: { color: "var(--cyan)", icon: BookMarked },
    grammar: { color: "var(--emerald)", icon: Ruler },
    listening: { color: "var(--gold)", icon: Ear },
    speaking: { color: "var(--violet)", icon: Mic2 },
    writing: { color: "var(--ruby)", icon: PenLine },
};

export default function ProgressPage() {
    const [data, setData] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);
    const [milestones, setMilestones] = useState<
        {
            id: string;
            key: string;
            title: string;
            description: string;
            targetType: string;
            targetValue: number;
            rewardDesc: string;
            expReward: number;
            order: number;
            unlocked: boolean;
            achievedAt: string | null;
        }[]
    >([]);

    const fetchProgress = useCallback(async () => {
        try {
            const [res, mRes] = await Promise.all([
                fetch("/api/progress"),
                fetch("/api/milestones"),
            ]);
            if (!res.ok) throw new Error("API");
            setData(await res.json());
            const mData = await mRes.json();
            if (mData.milestones) setMilestones(mData.milestones);
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    if (loading || !data) {
        return (
            <div style={{ paddingTop: "8px" }}>
                <div
                    className="skeleton"
                    style={{ height: 120, borderRadius: 20, marginBottom: 12 }}
                />
                <div
                    className="skeleton"
                    style={{ height: 220, borderRadius: 20, marginBottom: 12 }}
                />
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        gap: 8,
                        marginBottom: 12,
                    }}
                >
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="skeleton"
                            style={{ height: 72, borderRadius: 14 }}
                        />
                    ))}
                </div>
                <div
                    className="skeleton"
                    style={{ height: 160, borderRadius: 20 }}
                />
            </div>
        );
    }

    const maxWeekExp = Math.max(...data.expByWeek.map((w) => w.exp), 1);
    const heatmapDays: { date: string; exp: number }[] = [];
    for (let i = 364; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        heatmapDays.push({
            date: dateStr,
            exp: data.heatmapData[dateStr] || 0,
        });
    }

    const getHeatColor = (exp: number) => {
        if (exp === 0) return "rgba(255,255,255,0.03)";
        if (exp < 30) return "rgba(245,200,66,0.2)";
        if (exp < 80) return "rgba(245,200,66,0.45)";
        if (exp < 150) return "rgba(245,200,66,0.7)";
        return "var(--gold)";
    };

    const currentKingdomIdx = Math.min(Math.floor((data.level - 1) / 5), 4);

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
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
                    Progress
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        margin: 0,
                    }}
                >
                    Your English learning journey
                </p>
            </div>

            {/* ─── STATS ROW ─── */}
            <div
                className="animate-fade-in-up stagger-1"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "6px",
                    marginBottom: "14px",
                }}
            >
                {[
                    {
                        value: data.activity.daysSinceStart,
                        label: "Days",
                        color: "var(--cyan)",
                    },
                    {
                        value: data.activity.totalExp,
                        label: "Total EXP",
                        color: "var(--gold)",
                    },
                    {
                        value: data.words.total,
                        label: "Words",
                        color: "var(--emerald)",
                    },
                    {
                        value: data.activity.daysActive,
                        label: "Active Days",
                        color: "var(--violet)",
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="glass-card"
                        style={{ padding: "12px", textAlign: "center" }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "18px",
                                fontWeight: 600,
                                color: item.color,
                                margin: "0 0 3px",
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

            {/* ─── KINGDOM MAP (vertical path) ─── */}
            <div
                className="glass-card animate-fade-in-up stagger-2"
                style={{ padding: "16px", marginBottom: "14px" }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "14px",
                    }}
                >
                    <div
                        style={{
                            width: 3,
                            height: 14,
                            borderRadius: 99,
                            background: "var(--gold)",
                            flexShrink: 0,
                        }}
                    />
                    <h3
                        style={{
                            margin: 0,
                            fontFamily: "var(--font-display)",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                        }}
                    >
                        Kingdom Map
                    </h3>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0",
                    }}
                >
                    {KINGDOMS.map((k, i) => {
                        const isCurrent = i === currentKingdomIdx;
                        const isDone = i < currentKingdomIdx;
                        const isLocked = i > currentKingdomIdx;
                        return (
                            <div
                                key={k.name}
                                style={{
                                    display: "flex",
                                    alignItems: "stretch",
                                    gap: "12px",
                                }}
                            >
                                {/* Vertical connector */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        width: 32,
                                        flexShrink: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",
                                            flexShrink: 0,
                                            background: isCurrent
                                                ? k.dim
                                                : isDone
                                                  ? "rgba(52,211,153,0.15)"
                                                  : "var(--bg-raised)",
                                            border: `2px solid ${isCurrent ? k.color : isDone ? "var(--emerald)" : "var(--border-subtle)"}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "14px",
                                            boxShadow: isCurrent
                                                ? `0 0 12px ${k.color}40`
                                                : "none",
                                            transition: "all 0.3s",
                                        }}
                                    >
                                        {isDone ? (
                                            <CheckCircle2
                                                size={14}
                                                color="var(--emerald)"
                                                strokeWidth={2}
                                            />
                                        ) : (
                                            <k.icon
                                                size={14}
                                                color={k.color}
                                                strokeWidth={2}
                                            />
                                        )}
                                    </div>
                                    {i < KINGDOMS.length - 1 && (
                                        <div
                                            style={{
                                                width: 2,
                                                flex: 1,
                                                minHeight: 14,
                                                background: isDone
                                                    ? "var(--emerald)"
                                                    : "rgba(255,255,255,0.08)",
                                                margin: "3px 0",
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Kingdom info */}
                                <div
                                    style={{
                                        flex: 1,
                                        paddingBottom:
                                            i < KINGDOMS.length - 1
                                                ? "16px"
                                                : "0",
                                        paddingTop: "4px",
                                        opacity: isLocked ? 0.35 : 1,
                                    }}
                                >
                                    <div
                                        style={{
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
                                                    fontSize: "13px",
                                                    fontWeight: 700,
                                                    margin: "0 0 2px",
                                                    color: isCurrent
                                                        ? k.color
                                                        : "var(--text-primary)",
                                                }}
                                            >
                                                {k.name}
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: "10px",
                                                    color: "var(--text-muted)",
                                                    fontFamily:
                                                        "var(--font-body)",
                                                    margin: 0,
                                                }}
                                            >
                                                Lv.{k.levels} · {k.tier}
                                            </p>
                                        </div>
                                        {isCurrent && (
                                            <span
                                                style={{
                                                    fontSize: "10px",
                                                    padding: "3px 10px",
                                                    borderRadius: 99,
                                                    background: k.dim,
                                                    border: `1px solid ${k.border}`,
                                                    color: k.color,
                                                    fontFamily:
                                                        "var(--font-body)",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                HERE
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── EXP BY WEEK BAR CHART ─── */}
            <div
                className="glass-card animate-fade-in-up stagger-3"
                style={{ padding: "16px", marginBottom: "14px" }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "12px",
                    }}
                >
                    <div
                        style={{
                            width: 3,
                            height: 14,
                            borderRadius: 99,
                            background: "var(--gold)",
                            flexShrink: 0,
                        }}
                    />
                    <h3
                        style={{
                            margin: 0,
                            fontFamily: "var(--font-display)",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                        }}
                    >
                        EXP by Week
                    </h3>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "3px",
                        height: "90px",
                    }}
                >
                    {data.expByWeek.map((w, i) => {
                        const isLast = i === data.expByWeek.length - 1;
                        const heightPct = Math.max(
                            3,
                            (w.exp / maxWeekExp) * 100,
                        );
                        return (
                            <div
                                key={w.week}
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    height: "100%",
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            borderRadius: "4px 4px 0 0",
                                            height: `${heightPct}%`,
                                            background:
                                                w.exp > 0
                                                    ? isLast
                                                        ? "linear-gradient(to top, var(--gold-muted), var(--gold))"
                                                        : "linear-gradient(to top, rgba(245,200,66,0.2), rgba(245,200,66,0.5))"
                                                    : "rgba(255,255,255,0.04)",
                                            boxShadow:
                                                isLast && w.exp > 0
                                                    ? "0 0 8px rgba(245,200,66,0.3)"
                                                    : "none",
                                            transition: "height 0.5s ease-out",
                                        }}
                                    />
                                </div>
                                <p
                                    style={{
                                        fontSize: "7px",
                                        color: isLast
                                            ? "var(--gold)"
                                            : "var(--text-muted)",
                                        marginTop: "3px",
                                        fontFamily: "var(--font-mono)",
                                    }}
                                >
                                    {w.week}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── SKILLS ─── */}
            {data.stats && (
                <div
                    className="glass-card animate-fade-in-up stagger-4"
                    style={{ padding: "16px", marginBottom: "14px" }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "12px",
                        }}
                    >
                        <div
                            style={{
                                width: 3,
                                height: 14,
                                borderRadius: 99,
                                background: "var(--violet)",
                                flexShrink: 0,
                            }}
                        />
                        <h3
                            style={{
                                margin: 0,
                                fontFamily: "var(--font-display)",
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                            }}
                        >
                            Skills
                        </h3>
                    </div>
                    {(
                        [
                            "vocab",
                            "grammar",
                            "listening",
                            "speaking",
                            "writing",
                        ] as const
                    ).map((skill) => {
                        const val = data.stats![skill];
                        const cfg = SKILL_CONFIG[skill];
                        return (
                            <div
                                key={skill}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "8px",
                                }}
                            >
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        width: "20px",
                                    }}
                                >
                                    <cfg.icon
                                        size={14}
                                        color={cfg.color}
                                        strokeWidth={2}
                                    />
                                </span>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        width: "58px",
                                        textTransform: "capitalize",
                                        color: "var(--text-secondary)",
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    {skill}
                                </span>
                                <div
                                    style={{
                                        flex: 1,
                                        height: "6px",
                                        background: "var(--bg-raised)",
                                        borderRadius: 99,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${val * 10}%`,
                                            height: "100%",
                                            borderRadius: 99,
                                            background: cfg.color,
                                            boxShadow: `0 0 8px ${cfg.color}60`,
                                            transition: "width 0.6s ease-out",
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: cfg.color,
                                        width: "22px",
                                        textAlign: "right",
                                    }}
                                >
                                    {val}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── SKILLS RADAR ─── */}
            {data.stats && (
                <div
                    className="glass-card animate-fade-in-up stagger-4"
                    style={{
                        padding: "16px",
                        marginBottom: "14px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "12px",
                            width: "100%",
                        }}
                    >
                        <div
                            style={{
                                width: 3,
                                height: 14,
                                borderRadius: 99,
                                background: "var(--cyan)",
                                flexShrink: 0,
                            }}
                        />
                        <h3
                            style={{
                                margin: 0,
                                fontFamily: "var(--font-display)",
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                            }}
                        >
                            Skills Radar
                        </h3>
                    </div>
                    <RadarChart stats={data.stats} />
                </div>
            )}

            {/* ─── VOCABULARY BREAKDOWN ─── */}

            <div
                className="glass-card animate-fade-in-up stagger-5"
                style={{ padding: "16px", marginBottom: "14px" }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "12px",
                    }}
                >
                    <div
                        style={{
                            width: 3,
                            height: 14,
                            borderRadius: 99,
                            background: "var(--emerald)",
                            flexShrink: 0,
                        }}
                    />
                    <h3
                        style={{
                            margin: 0,
                            fontFamily: "var(--font-display)",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                        }}
                    >
                        Vocabulary
                    </h3>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        gap: "8px",
                    }}
                >
                    {[
                        {
                            value: data.words.new,
                            label: "New",
                            color: "var(--text-muted)",
                        },
                        {
                            value: data.words.learning,
                            label: "Learning",
                            color: "var(--amber)",
                        },
                        {
                            value: data.words.mastered,
                            label: "Mastered",
                            color: "var(--emerald)",
                        },
                        {
                            value: data.words.total,
                            label: "Total",
                            color: "var(--gold)",
                        },
                    ].map((item) => (
                        <div key={item.label} style={{ textAlign: "center" }}>
                            <p
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "20px",
                                    fontWeight: 600,
                                    color: item.color,
                                    margin: "0 0 3px",
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
                                }}
                            >
                                {item.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── 365-day HEATMAP (gold) ─── */}
            <div
                className="glass-card animate-fade-in-up"
                style={{ padding: "16px", marginBottom: "14px" }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "10px",
                    }}
                >
                    <div
                        style={{
                            width: 3,
                            height: 14,
                            borderRadius: 99,
                            background: "var(--gold)",
                            flexShrink: 0,
                        }}
                    />
                    <h3
                        style={{
                            margin: 0,
                            fontFamily: "var(--font-display)",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                        }}
                    >
                        365-Day Activity
                    </h3>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(52, 1fr)",
                        gap: "2px",
                        overflowX: "auto",
                    }}
                >
                    {heatmapDays.slice(-364).map((day) => (
                        <div
                            key={day.date}
                            title={`${day.date}: ${day.exp} EXP`}
                            style={{
                                aspectRatio: "1",
                                borderRadius: "2px",
                                background: getHeatColor(day.exp),
                                transition: "opacity 0.2s",
                            }}
                        />
                    ))}
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "3px",
                        marginTop: "8px",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: "9px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        Less
                    </span>
                    {[0, 20, 60, 120, 200].map((v) => (
                        <div
                            key={v}
                            style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "2px",
                                background: getHeatColor(v),
                            }}
                        />
                    ))}
                    <span
                        style={{
                            fontSize: "9px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        More
                    </span>
                </div>
            </div>

            {/* ─── QUICK LINKS ─── */}
            <div
                className="animate-fade-in-up"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                }}
            >
                {[
                    {
                        href: "/achievements",
                        icon: Trophy,
                        label: "Achievements",
                        color: "var(--gold)",
                    },
                    {
                        href: "/stats/weekly",
                        icon: BarChart3,
                        label: "Weekly Stats",
                        color: "var(--cyan)",
                    },
                    {
                        href: "/journal",
                        icon: PenSquare,
                        label: "Journal",
                        color: "var(--violet)",
                    },
                ].map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                            padding: "14px 8px",
                            borderRadius: "14px",
                            textDecoration: "none",
                            background: "var(--bg-surface)",
                            border: "1px solid rgba(255,255,255,0.04)",
                            transition: "all 0.2s",
                        }}
                    >
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <link.icon
                                size={22}
                                color={link.color}
                                strokeWidth={2}
                            />
                        </span>
                        <span
                            style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                color: link.color,
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            {link.label}
                        </span>
                    </a>
                ))}
            </div>

            {/* ─── Milestone Timeline ─── */}
            {milestones.length > 0 && (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{ padding: "16px", marginBottom: "16px" }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "16px",
                        }}
                    >
                        <div
                            style={{
                                width: 3,
                                height: 14,
                                borderRadius: 99,
                                background: "var(--gold)",
                                flexShrink: 0,
                            }}
                        />
                        <h3
                            style={{
                                margin: 0,
                                fontFamily: "var(--font-display)",
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                            }}
                        >
                            MILESTONE TIMELINE
                        </h3>
                        <span
                            style={{
                                marginLeft: "auto",
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                color: "var(--gold)",
                                fontWeight: 600,
                            }}
                        >
                            {milestones.filter((m) => m.unlocked).length}/
                            {milestones.length}
                        </span>
                    </div>
                    <div style={{ position: "relative" }}>
                        <div
                            style={{
                                position: "absolute",
                                left: 14,
                                top: 0,
                                bottom: 0,
                                width: 2,
                                background: "var(--border-subtle)",
                                borderRadius: 99,
                            }}
                        />
                        {milestones.map((m, idx) => (
                            <div
                                key={m.id}
                                style={{
                                    display: "flex",
                                    gap: "12px",
                                    marginBottom:
                                        idx < milestones.length - 1
                                            ? "12px"
                                            : 0,
                                    alignItems: "flex-start",
                                }}
                            >
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: "50%",
                                        flexShrink: 0,
                                        zIndex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: m.unlocked
                                            ? "var(--gold-dim)"
                                            : "var(--bg-raised)",
                                        border: `2px solid ${m.unlocked ? "var(--gold)" : "rgba(255,255,255,0.1)"}`,
                                        fontSize: "11px",
                                        fontFamily: "var(--font-mono)",
                                        fontWeight: 700,
                                        color: m.unlocked
                                            ? "var(--gold)"
                                            : "var(--text-muted)",
                                    }}
                                >
                                    {m.unlocked ? "✓" : m.order}
                                </div>
                                <div style={{ flex: 1, paddingTop: "4px" }}>
                                    <p
                                        style={{
                                            margin: "0 0 2px",
                                            fontFamily: "var(--font-display)",
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            color: m.unlocked
                                                ? "var(--text-primary)"
                                                : "var(--text-muted)",
                                        }}
                                    >
                                        {m.title}
                                    </p>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontFamily: "var(--font-body)",
                                            fontSize: "11px",
                                            color: "var(--text-muted)",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {m.description}
                                    </p>
                                    {m.unlocked && (
                                        <p
                                            style={{
                                                margin: "4px 0 0",
                                                fontFamily: "var(--font-mono)",
                                                fontSize: "10px",
                                                color: "var(--gold)",
                                                fontWeight: 600,
                                            }}
                                        >
                                            +{m.expReward} EXP · {m.rewardDesc}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
