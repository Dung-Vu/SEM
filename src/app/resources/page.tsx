"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ClipboardList,
    Headphones,
    Youtube,
    Tv,
    BookMarked,
    Newspaper,
    Library,
    Link2,
    Inbox,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Resource {
    id: string;
    name: string;
    link: string;
    category: string;
    level: string;
    notes: string;
    status: string;
    expReward: number;
}

const CATEGORIES: { key: string; label: string; icon: LucideIcon }[] = [
    { key: "all", label: "All", icon: ClipboardList },
    { key: "podcast", label: "Podcast", icon: Headphones },
    { key: "youtube", label: "YouTube", icon: Youtube },
    { key: "series", label: "Series", icon: Tv },
    { key: "book", label: "Books", icon: BookMarked },
    { key: "article", label: "Articles", icon: Newspaper },
];

const STATUS_CFG: Record<
    string,
    { label: string; color: string; bg: string; icon: string }
> = {
    want: {
        label: "Want",
        color: "var(--text-muted)",
        bg: "transparent",
        icon: "",
    },
    in_progress: {
        label: "In Progress",
        color: "var(--amber)",
        bg: "rgba(45,26,0,0.4)",
        icon: "▶",
    },
    done: {
        label: "Done",
        color: "var(--emerald)",
        bg: "rgba(5,46,22,0.4)",
        icon: "✓",
    },
};

const LEVEL_COLORS: Record<string, string> = {
    A1: "var(--cyan)",
    A2: "var(--emerald)",
    B1: "var(--gold)",
    B2: "var(--violet)",
    C1: "var(--ruby)",
    C2: "var(--gold-bright)",
};

