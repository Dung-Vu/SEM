"use client";

import { useEffect, useState, useCallback } from "react";
import {
    BarChart3,
    BookMarked,
    Target,
    Ear,
    Mic2,
    PenLine,
    TrendingUp,
    ScrollText,
    Star,
    Gamepad2,
    Sparkles,
    AlertTriangle,
} from "lucide-react";

interface WeeklyLog {
    id: string;
    weekNumber: number;
    year: number;
    vocab: number;
    grammar: number;
    listening: number;
    speaking: number;
    writing: number;
    totalExp: number;
    highlight: string;
    struggle: string;
    focus: string;
    createdAt: string;
}

export default function WeeklyStatsPage() {
    const [logs, setLogs] = useState<WeeklyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    const [form, setForm] = useState({
        vocab: 5,
        grammar: 5,
        listening: 5,
        speaking: 5,
        writing: 5,
        highlight: "",
        struggle: "",
        focus: "",
    });

    const fetchLogs = useCallback(async () => {
        try {
            const res = await fetch("/api/stats/weekly");
            const data = await res.json();
            setLogs(data.logs || []);
            const now = new Date();
            const currentWeek = getWeekNumber(now);
            const currentYear = now.getFullYear();
            const hasThisWeek = (data.logs || []).some(
                (l: WeeklyLog) =>
                    l.weekNumber === currentWeek && l.year === currentYear,
            );
            setAlreadySubmitted(hasThisWeek);
        } catch {
            console.error("Failed to fetch weekly stats");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/stats/weekly", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            setToast(data.success ? data.message : data.message);
            if (data.success) {
                setAlreadySubmitted(true);
                await fetchLogs();
            }
            setTimeout(() => setToast(null), 4000);
        } catch {
            setToast("Error submitting stats");
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSubmitting(false);
        }
    };

    const statFields = [
        {
            key: "vocab" as const,
            label: "Vocabulary",
            icon: BookMarked,
            color: "var(--violet-bright)",
        },
        {
            key: "grammar" as const,
            label: "Grammar",
            icon: Target,
            color: "var(--emerald-bright)",
        },
        {
            key: "listening" as const,
            label: "Listening",
            icon: Ear,
            color: "var(--amber)",
        },
        {
            key: "speaking" as const,
            label: "Speaking",
            icon: Mic2,
            color: "var(--gold)",
        },
        {
            key: "writing" as const,
            label: "Writing",
            icon: PenLine,
            color: "var(--ruby-bright)",
        },
    ];

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <BarChart3
                            size={40}
                            color="var(--cyan)"
                            strokeWidth={1.5}
                        />
                    </div>
                    <p
                        style={{
                            color: "var(--text-secondary)",
                            marginTop: "12px",
                            fontSize: "14px",
                        }}
                    >
                        Loading stats...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
            {/* Toast */}
            {toast && (
                <div className="toast animate-scale-in">
                    <div
                        className="glass-card"
                        style={{
                            padding: "14px 18px",
                            borderColor: "rgba(99,102,241,0.3)",
                        }}
                    >
                        <p
                            style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                textAlign: "center",
                            }}
                        >
                            {toast}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div
                className="animate-fade-in-up"
                style={{ marginBottom: "16px" }}
            >
                <a
                    href="/"
                    style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        fontWeight: 600,
                    }}
                >
                    ← Home
                </a>
                <h1
                    style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        margin: "4px 0 0 0",
                    }}
                >
                    <BarChart3
                        size={20}
                        color="var(--cyan)"
                        strokeWidth={2}
                        style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: "6px",
                        }}
                    />
                    <span className="gradient-text">Weekly Assessment</span>
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        marginTop: "4px",
                    }}
                >
                    Rate your skills 1-10. Be honest with yourself.
                </p>
            </div>

            {/* No-history notice for new users */}
            {logs.length === 0 && (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{
                        padding: "20px",
                        marginBottom: "12px",
                        textAlign: "center",
                        border: "1px solid rgba(99,102,241,0.2)",
                        background: "rgba(99,102,241,0.06)",
                    }}
                >
                    <Sparkles
                        size={32}
                        color="var(--violet)"
                        strokeWidth={1.5}
                        style={{ marginBottom: 8 }}
                    />
                    <p
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: 4,
                        }}
                    >
                        Tuần đầu tiên!
                    </p>
                    <p
                        style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                        }}
                    >
                        Chưa có báo cáo nào. Điền đánh giá tuần này bên dưới —
                        lịch sử sẽ xuất hiện từ tuần sau trở đi.
                    </p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <div
                    className="glass-card animate-fade-in-up"
                    style={{
                        padding: "18px",
                        marginBottom: "12px",
                        animationDelay: "0.05s",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            margin: "0 0 16px 0",
                        }}
                    >
                        Skill Ratings
                    </h3>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "18px",
                        }}
                    >
                        {statFields.map((field) => (
                            <div key={field.key}>
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
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        <field.icon
                                            size={13}
                                            color={field.color}
                                            strokeWidth={2}
                                            style={{
                                                display: "inline",
                                                verticalAlign: "middle",
                                                marginRight: "4px",
                                            }}
                                        />{" "}
                                        {field.label}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "24px",
                                            fontWeight: 800,
                                            color: field.color,
                                            minWidth: "36px",
                                            textAlign: "right",
                                        }}
                                    >
                                        {form[field.key]}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={10}
                                    value={form[field.key]}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            [field.key]: parseInt(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                    disabled={alreadySubmitted}
                                    style={{ accentColor: field.color }}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "10px",
                                        color: "var(--text-muted)",
                                        marginTop: "4px",
                                    }}
                                >
                                    <span>Beginner</span>
                                    <span>Expert</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reflection */}
                <div
                    className="glass-card animate-fade-in-up"
                    style={{
                        padding: "18px",
                        marginBottom: "12px",
                        animationDelay: "0.1s",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            margin: "0 0 14px 0",
                        }}
                    >
                        Reflection
                    </h3>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                        }}
                    >
                        <div>
                            <label
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    display: "block",
                                    marginBottom: "6px",
                                }}
                            >
                                Highlight tuần này
                            </label>
                            <textarea
                                value={form.highlight}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        highlight: e.target.value,
                                    })
                                }
                                placeholder="What are you most proud of?"
                                disabled={alreadySubmitted}
                                rows={2}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    fontSize: "16px",
                                    borderRadius: "12px",
                                    background: "var(--bg-raised)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    color: "var(--text-primary)",
                                    resize: "none",
                                    outline: "none",
                                    fontFamily: "var(--font-sans)",
                                }}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    display: "block",
                                    marginBottom: "6px",
                                }}
                            >
                                Khó khăn nhất
                            </label>
                            <textarea
                                value={form.struggle}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        struggle: e.target.value,
                                    })
                                }
                                placeholder="What was hardest?"
                                disabled={alreadySubmitted}
                                rows={2}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    fontSize: "16px",
                                    borderRadius: "12px",
                                    background: "var(--bg-raised)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    color: "var(--text-primary)",
                                    resize: "none",
                                    outline: "none",
                                    fontFamily: "var(--font-sans)",
                                }}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    display: "block",
                                    marginBottom: "6px",
                                }}
                            >
                                Focus tuần tới
                            </label>
                            <textarea
                                value={form.focus}
                                onChange={(e) =>
                                    setForm({ ...form, focus: e.target.value })
                                }
                                placeholder="What will you focus on?"
                                disabled={alreadySubmitted}
                                rows={2}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    fontSize: "16px",
                                    borderRadius: "12px",
                                    background: "var(--bg-raised)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    color: "var(--text-primary)",
                                    resize: "none",
                                    outline: "none",
                                    fontFamily: "var(--font-sans)",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div
                    className="animate-fade-in-up"
                    style={{ marginBottom: "16px", animationDelay: "0.15s" }}
                >
                    <button
                        type="submit"
                        disabled={alreadySubmitted || submitting}
                        className={
                            alreadySubmitted ? "btn-secondary" : "btn-primary"
                        }
                    >
                        {submitting
                            ? "Submitting..."
                            : alreadySubmitted
                              ? "Submitted This Week"
                              : "Submit Assessment (+50 EXP)"}
                    </button>
                </div>
            </form>

            {/* Trend Chart */}
            {logs.length >= 2 && (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{
                        padding: "16px",
                        marginBottom: "12px",
                        animationDelay: "0.2s",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            margin: "0 0 12px 0",
                        }}
                    >
                        Skill Trends
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                        }}
                    >
                        {statFields.map((field) => {
                            const recentLogs = [...logs].reverse().slice(-8);
                            const values = recentLogs.map((l) => l[field.key]);
                            const latest = values[values.length - 1] ?? 0;
                            const prev =
                                values.length > 1
                                    ? values[values.length - 2]
                                    : latest;
                            const trend = latest - prev;
                            return (
                                <div key={field.key}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "3px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            <field.icon
                                                size={11}
                                                color="var(--text-muted)"
                                                strokeWidth={2}
                                                style={{
                                                    display: "inline",
                                                    verticalAlign: "middle",
                                                    marginRight: "3px",
                                                }}
                                            />{" "}
                                            {field.label}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                color:
                                                    trend > 0
                                                        ? "var(--emerald)"
                                                        : trend < 0
                                                          ? "#f87171"
                                                          : "var(--text-muted)",
                                            }}
                                        >
                                            {latest}/10{" "}
                                            {trend > 0
                                                ? `↑${trend}`
                                                : trend < 0
                                                  ? `↓${Math.abs(trend)}`
                                                  : "→"}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "3px",
                                            alignItems: "flex-end",
                                            height: "28px",
                                        }}
                                    >
                                        {values.map((v, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    flex: 1,
                                                    height: `${(v / 10) * 100}%`,
                                                    minHeight: "3px",
                                                    background:
                                                        i === values.length - 1
                                                            ? field.color
                                                            : `${field.color}40`,
                                                    borderRadius: "2px",
                                                    transition: "height 0.3s",
                                                }}
                                                title={`W${recentLogs[i]?.weekNumber}: ${v}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        <p
                            style={{
                                fontSize: "9px",
                                color: "var(--text-muted)",
                                textAlign: "center",
                                margin: "4px 0 0",
                            }}
                        >
                            Last {Math.min(logs.length, 8)} weeks
                        </p>
                    </div>
                </div>
            )}

            {/* History */}
            {logs.length > 0 && (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{ padding: "18px", animationDelay: "0.2s" }}
                >
                    <h3
                        style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            margin: "0 0 12px 0",
                        }}
                    >
                        History
                    </h3>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                        }}
                    >
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="glass-card-hover"
                                style={{ padding: "14px" }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "10px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            color: "var(--cyan)",
                                        }}
                                    >
                                        W{log.weekNumber} · {log.year}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        {new Date(
                                            log.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    {statFields.map((field) => (
                                        <div
                                            key={field.key}
                                            style={{
                                                flex: 1,
                                                textAlign: "center",
                                                padding: "6px 0",
                                                background: "var(--bg-raised)",
                                                borderRadius: "8px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "15px",
                                                    fontWeight: 800,
                                                    color: field.color,
                                                }}
                                            >
                                                {log[field.key]}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "8px",
                                                    color: "var(--text-muted)",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {field.label.slice(0, 3)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {log.highlight && (
                                    <p
                                        style={{
                                            fontSize: "11px",
                                            color: "var(--text-secondary)",
                                            marginTop: "8px",
                                        }}
                                    >
                                        <Star
                                            size={11}
                                            color="var(--gold)"
                                            fill="var(--gold)"
                                            style={{
                                                display: "inline",
                                                verticalAlign: "middle",
                                                marginRight: "3px",
                                            }}
                                        />{" "}
                                        {log.highlight}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function getWeekNumber(date: Date): number {
    const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
