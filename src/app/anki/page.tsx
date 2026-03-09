"use client";

import { useEffect, useState, useCallback } from "react";
import { getRatingLabel } from "@/lib/srs";
import { speak, stopSpeech } from "@/lib/tts";
import {
    BookOpen,
    Volume2,
    PauseCircle,
    Eye,
    Home,
    Plus,
    RotateCcw,
    PartyPopper,
    Sparkles,
    Clock,
} from "lucide-react";

interface ReviewCard {
    id: string;
    wordId: string;
    english: string;
    vietnamese: string;
    definition: string;
    exampleSentence: string;
    level: string;
    tags: string;
    status: string;
    intervalDays: number;
    reviewsCount: number;
}

interface Counts {
    due: number;
    new: number;
    totalNew: number;
    totalLearning: number;
    totalReview: number;
    totalMastered: number;
    total: number;
}

interface Forecast {
    tomorrow: number;
    thisWeek: number;
}

const LEVEL_COLORS: Record<
    string,
    { color: string; bg: string; border: string }
> = {
    A1: {
        color: "var(--cyan)",
        bg: "var(--cyan-dim)",
        border: "rgba(34,211,238,0.5)",
    },
    A2: {
        color: "var(--emerald)",
        bg: "var(--emerald-dim)",
        border: "rgba(52,211,153,0.5)",
    },
    B1: {
        color: "var(--gold)",
        bg: "var(--gold-dim)",
        border: "rgba(245,200,66,0.5)",
    },
    B2: {
        color: "var(--violet)",
        bg: "var(--violet-dim)",
        border: "rgba(167,139,250,0.5)",
    },
    C1: {
        color: "var(--ruby)",
        bg: "var(--ruby-dim)",
        border: "rgba(248,113,113,0.5)",
    },
    C2: {
        color: "var(--gold-bright)",
        bg: "var(--gold-dim)",
        border: "rgba(255,224,102,0.5)",
    },
};