export default function ResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        done: 0,
        inProgress: 0,
        want: 0,
    });
    const [activeCategory, setActiveCategory] = useState("all");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState("podcast");
    const [newLevel, setNewLevel] = useState("B1");
    const [newLink, setNewLink] = useState("");

    const fetchResources = useCallback(async () => {
        try {
            const res = await fetch("/api/resources");
            if (!res.ok) throw new Error("API");
            const data = await res.json();
            setResources(data.resources ?? []);
            setStats(
                data.stats ?? { total: 0, done: 0, inProgress: 0, want: 0 },
            );
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch("/api/resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status, action: "update_status" }),
            });
            const data = await res.json();
            showToast(
                data.expGain
                    ? `Completed! +${data.expGain} EXP`
                    : `Updated to ${STATUS_CFG[status]?.label}`,
            );
            await fetchResources();
        } catch {
            showToast("Error");
        }
    };

    const addResource = async () => {
        if (!newName.trim()) return;
        try {
            await fetch("/api/resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    category: newCategory,
                    level: newLevel,
                    link: newLink,
                }),
            });
            showToast("Resource added!");
            setNewName("");
            setNewLink("");
            setShowAdd(false);
            await fetchResources();
        } catch {
            showToast("Error");
        }
    };

    const filtered =
        activeCategory === "all"
            ? resources
            : resources.filter((r) => r.category === activeCategory);
    const nextStatus = (s: string) =>
        s === "want" ? "in_progress" : s === "in_progress" ? "done" : "want";

    if (loading) {
        return (
            <div style={{ paddingTop: "8px" }}>
                <div
                    className="skeleton"
                    style={{ height: 80, borderRadius: 20, marginBottom: 10 }}
                />
                <div
                    className="skeleton"
                    style={{ height: 44, borderRadius: 14, marginBottom: 10 }}
                />
                <div
                    className="skeleton"
                    style={{ height: 300, borderRadius: 20 }}
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

            {/* Header */}
            <div
                className="animate-fade-in-up"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "14px",
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
                        Resources
                    </h1>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                            margin: 0,
                        }}
                    >
                        Your curated learning library
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    style={{
                        padding: "10px 16px",
                        borderRadius: "12px",
                        border: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                        background: showAdd
                            ? "var(--bg-raised)"
                            : "linear-gradient(135deg, var(--emerald-muted), var(--emerald))",
                        color: showAdd ? "var(--text-muted)" : "#07080D",
                        fontFamily: "var(--font-display)",
                        fontSize: "13px",
                        fontWeight: 700,
                        transition: "all 0.2s",
                    }}
                >
                    {showAdd ? "✕" : "+ Add"}
                </button>
            </div>

            {/* Stats */}
            <div
                className="animate-fade-in-up stagger-1"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "6px",
                    marginBottom: "12px",
                }}
            >
                {[
                    {
                        value: stats.done,
                        label: "Done",
                        color: "var(--emerald)",
                    },
                    {
                        value: stats.inProgress,
                        label: "In Progress",
                        color: "var(--amber)",
                    },
                    {
                        value: stats.want,
                        label: "Want",
                        color: "var(--text-muted)",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="glass-card"
                        style={{ padding: "10px", textAlign: "center" }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "20px",
                                fontWeight: 600,
                                color: s.color,
                                margin: "0 0 2px",
                            }}
                        >
                            {s.value}
                        </p>
                        <p
                            style={{
                                fontSize: "9px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                                margin: 0,
                            }}
                        >
                            {s.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Add Form */}
            {showAdd && (
                <div
                    className="glass-card animate-scale-in"
                    style={{
                        padding: "14px",
                        marginBottom: "12px",
                        borderColor: "rgba(52,211,153,0.15)",
                    }}
                >
                    <h3
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "14px",
                            fontWeight: 700,
                            margin: "0 0 12px",
                            color: "var(--emerald)",
                        }}
                    >
                        + Add Resource
                    </h3>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Resource name..."
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "10px",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            fontFamily: "var(--font-body)",
                            outline: "none",
                            marginBottom: "8px",
                        }}
                    />
                    <input
                        type="text"
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        placeholder="Link (optional)"
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "10px",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            fontFamily: "var(--font-body)",
                            outline: "none",
                            marginBottom: "8px",
                        }}
                    />
                    <div
                        style={{
                            display: "flex",
                            gap: "5px",
                            flexWrap: "wrap",
                            marginBottom: "8px",
                        }}
                    >
                        {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                            <button
                                key={c.key}
                                onClick={() => setNewCategory(c.key)}
                                style={{
                                    fontSize: "11px",
                                    padding: "5px 10px",
                                    borderRadius: "99px",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-body)",
                                    background:
                                        newCategory === c.key
                                            ? "rgba(5,46,22,0.5)"
                                            : "var(--bg-raised)",
                                    color:
                                        newCategory === c.key
                                            ? "var(--emerald)"
                                            : "var(--text-muted)",
                                    border: `1px solid ${newCategory === c.key ? "rgba(52,211,153,0.3)" : "transparent"}`,
                                }}
                            >
                                <c.icon
                                    size={12}
                                    strokeWidth={2}
                                    style={{
                                        display: "inline",
                                        verticalAlign: "middle",
                                        marginRight: "4px",
                                    }}
                                />{" "}
                                {c.label}
                            </button>
                        ))}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: "4px",
                            marginBottom: "12px",
                        }}
                    >
                        {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                            <button
                                key={l}
                                onClick={() => setNewLevel(l)}
                                style={{
                                    flex: 1,
                                    padding: "6px 2px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    fontFamily: "var(--font-mono)",
                                    background:
                                        newLevel === l
                                            ? "rgba(107,90,42,0.5)"
                                            : "var(--bg-raised)",
                                    color:
                                        newLevel === l
                                            ? (LEVEL_COLORS[l] ?? "var(--gold)")
                                            : "var(--text-muted)",
                                    border: `1px solid ${newLevel === l ? "rgba(245,200,66,0.3)" : "transparent"}`,
                                }}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    <button onClick={addResource} className="btn-primary">
                        Add Resource
                    </button>
                </div>
            )}

            {/* Category tabs */}
            <div
                className="animate-fade-in-up stagger-2"
                style={{
                    display: "flex",
                    gap: "5px",
                    marginBottom: "12px",
                    overflowX: "auto",
                }}
            >
                {CATEGORIES.map((c) => (
                    <button
                        key={c.key}
                        onClick={() => setActiveCategory(c.key)}
                        style={{
                            fontSize: "11px",
                            padding: "7px 13px",
                            borderRadius: "99px",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontFamily: "var(--font-body)",
                            background:
                                activeCategory === c.key
                                    ? "rgba(107,90,42,0.5)"
                                    : "var(--bg-raised)",
                            color:
                                activeCategory === c.key
                                    ? "var(--gold)"
                                    : "var(--text-muted)",
                            border: `1px solid ${activeCategory === c.key ? "rgba(245,200,66,0.25)" : "transparent"}`,
                            transition: "all 0.15s",
                        }}
                    >
                        <c.icon
                            size={12}
                            strokeWidth={2}
                            style={{
                                display: "inline",
                                verticalAlign: "middle",
                                marginRight: "4px",
                            }}
                        />{" "}
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Resource List */}
            {filtered.length === 0 ? (
                <div
                    className="glass-card"
                    style={{ padding: "32px", textAlign: "center" }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        <Inbox
                            size={36}
                            color="var(--text-muted)"
                            strokeWidth={1.5}
                        />
                    </div>
                    <p
                        style={{
                            fontSize: "14px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        No resources here yet
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                    }}
                >
                    {filtered.map((r, i) => {
                        const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.want;
                        const lvlColor =
                            LEVEL_COLORS[r.level] ?? "var(--text-muted)";
                        return (
                            <div
                                key={r.id}
                                className="glass-card animate-fade-in-up"
                                style={{
                                    padding: "12px 14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    opacity: r.status === "done" ? 0.55 : 1,
                                    animationDelay: `${i * 0.02}s`,
                                }}
                            >
                                <button
                                    onClick={() =>
                                        updateStatus(r.id, nextStatus(r.status))
                                    }
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: "8px",
                                        flexShrink: 0,
                                        cursor: "pointer",
                                        border: `2px solid ${cfg.color}`,
                                        background: cfg.bg,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: cfg.color,
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {cfg.icon}
                                </button>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            marginBottom: r.notes ? "2px" : 0,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                fontFamily: "var(--font-body)",
                                                color:
                                                    r.status === "done"
                                                        ? "var(--text-muted)"
                                                        : "var(--text-primary)",
                                                textDecoration:
                                                    r.status === "done"
                                                        ? "line-through"
                                                        : "none",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {r.name}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "9px",
                                                padding: "2px 6px",
                                                borderRadius: 99,
                                                background: `${lvlColor}18`,
                                                color: lvlColor,
                                                fontWeight: 700,
                                                fontFamily: "var(--font-mono)",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {r.level}
                                        </span>
                                    </div>
                                    {r.notes && (
                                        <p
                                            style={{
                                                fontSize: "11px",
                                                color: "var(--text-muted)",
                                                margin: 0,
                                                fontFamily: "var(--font-body)",
                                            }}
                                        >
                                            {r.notes}
                                        </p>
                                    )}
                                </div>
                                <div
                                    style={{
                                        textAlign: "right",
                                        flexShrink: 0,
                                    }}
                                >
                                    {r.link && (
                                        <a
                                            href={r.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                fontSize: "14px",
                                                display: "block",
                                                marginBottom: "2px",
                                            }}
                                        >
                                            <Link2
                                                size={14}
                                                color="var(--cyan)"
                                                strokeWidth={2}
                                            />
                                        </a>
                                    )}
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "10px",
                                            fontWeight: 700,
                                            color: "var(--gold)",
                                        }}
                                    >
                                        +{r.expReward}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
