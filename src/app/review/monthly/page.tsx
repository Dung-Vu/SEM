"use client";

import { useEffect, useState, useCallback } from "react";
import {
    CalendarDays,
    Search,
    Construction,
    Target,
    PenLine,
    Library,
    BarChart3,
} from "lucide-react";

interface MonthlyReviewData {
    id: string;
    month: number;
    year: number;
    lookback: string;
    obstacles: string;
    focus: string;
    totalExp: number;
    createdAt: string;
}

const MONTH_NAMES = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

export default function MonthlyReviewPage() {
    const [reviews, setReviews] = useState<MonthlyReviewData[]>([]);
    const [hasThisMonth, setHasThisMonth] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(0);
    const [currentYear, setCurrentYear] = useState(0);
    const [lookback, setLookback] = useState("");
    const [obstacles, setObstacles] = useState("");
    const [focus, setFocus] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await fetch("/api/monthly-review");
            if (!res.ok) throw new Error("API");
            const data = await res.json();
            setReviews(data.reviews ?? []);
            setHasThisMonth(data.hasThisMonth);
            setCurrentMonth(data.currentMonth);
            setCurrentYear(data.currentYear);
            // Load existing review for current month
            const existing = data.reviews?.find(
                (r: MonthlyReviewData) =>
                    r.month === data.currentMonth &&
                    r.year === data.currentYear,
            );
            if (existing) {
                setLookback(existing.lookback);
                setObstacles(existing.obstacles);
                setFocus(existing.focus);
            }
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmit = async () => {
        if (!lookback.trim() && !obstacles.trim() && !focus.trim()) {
            setToast("Write at least one field");
            setTimeout(() => setToast(null), 3000);
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/monthly-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lookback, obstacles, focus }),
            });
            const data = await res.json();
            if (data.success) {
                setToast(`Saved! +${data.expGain} EXP`);
                await fetchReviews();
            }
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast("Error");
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

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
                        <CalendarDays
                            size={40}
                            color="var(--amber)"
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
                        Loading...
                    </p>
                </div>
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
                style={{ marginBottom: "12px" }}
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
                    <CalendarDays
                        size={20}
                        color="var(--amber)"
                        strokeWidth={2}
                        style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: "6px",
                        }}
                    />
                    <span className="gradient-text">Monthly Review</span>
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        marginTop: "4px",
                    }}
                >
                    {MONTH_NAMES[currentMonth]} {currentYear} ·{" "}
                    {hasThisMonth ? "Completed" : "Write your review"}
                </p>
            </div>

            {/* Form */}
            <div
                className="glass-card animate-fade-in-up"
                style={{
                    padding: "16px",
                    marginBottom: "12px",
                    animationDelay: "0.05s",
                }}
            >
                <div style={{ marginBottom: "14px" }}>
                    <label
                        style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--cyan)",
                            display: "block",
                            marginBottom: "6px",
                        }}
                    >
                        Nhìn lại tháng này
                    </label>
                    <textarea
                        value={lookback}
                        onChange={(e) => setLookback(e.target.value)}
                        placeholder="Tháng này bạn đã làm được gì? Điều gì khiến bạn tự hào nhất?"
                        style={{
                            width: "100%",
                            minHeight: "80px",
                            padding: "10px",
                            background: "var(--bg-raised)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "8px",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            lineHeight: "1.5",
                            resize: "vertical",
                            fontFamily: "var(--font-body)",
                        }}
                    />
                </div>

                <div style={{ marginBottom: "14px" }}>
                    <label
                        style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--amber)",
                            display: "block",
                            marginBottom: "6px",
                        }}
                    >
                        Cản trở & khó khăn
                    </label>
                    <textarea
                        value={obstacles}
                        onChange={(e) => setObstacles(e.target.value)}
                        placeholder="Điều gì cản trở bạn? Bạn đã bỏ lỡ gì? Lý do?"
                        style={{
                            width: "100%",
                            minHeight: "80px",
                            padding: "10px",
                            background: "var(--bg-raised)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "8px",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            lineHeight: "1.5",
                            resize: "vertical",
                            fontFamily: "var(--font-body)",
                        }}
                    />
                </div>

                <div style={{ marginBottom: "14px" }}>
                    <label
                        style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--emerald)",
                            display: "block",
                            marginBottom: "6px",
                        }}
                    >
                        Focus tháng tới
                    </label>
                    <textarea
                        value={focus}
                        onChange={(e) => setFocus(e.target.value)}
                        placeholder="Tháng tới bạn sẽ focus vào gì? Skill nào cần cải thiện?"
                        style={{
                            width: "100%",
                            minHeight: "80px",
                            padding: "10px",
                            background: "var(--bg-raised)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "8px",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            lineHeight: "1.5",
                            resize: "vertical",
                            fontFamily: "var(--font-body)",
                        }}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="btn-primary"
                    style={{ width: "100%", fontSize: "15px" }}
                >
                    {saving
                        ? "Saving..."
                        : hasThisMonth
                          ? "Update Review"
                          : "Submit Review (+100 EXP)"}
                </button>
            </div>

            {/* History */}
            {reviews.length > 0 && (
                <div
                    className="animate-fade-in-up"
                    style={{ animationDelay: "0.1s" }}
                >
                    <h3
                        style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            marginBottom: "8px",
                        }}
                    >
                        Past Reviews
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                        }}
                    >
                        {reviews.map((r) => (
                            <div
                                key={r.id}
                                className="glass-card"
                                style={{ padding: "14px" }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "8px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            color: "var(--cyan)",
                                        }}
                                    >
                                        {MONTH_NAMES[r.month]} {r.year}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        {r.totalExp} EXP at time
                                    </span>
                                </div>
                                {r.lookback && (
                                    <div style={{ marginBottom: "6px" }}>
                                        <p
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                color: "var(--cyan)",
                                            }}
                                        >
                                            Lookback
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                color: "var(--text-secondary)",
                                                lineHeight: "1.4",
                                            }}
                                        >
                                            {r.lookback}
                                        </p>
                                    </div>
                                )}
                                {r.obstacles && (
                                    <div style={{ marginBottom: "6px" }}>
                                        <p
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                color: "var(--amber)",
                                            }}
                                        >
                                            Obstacles
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                color: "var(--text-secondary)",
                                                lineHeight: "1.4",
                                            }}
                                        >
                                            {r.obstacles}
                                        </p>
                                    </div>
                                )}
                                {r.focus && (
                                    <div>
                                        <p
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                color: "var(--emerald)",
                                            }}
                                        >
                                            Focus
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                color: "var(--text-secondary)",
                                                lineHeight: "1.4",
                                            }}
                                        >
                                            {r.focus}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Monthly EXP Comparison */}
            {reviews.length >= 2 && (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{
                        padding: "16px",
                        marginTop: "12px",
                        animationDelay: "0.15s",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            margin: "0 0 12px 0",
                        }}
                    >
                        Monthly EXP Comparison
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                        }}
                    >
                        {[...reviews].reverse().map((r, i, arr) => {
                            const maxExp = Math.max(
                                ...arr.map((x) => x.totalExp || 1),
                            );
                            const pct = ((r.totalExp || 0) / maxExp) * 100;
                            const prev = i > 0 ? arr[i - 1]?.totalExp || 0 : 0;
                            const growth =
                                prev > 0
                                    ? Math.round(
                                          ((r.totalExp - prev) / prev) * 100,
                                      )
                                    : 0;
                            const isCurrent =
                                r.month === currentMonth &&
                                r.year === currentYear;
                            return (
                                <div
                                    key={r.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: isCurrent ? 800 : 600,
                                            color: isCurrent
                                                ? "var(--cyan)"
                                                : "var(--text-muted)",
                                            minWidth: "45px",
                                        }}
                                    >
                                        {MONTH_NAMES[r.month]}
                                    </span>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: "14px",
                                            background: "var(--bg-raised)",
                                            borderRadius: "7px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${pct}%`,
                                                height: "100%",
                                                background: isCurrent
                                                    ? "linear-gradient(90deg, var(--cyan), #818cf8)"
                                                    : "rgba(129,140,248,0.3)",
                                                borderRadius: "7px",
                                                transition: "width 0.5s",
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "var(--text-secondary)",
                                            minWidth: "50px",
                                            textAlign: "right",
                                        }}
                                    >
                                        {r.totalExp.toLocaleString()}
                                    </span>
                                    {i > 0 && growth !== 0 && (
                                        <span
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                color:
                                                    growth > 0
                                                        ? "var(--emerald)"
                                                        : "var(--ruby)",
                                                minWidth: "40px",
                                            }}
                                        >
                                            {growth > 0 ? "+" : ""}
                                            {growth}%
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
