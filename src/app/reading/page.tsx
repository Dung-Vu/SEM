"use client";

import { useEffect, useState, useCallback } from "react";
import {
    BookOpen,
    FileText,
    Flag,
    Newspaper,
    BookMarked,
    GraduationCap,
    ClipboardList,
    Library,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ReadingSession {
    id: string;
    title: string;
    category: string;
    minutes: number;
    pages: number;
    notes: string;
    date: string;
}

const CATEGORY_CONFIG: Record<
    string,
    { icon: LucideIcon; color: string; bg: string }
> = {
    book: { icon: BookOpen, color: "var(--gold)", bg: "rgba(107,90,42,0.4)" },
    article: { icon: FileText, color: "var(--cyan)", bg: "rgba(10,48,64,0.5)" },
    manga: { icon: Flag, color: "var(--ruby)", bg: "rgba(48,10,10,0.5)" },
    news: { icon: Newspaper, color: "var(--emerald)", bg: "rgba(5,46,22,0.5)" },
    novel: {
        icon: BookMarked,
        color: "var(--violet)",
        bg: "rgba(30,10,60,0.5)",
    },
    textbook: {
        icon: GraduationCap,
        color: "var(--amber)",
        bg: "rgba(45,26,0,0.5)",
    },
    other: {
        icon: ClipboardList,
        color: "var(--text-muted)",
        bg: "var(--bg-raised)",
    },
};

export default function ReadingTrackerPage() {
    const [sessions, setSessions] = useState<ReadingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("book");
    const [minutes, setMinutes] = useState(15);
    const [pages, setPages] = useState(0);
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        try {
            const res = await fetch("/api/reading");
            const data = await res.json();
            setSessions(data.sessions ?? []);
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleSave = async () => {
        if (!title.trim()) {
            setToast("Enter a title");
            setTimeout(() => setToast(null), 3000);
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/reading", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    category,
                    minutes,
                    pages,
                    notes,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setToast(`Logged! +${data.expGain} EXP`);
                setTitle("");
                setNotes("");
                setPages(0);
                setMinutes(15);
                setShowForm(false);
                await fetchSessions();
            }
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast("Error saving");
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const todayMinutes = sessions
        .filter((s) => s.date === new Date().toISOString().slice(0, 10))
        .reduce((sum, s) => sum + s.minutes, 0);
    const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
    const totalPages = sessions.reduce((sum, s) => sum + s.pages, 0);
    const goalPct = Math.min(100, (todayMinutes / 30) * 100);
    const goalDone = todayMinutes >= 30;

    if (loading) {
        return (
            <div style={{ paddingTop: "8px" }}>
                <div
                    className="skeleton"
                    style={{ height: 100, borderRadius: 20, marginBottom: 12 }}
                />
                <div
                    className="skeleton"
                    style={{ height: 50, borderRadius: 14, marginBottom: 12 }}
                />
                <div
                    className="skeleton"
                    style={{ height: 180, borderRadius: 20 }}
                />
            </div>
        );
    }

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
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                }}
            >
                <div>
                    <h1
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "22px",
                            fontWeight: 800,
                            margin: "0 0 4px",
                        }}
                    >
                        Reading
                    </h1>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                            margin: 0,
                        }}
                    >
                        Track your reading progress
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: "10px 18px",
                        borderRadius: "12px",
                        border: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                        background: showForm
                            ? "var(--bg-raised)"
                            : "linear-gradient(135deg, var(--gold-muted), var(--gold))",
                        color: showForm ? "var(--text-muted)" : "#07080D",
                        fontFamily: "var(--font-display)",
                        fontSize: "13px",
                        fontWeight: 700,
                        transition: "all 0.2s",
                    }}
                >
                    {showForm ? "✕ Close" : "+ Log"}
                </button>
            </div>

            {/* ─── STATS ─── */}
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
                        value: todayMinutes,
                        label: "Today (min)",
                        color: "var(--cyan)",
                    },
                    {
                        value: totalMinutes,
                        label: "Total (min)",
                        color: "var(--emerald)",
                    },
                    { value: totalPages, label: "Pages", color: "var(--gold)" },
                    {
                        value: sessions.length,
                        label: "Sessions",
                        color: "var(--violet)",
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
                                fontSize: "18px",
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
                            }}
                        >
                            {item.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* ─── DAILY GOAL ─── */}
            <div
                className="glass-card animate-fade-in-up stagger-2"
                style={{ padding: "12px 14px", marginBottom: "12px" }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <span
                        style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Daily Goal
                    </span>
                    <div
                        style={{
                            flex: 1,
                            height: "8px",
                            background: "var(--bg-raised)",
                            borderRadius: 99,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: `${goalPct}%`,
                                height: "100%",
                                borderRadius: 99,
                                background: goalDone
                                    ? "linear-gradient(to right, var(--emerald-muted), var(--emerald))"
                                    : "linear-gradient(to right, var(--cyan-muted), var(--cyan))",
                                boxShadow: goalDone
                                    ? "0 0 8px rgba(52,211,153,0.4)"
                                    : "none",
                                transition: "width 0.6s ease-out",
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: goalDone
                                ? "var(--emerald)"
                                : "var(--text-muted)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {todayMinutes}/30m {goalDone ? "· Done" : ""}
                    </span>
                </div>
            </div>

            {/* ─── LOG FORM ─── */}
            {showForm && (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{
                        padding: "16px",
                        marginBottom: "12px",
                        borderColor: "rgba(245,200,66,0.15)",
                    }}
                >
                    <h3
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "14px",
                            fontWeight: 700,
                            margin: "0 0 14px",
                            color: "var(--gold)",
                        }}
                    >
                        Log Reading Session
                    </h3>

                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What did you read?"
                        style={{
                            width: "100%",
                            padding: "12px 14px",
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "12px",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            fontFamily: "var(--font-body)",
                            outline: "none",
                            marginBottom: "12px",
                        }}
                    />

                    <label
                        style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            display: "block",
                            marginBottom: "6px",
                            fontFamily: "var(--font-body)",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                        }}
                    >
                        Category
                    </label>
                    <div
                        style={{
                            display: "flex",
                            gap: "5px",
                            flexWrap: "wrap",
                            marginBottom: "12px",
                        }}
                    >
                        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                            <button
                                key={key}
                                onClick={() => setCategory(key)}
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: "99px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-body)",
                                    background:
                                        category === key
                                            ? cfg.bg
                                            : "var(--bg-raised)",
                                    color:
                                        category === key
                                            ? cfg.color
                                            : "var(--text-muted)",
                                    border: `1px solid ${category === key ? cfg.color + "40" : "transparent"}`,
                                    transition: "all 0.15s",
                                }}
                            >
                                <cfg.icon
                                    size={12}
                                    strokeWidth={2}
                                    style={{
                                        display: "inline",
                                        verticalAlign: "middle",
                                        marginRight: "4px",
                                    }}
                                />{" "}
                                {key}
                            </button>
                        ))}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "12px",
                        }}
                    >
                        {[
                            {
                                label: "Minutes",
                                value: minutes,
                                onChange: (v: number) => setMinutes(v),
                            },
                            {
                                label: "Pages",
                                value: pages,
                                onChange: (v: number) => setPages(v),
                            },
                        ].map((field) => (
                            <div key={field.label} style={{ flex: 1 }}>
                                <label
                                    style={{
                                        fontSize: "11px",
                                        color: "var(--text-muted)",
                                        display: "block",
                                        marginBottom: "6px",
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    {field.label}
                                </label>
                                <input
                                    type="number"
                                    value={field.value}
                                    onChange={(e) =>
                                        field.onChange(
                                            parseInt(e.target.value) || 0,
                                        )
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        background: "var(--bg-raised)",
                                        border: "1px solid var(--border-subtle)",
                                        borderRadius: "10px",
                                        color: "var(--text-primary)",
                                        fontSize: "16px",
                                        fontFamily: "var(--font-mono)",
                                        outline: "none",
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Key takeaways, new words..."
                        rows={2}
                        style={{
                            width: "100%",
                            padding: "10px",
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "10px",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            fontFamily: "var(--font-body)",
                            resize: "vertical",
                            outline: "none",
                            marginBottom: "14px",
                        }}
                    />

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary"
                    >
                        {saving ? "Saving..." : "Log Session (+EXP)"}
                    </button>
                </div>
            )}

            {/* ─── SESSION HISTORY ─── */}
            {sessions.length === 0 ? (
                <div
                    className="glass-card"
                    style={{ textAlign: "center", padding: "48px 16px" }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "16px",
                        }}
                    >
                        <Library
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
                        Start your reading journey
                    </h2>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        Log your first session above
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    {sessions.map((s: ReadingSession, i: number) => {
                        const cfg =
                            CATEGORY_CONFIG[s.category] ??
                            CATEGORY_CONFIG.other;
                        return (
                            <div
                                key={s.id}
                                className="glass-card animate-fade-in-up"
                                style={{
                                    padding: "12px 14px",
                                    animationDelay: `${i * 0.03}s`,
                                    borderLeft: `3px solid ${cfg.color}40`,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: "10px",
                                            background: cfg.bg,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "18px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <cfg.icon
                                            size={18}
                                            color={cfg.color}
                                            strokeWidth={2}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p
                                            style={{
                                                fontFamily:
                                                    "var(--font-display)",
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                margin: "0 0 2px",
                                                color: "var(--text-primary)",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {s.title}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "11px",
                                                color: "var(--text-muted)",
                                                margin: 0,
                                                fontFamily: "var(--font-body)",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "var(--font-mono)",
                                                }}
                                            >
                                                {s.date}
                                            </span>{" "}
                                            · {s.minutes}min
                                            {s.pages > 0
                                                ? ` · ${s.pages}p`
                                                : ""}
                                        </p>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: "10px",
                                            padding: "3px 8px",
                                            borderRadius: 99,
                                            background: cfg.bg,
                                            color: cfg.color,
                                            fontFamily: "var(--font-body)",
                                            fontWeight: 600,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {s.category}
                                    </span>
                                </div>
                                {s.notes && (
                                    <p
                                        style={{
                                            fontSize: "12px",
                                            color: "var(--text-secondary)",
                                            marginTop: "8px",
                                            marginBottom: 0,
                                            lineHeight: 1.5,
                                            fontFamily: "var(--font-body)",
                                        }}
                                    >
                                        {s.notes}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
