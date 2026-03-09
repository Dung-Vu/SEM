"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import OnboardingWizard from "@/components/OnboardingWizard";
import { InstallPrompt } from "@/components/InstallPrompt";
import { haptic } from "@/lib/haptics";
import { invalidate, STALE } from "@/lib/cache";
import { useCache } from "@/hooks/useCache";
import {
    CelebrationOverlay,
    HeroCard,
    StreakCheckin,
    SkillsBlock,
    QuickActions,
    MoreLinks,
} from "@/components/Dashboard";

// ─── Types ────────────────────────────────────────────────────────────────

interface HeroData {
    username: string;
    level: number;
    exp: number;
    levelProgress: { current: number; needed: number };
    kingdom: { name: string; title: string; cefr: string; icon: string };
    daysSinceStart: number;
    createdAt: string;
}

interface StreakData {
    streak: number;
    lastCheckIn: string | null;
    streakBonus: number;
    checkedInToday: boolean;
}

interface StatsData {
    stats: {
        vocab: number;
        grammar: number;
        listening: number;
        speaking: number;
        writing: number;
    } | null;
}

interface ExpFloat {
    id: number;
    x: number;
    y: number;
    amount: string;
}

const STREAK_MILESTONES: Record<number, { emoji: string; msg: string }> = {
    7: { emoji: "", msg: "1 Week Streak! Consistency is key!" },
    14: { emoji: "", msg: "2 Weeks! You're unstoppable!" },
    30: { emoji: "", msg: "30-Day Streak! Legendary discipline!" },
    60: { emoji: "", msg: "60 Days! Diamond-level dedication!" },
    100: { emoji: "", msg: "100-DAY STREAK! You are the KING!" },
};

const TOAST_COLORS: Record<string, string> = {
    success: "rgba(52,211,153,0.3)",
    error: "rgba(248,113,113,0.3)",
    info: "rgba(245,200,66,0.3)",
};

// ─── Fetchers ─────────────────────────────────────────────────────────────

async function fetchHero(): Promise<HeroData> {
    const res = await fetch("/api/dashboard/hero");
    if (!res.ok) throw new Error("Failed to load hero data");
    return res.json();
}

async function fetchStreak(): Promise<StreakData> {
    const res = await fetch("/api/dashboard/streak");
    if (!res.ok) throw new Error("Failed to load streak data");
    return res.json();
}