export default function AnkiPage() {
    const [cards, setCards] = useState<ReviewCard[]>([]);
    const [counts, setCounts] = useState<Counts | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionDone, setSessionDone] = useState(false);
    const [sessionExp, setSessionExp] = useState(0);
    const [reviewed, setReviewed] = useState(0);
    const [toast, setToast] = useState<{ msg: string; color: string } | null>(
        null,
    );
    const [forecast, setForecast] = useState<Forecast | null>(null);
    const [animatingRating, setAnimatingRating] = useState<number | null>(null);
    const [speaking, setSpeaking] = useState(false);
    const [expParticles, setExpParticles] = useState<
        Array<{ id: number; x: number; y: number; amount: number }>
    >([]);

    const triggerExpParticle = (amount: number, x: number, y: number) => {
        const id = Date.now();
        setExpParticles((prev) => [...prev, { id, x, y, amount }]);
        setTimeout(
            () => setExpParticles((prev) => prev.filter((p) => p.id !== id)),
            1300,
        );
    };

    const fetchCards = useCallback(async () => {
        try {
            // Read user's daily new card limit from settings (saved to localStorage)
            const storedSettings =
                typeof window !== "undefined"
                    ? JSON.parse(localStorage.getItem("eq-settings") ?? "{}")
                    : {};
            const dailyLimit = storedSettings.ankiNewCardsPerDay ?? 15;
            const res = await fetch(`/api/anki/review?limit=${dailyLimit}`);
            const data = await res.json();
            setCards(data.cards || []);
            setCounts(data.counts);
            if (data.forecast) setForecast(data.forecast);
            if ((data.cards || []).length === 0) setSessionDone(true);
        } catch {
            console.error("Failed to fetch cards");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    const handleRating = async (rating: number) => {
        const card = cards[currentIndex];
        if (!card) return;
        setAnimatingRating(rating);

        try {
            const res = await fetch("/api/anki/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardId: card.id, rating }),
            });
            const data = await res.json();
            if (data.success) {
                setSessionExp((prev) => prev + data.expGain);
                setReviewed((prev) => prev + 1);
                const label = getRatingLabel(rating);
                const ratingColors = [
                    "",
                    "var(--ruby)",
                    "var(--amber)",
                    "var(--emerald)",
                    "var(--cyan)",
                ];
                setToast({
                    msg: `${label.emoji} ${label.label} · +${data.expGain} EXP`,
                    color: ratingColors[rating],
                });
                setTimeout(() => setToast(null), 2000);

                // EXP fly-up particle — center of screen
                triggerExpParticle(
                    data.expGain,
                    window.innerWidth / 2,
                    window.innerHeight * 0.55,
                );

                // Trigger milestone check (fire-and-forget)
                fetch("/api/milestones", { method: "POST" }).catch(() => {});

                setTimeout(() => {
                    setAnimatingRating(null);
                    if (currentIndex + 1 >= cards.length) {
                        setSessionDone(true);
                    } else {
                        setCurrentIndex((prev) => prev + 1);
                        setShowAnswer(false);
                        setIsFlipped(false);
                    }
                }, 350);
            }
        } catch {
            setToast({ msg: "Error submitting review", color: "var(--ruby)" });
            setTimeout(() => setToast(null), 3000);
            setAnimatingRating(null);
        }
    };

    // ─── Loading ───
    if (loading) {
        return (
            <div style={{ paddingTop: "8px" }}>
                <div
                    className="skeleton"
                    style={{
                        height: 32,
                        width: "60%",
                        borderRadius: 8,
                        marginBottom: 16,
                    }}
                />
                <div
                    className="skeleton"
                    style={{ height: 8, borderRadius: 99, marginBottom: 20 }}
                />
                <div
                    className="skeleton"
                    style={{ height: 280, borderRadius: 16, marginBottom: 16 }}
                />
                <div
                    className="skeleton"
                    style={{ height: 52, borderRadius: 14 }}
                />
            </div>
        );
    }

    // ─── Session Complete ───
    if (sessionDone) {
        const hasDeckCards = counts && counts.total > 0;
        const dailyDone = hasDeckCards && reviewed === 0;

        return (
            <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
                <div
                    className="animate-fade-in-up"
                    style={{ textAlign: "center", paddingTop: "32px" }}
                >
                    {dailyDone ? (
                        <Clock
                            size={48}
                            color="var(--text-muted)"
                            strokeWidth={1.5}
                        />
                    ) : reviewed > 0 ? (
                        <PartyPopper
                            size={48}
                            color="var(--gold)"
                            strokeWidth={1.5}
                        />
                    ) : (
                        <Sparkles
                            size={48}
                            color="var(--cyan)"
                            strokeWidth={1.5}
                        />
                    )}
                    <h1
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "24px",
                            fontWeight: 800,
                            marginBottom: "6px",
                        }}
                    >
                        <span className="gradient-text">
                            {dailyDone
                                ? "Daily Limit Reached"
                                : "Session Complete!"}
                        </span>
                    </h1>
                    <p
                        style={{
                            fontSize: "14px",
                            color: "var(--text-secondary)",
                            marginBottom: "28px",
                            fontFamily: "var(--font-body)",
                            lineHeight: 1.6,
                        }}
                    >
                        {reviewed > 0
                            ? `You reviewed ${reviewed} cards today`
                            : dailyDone
                              ? `Bạn đã học 15 thẻ hôm nay. Deck còn ${counts?.totalNew ?? 0} thẻ mới — quay lại ngày mai!`
                              : "Thêm từ vựng để bắt đầu ôn tập!"}
                    </p>
                </div>

                {reviewed > 0 && (
                    <div
                        className="glass-card animate-fade-in-up stagger-1"
                        style={{
                            padding: "24px",
                            marginBottom: "12px",
                            textAlign: "center",
                        }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "48px",
                                fontWeight: 600,
                                color: "var(--gold)",
                                margin: "0 0 4px",
                            }}
                        >
                            +{sessionExp.toLocaleString()}
                        </p>
                        <p
                            style={{
                                fontSize: "13px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                                letterSpacing: "0.08em",
                                fontWeight: 700,
                            }}
                        >
                            EXP EARNED
                        </p>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: "6px",
                                marginTop: "16px",
                                flexWrap: "wrap",
                            }}
                        >
                            <Pill
                                label="Reviewed"
                                value={reviewed}
                                color="var(--cyan)"
                            />
                        </div>
                    </div>
                )}

                {counts && (
                    <div
                        className="glass-card animate-fade-in-up stagger-2"
                        style={{ padding: "16px", marginBottom: "12px" }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                color: "var(--text-muted)",
                                marginBottom: "12px",
                            }}
                        >
                            YOUR DECK
                        </p>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                                gap: "8px",
                            }}
                        >
                            <StatBox
                                label="New"
                                value={counts.totalNew}
                                color="var(--cyan)"
                            />
                            <StatBox
                                label="Learn"
                                value={counts.totalLearning}
                                color="var(--amber)"
                            />
                            <StatBox
                                label="Review"
                                value={counts.totalReview}
                                color="var(--emerald)"
                            />
                            <StatBox
                                label="Master"
                                value={counts.totalMastered}
                                color="var(--gold)"
                            />
                        </div>
                    </div>
                )}

                {forecast && (
                    <div
                        className="glass-card animate-fade-in-up stagger-3"
                        style={{ padding: "16px", marginBottom: "20px" }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "12px",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                color: "var(--text-muted)",
                                marginBottom: "12px",
                            }}
                        >
                            UPCOMING
                        </p>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-around",
                            }}
                        >
                            <div style={{ textAlign: "center" }}>
                                <p
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "26px",
                                        fontWeight: 600,
                                        color: "var(--violet)",
                                        margin: 0,
                                    }}
                                >
                                    {forecast.tomorrow}
                                </p>
                                <p
                                    style={{
                                        fontSize: "11px",
                                        color: "var(--text-muted)",
                                        marginTop: "2px",
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    Tomorrow
                                </p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "26px",
                                        fontWeight: 600,
                                        color: "var(--amber)",
                                        margin: 0,
                                    }}
                                >
                                    {forecast.thisWeek}
                                </p>
                                <p
                                    style={{
                                        fontSize: "11px",
                                        color: "var(--text-muted)",
                                        marginTop: "2px",
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    This Week
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                    <a
                        href="/"
                        className="btn-secondary"
                        style={{
                            flex: 1,
                            textDecoration: "none",
                            textAlign: "center",
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        Home
                    </a>
                    <a
                        href="/anki/add"
                        className="btn-primary"
                        style={{
                            flex: 1,
                            textDecoration: "none",
                            textAlign: "center",
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        Add Words
                    </a>
                </div>
            </div>
        );
    }

    const card = cards[currentIndex];
    const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;
    const blankExample = card.exampleSentence.replace(
        new RegExp(card.english, "gi"),
        "______",
    );
    const ratingButtons = [1, 2, 3, 4].map((r) => getRatingLabel(r));
    const levelStyle = LEVEL_COLORS[card.level] ?? LEVEL_COLORS.A1;

    const ratingConfig = [
        {
            label: "Again",
            interval: "1d",
            bg: "var(--ruby-dim)",
            border: "var(--ruby-muted)",
            color: "var(--ruby)",
        },
        {
            label: "Hard",
            interval: "3d",
            bg: "var(--amber-dim)",
            border: "var(--amber-muted)",
            color: "var(--amber)",
        },
        {
            label: "Good",
            interval: "7d",
            bg: "var(--emerald-dim)",
            border: "var(--emerald-muted)",
            color: "var(--emerald)",
        },
        {
            label: "Easy",
            interval: "14d",
            bg: "var(--cyan-dim)",
            border: "var(--cyan-muted)",
            color: "var(--cyan)",
        },
    ];

    return (
        <div
            style={{
                paddingTop: "8px",
                paddingBottom: "16px",
                display: "flex",
                flexDirection: "column",
                minHeight: "calc(100dvh - 100px)",
            }}
        >
            {/* Toast */}
            {toast && (
                <div className="toast animate-scale-in">
                    <div
                        className="glass-card"
                        style={{
                            padding: "12px 16px",
                            borderColor: `${toast.color}50`,
                        }}
                    >
                        <p
                            style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                textAlign: "center",
                                color: toast.color,
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            {toast.msg}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <BookOpen size={20} color="var(--cyan)" />
                    <h1
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "18px",
                            fontWeight: 800,
                            margin: 0,
                            color: "var(--text-primary)",
                        }}
                    >
                        Anki Review
                    </h1>
                </div>
                <span
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                    }}
                >
                    {currentIndex + 1} / {cards.length}
                </span>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: "16px" }}>
                <div
                    className="exp-bar-container"
                    style={{ height: 4, border: "none" }}
                >
                    <div
                        className="exp-bar-fill"
                        style={{ width: `${progress}%`, boxShadow: "none" }}
                    />
                </div>
            </div>

            {/* EXP Particles */}
            {expParticles.map((p) => (
                <div
                    key={p.id}
                    className="exp-particle"
                    style={{ left: p.x, top: p.y }}
                >
                    +{p.amount} EXP ✨
                </div>
            ))}

            {/* Card — 3D Flip */}
            <div
                className="anki-card-scene"
                style={{
                    opacity: animatingRating ? 0.6 : 1,
                    transition: "opacity 0.25s",
                }}
            >
                <div
                    className={`anki-card-inner${isFlipped ? " is-flipped" : ""}`}
                >
                    {/* FRONT */}
                    <div
                        className="anki-card-face glass-card"
                        style={{
                            borderLeft: `4px solid ${levelStyle.border}`,
                            overflow: "hidden",
                        }}
                    >
                        {/* Glow */}
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 60,
                                background: `linear-gradient(to right, ${levelStyle.border}20, transparent)`,
                                pointerEvents: "none",
                            }}
                        />

                        {/* Badges */}
                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                marginBottom: "20px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    padding: "3px 10px",
                                    borderRadius: "99px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    background:
                                        card.status === "new"
                                            ? "rgba(34,211,238,0.12)"
                                            : "rgba(52,211,153,0.12)",
                                    color:
                                        card.status === "new"
                                            ? "var(--cyan)"
                                            : "var(--emerald)",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                {card.status}
                            </span>
                            <span
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    padding: "3px 10px",
                                    borderRadius: "99px",
                                    textTransform: "uppercase",
                                    background: levelStyle.bg,
                                    color: levelStyle.color,
                                    border: `1px solid ${levelStyle.border}`,
                                    fontFamily: "var(--font-body)",
                                    letterSpacing: "0.04em",
                                }}
                            >
                                {card.level}
                            </span>
                        </div>

                        {/* Word + TTS */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "14px",
                            }}
                        >
                            <h2
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "34px",
                                    fontWeight: 800,
                                    margin: 0,
                                    color: "var(--text-primary)",
                                }}
                            >
                                {card.english}
                            </h2>
                            <button
                                onClick={() => {
                                    if (speaking) {
                                        stopSpeech();
                                        setSpeaking(false);
                                        return;
                                    }
                                    setSpeaking(true);
                                    speak(card.english, { rate: 0.85 });
                                    setTimeout(() => setSpeaking(false), 3000);
                                }}
                                style={{
                                    background: speaking
                                        ? "rgba(34,211,238,0.15)"
                                        : "var(--bg-raised)",
                                    border: `1px solid ${speaking ? "var(--cyan)" : "var(--border-subtle)"}`,
                                    borderRadius: "50%",
                                    width: 36,
                                    height: 36,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                    transition: "all 0.2s var(--ease-spring)",
                                }}
                            >
                                {speaking ? (
                                    <PauseCircle
                                        size={18}
                                        color="var(--cyan)"
                                    />
                                ) : (
                                    <Volume2
                                        size={18}
                                        color="var(--text-muted)"
                                    />
                                )}
                            </button>
                        </div>

                        {/* Phonetic Badge */}
                        <div style={{ marginBottom: "14px" }}>
                            <span className="phonetic-badge">
                                {card.level} ·{" "}
                                {card.status === "new"
                                    ? "New"
                                    : `${card.intervalDays}d`}
                            </span>
                        </div>

                        {/* Blank Example */}
                        <p
                            style={{
                                fontSize: "15px",
                                color: "var(--text-secondary)",
                                fontStyle: "italic",
                                margin: "0 0 8px",
                                lineHeight: 1.6,
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            {blankExample}
                        </p>

                        <p
                            style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                                margin: 0,
                                opacity: 0.7,
                            }}
                        >
                            Tap &quot;Show Answer&quot; to reveal
                        </p>
                    </div>

                    {/* BACK */}
                    <div
                        className="anki-card-face back glass-card"
                        style={{
                            borderLeft: `4px solid ${levelStyle.border}`,
                            overflow: "hidden",
                            justifyContent: "flex-start",
                            paddingTop: "28px",
                        }}
                    >
                        {/* Badges */}
                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                marginBottom: "20px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    padding: "3px 10px",
                                    borderRadius: "99px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    background: "rgba(245,200,66,0.12)",
                                    color: "var(--gold)",
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                {card.english}
                            </span>
                            <span
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    padding: "3px 10px",
                                    borderRadius: "99px",
                                    textTransform: "uppercase",
                                    background: levelStyle.bg,
                                    color: levelStyle.color,
                                    border: `1px solid ${levelStyle.border}`,
                                    fontFamily: "var(--font-body)",
                                    letterSpacing: "0.04em",
                                }}
                            >
                                {card.level}
                            </span>
                        </div>

                        {/* Vietnamese + Definition */}
                        <p
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "28px",
                                fontWeight: 700,
                                color: "var(--gold)",
                                margin: "0 0 8px",
                            }}
                        >
                            {card.vietnamese}
                        </p>
                        <p
                            style={{
                                fontSize: "13px",
                                color: "var(--text-secondary)",
                                margin: "0 0 14px",
                                lineHeight: 1.5,
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            {card.definition}
                        </p>

                        {/* Example Sentence */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px",
                                width: "100%",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "13px",
                                    color: "var(--text-primary)",
                                    fontStyle: "italic",
                                    margin: 0,
                                    lineHeight: 1.5,
                                    fontFamily: "var(--font-body)",
                                    flex: 1,
                                    textAlign: "left",
                                }}
                            >
                                &ldquo;{card.exampleSentence}&rdquo;
                            </p>
                            <button
                                onClick={() =>
                                    speak(card.exampleSentence, { rate: 0.8 })
                                }
                                style={{
                                    background: "var(--bg-raised)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: "50%",
                                    width: 28,
                                    height: 28,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                }}
                            >
                                <Volume2 size={14} color="var(--text-muted)" />
                            </button>
                        </div>

                        {/* Tags */}
                        {card.tags && (
                            <div
                                style={{
                                    marginTop: "12px",
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: "4px",
                                    flexWrap: "wrap",
                                }}
                            >
                                {card.tags.split(",").map((tag) => (
                                    <span
                                        key={tag}
                                        style={{
                                            fontSize: "10px",
                                            padding: "2px 8px",
                                            borderRadius: "99px",
                                            background: "var(--bg-raised)",
                                            color: "var(--text-muted)",
                                            fontFamily: "var(--font-body)",
                                        }}
                                    >
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: "auto" }}>
                {!showAnswer ? (
                    <button
                        onClick={() => {
                            setShowAnswer(true);
                            setIsFlipped(true);
                            try {
                                const s = JSON.parse(
                                    localStorage.getItem("eq-settings") || "{}",
                                );
                                if (s.autoPlayAnki) {
                                    speak(card.english, {
                                        rate: s.ttsRate ?? 0.85,
                                    });
                                }
                            } catch {
                                /* ignore */
                            }
                        }}
                        style={{
                            width: "100%",
                            minHeight: 54,
                            borderRadius: 14,
                            background:
                                "linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))",
                            color: "var(--cyan)",
                            fontFamily: "var(--font-display)",
                            fontSize: "15px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            boxShadow: "0 0 20px rgba(0,212,255,0.15)",
                            border: "1px solid rgba(0,212,255,0.2)",
                            transition: "all 0.2s var(--ease-spring)",
                        }}
                    >
                        <Eye size={18} color="var(--cyan)" />
                        Show Answer
                    </button>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr",
                            gap: "6px",
                        }}
                    >
                        {ratingButtons.map((btn, i) => {
                            const cfg = ratingConfig[i];
                            const isActive = animatingRating === i + 1;
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleRating(i + 1)}
                                    disabled={!!animatingRating}
                                    style={{
                                        padding: "12px 4px",
                                        minHeight: "56px",
                                        borderRadius: "14px",
                                        border: `1px solid ${isActive ? cfg.color + "60" : cfg.border}`,
                                        background: isActive
                                            ? `${cfg.color}25`
                                            : cfg.bg,
                                        color: cfg.color,
                                        fontWeight: 700,
                                        fontSize: "12px",
                                        cursor: "pointer",
                                        textAlign: "center",
                                        transition:
                                            "all 0.15s var(--ease-spring)",
                                        transform: isActive
                                            ? "scale(0.95)"
                                            : "scale(1)",
                                        fontFamily: "var(--font-body)",
                                        boxShadow: isActive
                                            ? `0 0 12px ${cfg.color}30`
                                            : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "16px",
                                            marginBottom: "3px",
                                        }}
                                    >
                                        {btn.emoji}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "var(--font-display)",
                                            fontSize: "11px",
                                            fontWeight: 800,
                                        }}
                                    >
                                        {cfg.label}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "10px",
                                            opacity: 0.65,
                                            fontFamily: "var(--font-mono)",
                                            marginTop: "2px",
                                        }}
                                    >
                                        {cfg.interval}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatBox({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div
            style={{
                textAlign: "center",
                padding: "8px 4px",
                borderRadius: 10,
                background: "var(--bg-raised)",
            }}
        >
            <p
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "20px",
                    fontWeight: 600,
                    color,
                    margin: 0,
                }}
            >
                {value}
            </p>
            <p
                style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    margin: "2px 0 0",
                    fontFamily: "var(--font-body)",
                }}
            >
                {label}
            </p>
        </div>
    );
}

function Pill({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <span
            style={{
                padding: "4px 12px",
                borderRadius: 99,
                fontSize: 12,
                background: "var(--bg-raised)",
                color,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
            }}
        >
            {label}: {value}
        </span>
    );
}