async function fetchStats(): Promise<StatsData> {
    const res = await fetch("/api/dashboard/stats");
    if (!res.ok) throw new Error("Failed to load stats");
    return res.json();
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    // 17.5: 3 parallel progressive queries — each renders independently
    const {
        data: hero,
        loading: heroLoading,
        refresh: refreshHero,
    } = useCache<HeroData>("dashboard-hero", fetchHero, {
        staleTime: STALE.hero,
    });

    const {
        data: streakData,
        loading: streakLoading,
        mutate: mutateStreak,
        refresh: refreshStreak,
    } = useCache<StreakData>("dashboard-streak", fetchStreak, {
        staleTime: STALE.streak,
    });

    const { data: statsData, loading: statsLoading } = useCache<StatsData>(
        "dashboard-stats",
        fetchStats,
        { staleTime: STALE.stats, revalidateOnFocus: false },
    );

    const [checkingIn, setCheckingIn] = useState(false);
    const [toast, setToast] = useState<{
        msg: string;
        type: "success" | "error" | "info";
    } | null>(null);
    const [celebration, setCelebration] = useState<{
        type: string;
        message: string;
    } | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem("eq-onboarded")) {
            setShowOnboarding(true);
        }
    }, []);
    const [expFloats, setExpFloats] = useState<ExpFloat[]>([]);
    const checkInBtnRef = useRef<HTMLButtonElement>(null);
    const floatIdRef = useRef(0);

    const showToast = useCallback(
        (msg: string, type: "success" | "error" | "info" = "success") => {
            setToast({ msg, type });
            setTimeout(() => setToast(null), 3500);
        },
        [],
    );

    const spawnExpFloat = useCallback((amount: string) => {
        if (!checkInBtnRef.current) return;
        const rect = checkInBtnRef.current.getBoundingClientRect();
        const id = ++floatIdRef.current;
        setExpFloats((prev) => [
            ...prev,
            { id, x: rect.left + rect.width / 2, y: rect.top, amount },
        ]);
        setTimeout(
            () => setExpFloats((prev) => prev.filter((f) => f.id !== id)),
            1500,
        );
    }, []);

    const handleCheckIn = useCallback(async () => {
        setCheckingIn(true);

        // 17.2: Optimistic update — streak increments immediately
        const prevStreak = streakData?.streak ?? 0;
        mutateStreak((prev) =>
            prev
                ? { ...prev, checkedInToday: true, streak: prev.streak + 1 }
                : {
                      streak: 1,
                      lastCheckIn: new Date().toISOString(),
                      streakBonus: 0,
                      checkedInToday: true,
                  },
        );

        try {
            const res = await fetch("/api/checkin", { method: "POST" });
            const data = await res.json();

            if (data.success) {
                haptic("success");
                spawnExpFloat("+10 EXP");
                showToast(data.message, "success");

                // Invalidate both cache keys and refresh
                invalidate("dashboard-hero");
                invalidate("dashboard-streak");
                await Promise.all([refreshHero(), refreshStreak()]);

                if (data.leveledUp && data.level) {
                    setTimeout(() => {
                        setCelebration({
                            type: "levelup",
                            message: `LEVEL UP! You reached Level ${data.level}!`,
                        });
                        setTimeout(() => setCelebration(null), 5000);
                    }, 500);
                }

                const newStreak = prevStreak + 1;
                const milestone = STREAK_MILESTONES[newStreak];
                if (milestone) {
                    setTimeout(() => {
                        setCelebration({
                            type: "streak",
                            message: `${milestone.emoji} ${milestone.msg}`,
                        });
                        setTimeout(() => setCelebration(null), 5000);
                    }, 1500);
                }
            } else {
                // Rollback optimistic update on failure
                invalidate("dashboard-streak");
                refreshStreak();
                showToast(data.message, "info");
            }
        } catch {
            // Rollback
            invalidate("dashboard-streak");
            refreshStreak();
            showToast("Error checking in", "error");
        } finally {
            setCheckingIn(false);
        }
    }, [
        streakData,
        mutateStreak,
        refreshHero,
        refreshStreak,
        showToast,
        spawnExpFloat,
    ]);

    // ─── Derived values ────────────────────────────────────────────────────

    const expProgress = hero
        ? hero.levelProgress.needed > hero.levelProgress.current
            ? ((hero.exp - hero.levelProgress.current) /
                  (hero.levelProgress.needed - hero.levelProgress.current)) *
              100
            : 100
        : 0;

    const stats = statsData?.stats ?? {
        vocab: 1,
        grammar: 1,
        listening: 1,
        speaking: 1,
        writing: 1,
    };
    const statItems = [
        { key: "vocab", label: "Vocab", value: stats.vocab },
        { key: "grammar", label: "Grammar", value: stats.grammar },
        { key: "listening", label: "Listen", value: stats.listening },
        { key: "speaking", label: "Speak", value: stats.speaking },
        { key: "writing", label: "Write", value: stats.writing },
    ];

    // Build a UserData-compatible shape for components that need it
    const userCompat =
        hero && streakData
            ? {
                  id: "local",
                  username: hero.username,
                  level: hero.level,
                  exp: hero.exp,
                  streak: streakData.streak,
                  lastCheckIn: streakData.lastCheckIn,
                  createdAt: hero.createdAt,
                  stats: statsData?.stats ?? null,
                  levelProgress: hero.levelProgress,
                  kingdom: hero.kingdom,
                  streakBonus: streakData.streakBonus,
              }
            : null;

    // ─── Render ────────────────────────────────────────────────────────────

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
            {showOnboarding && (
                <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
            )}
            <InstallPrompt />

            {/* EXP Float Animations */}
            {expFloats.map((f) => (
                <span
                    key={f.id}
                    className="exp-float"
                    style={{ left: f.x, top: f.y }}
                >
                    {f.amount}
                </span>
            ))}

            {/* Toast */}
            {toast && (
                <div className="toast animate-scale-in">
                    <div
                        className="glass-card"
                        style={{
                            padding: "13px 18px",
                            borderColor: TOAST_COLORS[toast.type],
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
                            {toast.msg}
                        </p>
                    </div>
                </div>
            )}

            <CelebrationOverlay
                celebration={celebration}
                onDismiss={() => setCelebration(null)}
            />

            {/* ─── 17.5 PROGRESSIVE: Hero renders as soon as heroData ready ──── */}
            {heroLoading ? (
                <div style={{ marginBottom: 16 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            padding: "20px",
                            borderRadius: 20,
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-gold)",
                            marginBottom: 0,
                        }}
                    >
                        <div>
                            <div
                                className="skeleton"
                                style={{
                                    width: 80,
                                    height: 24,
                                    marginBottom: 8,
                                    borderRadius: 12,
                                }}
                            />
                            <div
                                className="skeleton"
                                style={{
                                    width: 160,
                                    height: 28,
                                    marginBottom: 6,
                                }}
                            />
                            <div
                                className="skeleton"
                                style={{ width: 120, height: 14 }}
                            />
                        </div>
                        <div
                            className="skeleton"
                            style={{ width: 64, height: 64, borderRadius: 18 }}
                        />
                    </div>
                </div>
            ) : hero ? (
                <HeroCard
                    user={{
                        ...hero,
                        createdAt: hero.createdAt,
                    }}
                    expProgress={expProgress}
                    daysSinceStart={hero.daysSinceStart}
                />
            ) : null}

            {/* ─── Streak: renders independently ─────────────────────────────── */}
            {streakLoading ? (
                <div
                    className="skeleton"
                    style={{
                        width: "100%",
                        height: 100,
                        borderRadius: 16,
                        marginBottom: 12,
                    }}
                />
            ) : userCompat ? (
                <StreakCheckin
                    user={userCompat}
                    checkedInToday={streakData?.checkedInToday ?? false}
                    checkingIn={checkingIn}
                    checkInBtnRef={checkInBtnRef}
                    onCheckIn={handleCheckIn}
                />
            ) : null}

            {/* ─── Skills: slowest — renders last ────────────────────────────── */}
            {statsLoading ? (
                <div style={{ marginBottom: 14 }}>
                    <div
                        className="skeleton"
                        style={{ width: 120, height: 14, marginBottom: 12 }}
                    />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10,
                            }}
                        >
                            <div
                                className="skeleton"
                                style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                }}
                            />
                            <div
                                className="skeleton"
                                style={{ flex: 1, height: 6, borderRadius: 99 }}
                            />
                            <div
                                className="skeleton"
                                style={{ width: 40, height: 10 }}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <SkillsBlock statItems={statItems} />
            )}

            <QuickActions />

            <MoreLinks
                daysSinceStart={hero?.daysSinceStart ?? 0}
                totalExp={hero?.exp ?? 0}
            />
        </div>
    );
}
