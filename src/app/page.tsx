"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import OnboardingWizard from "@/components/OnboardingWizard";
import { InstallPrompt } from "@/components/InstallPrompt";
import {
    CelebrationOverlay,
    HeroCard,
    StreakCheckin,
    SkillsBlock,
    QuickActions,
    MoreLinks,
} from "@/components/Dashboard";

// ─── Types ────────────────────────────────────────────────────────────────

interface UserData {
    id: string;
    username: string;
    level: number;
    exp: number;
    streak: number;
    lastCheckIn: string | null;
    createdAt: string;
    stats: {
        vocab: number;
        grammar: number;
        listening: number;
        speaking: number;
        writing: number;
    } | null;
    levelProgress: { current: number; needed: number };
    kingdom: { name: string; title: string; cefr: string; icon: string };
    streakBonus: number;
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

// ─── Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [toast, setToast] = useState<{
        msg: string;
        type: "success" | "error" | "info";
    } | null>(null);
    const [celebration, setCelebration] = useState<{
        type: string;
        message: string;
    } | null>(null);
    const [checkedInToday, setCheckedInToday] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [expFloats, setExpFloats] = useState<ExpFloat[]>([]);
    const checkInBtnRef = useRef<HTMLButtonElement>(null);
    const floatIdRef = useRef(0);

    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            !localStorage.getItem("eq-onboarded")
        ) {
            setShowOnboarding(true);
        }
    }, []);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch("/api/user");
            const data = await res.json();
            setUser(data);
            if (data.lastCheckIn) {
                const last = new Date(data.lastCheckIn);
                const now = new Date();
                setCheckedInToday(
                    last.getFullYear() === now.getFullYear() &&
                        last.getMonth() === now.getMonth() &&
                        last.getDate() === now.getDate(),
                );
            }
        } catch {
            console.error("Failed to fetch user");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const showToast = (
        msg: string,
        type: "success" | "error" | "info" = "success",
    ) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const spawnExpFloat = (amount: string) => {
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
    };

    const handleCheckIn = async () => {
        setCheckingIn(true);
        try {
            const prevStreak = user?.streak;
            const res = await fetch("/api/checkin", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                spawnExpFloat("+10 EXP");
                showToast(data.message, "success");
                setCheckedInToday(true);
                await fetchUser();

                if (data.leveledUp && data.level) {
                    setTimeout(() => {
                        setCelebration({
                            type: "levelup",
                            message: `LEVEL UP! You reached Level ${data.level}!`,
                        });
                        setTimeout(() => setCelebration(null), 5000);
                    }, 500);
                }

                const newStreak = (prevStreak ?? 0) + 1;
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
                showToast(data.message, "info");
            }
        } catch {
            showToast("Error checking in", "error");
        } finally {
            setCheckingIn(false);
        }
    };

    // ─── Loading ───
    if (loading) {
        return (
            <div style={{ paddingTop: "8px" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                >
                    <div>
                        <div
                            className="skeleton"
                            style={{ width: 160, height: 28, marginBottom: 8 }}
                        />
                        <div
                            className="skeleton"
                            style={{ width: 100, height: 16 }}
                        />
                    </div>
                    <div
                        className="skeleton"
                        style={{ width: 48, height: 48, borderRadius: 14 }}
                    />
                </div>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="skeleton"
                        style={{
                            height: 100,
                            borderRadius: 16,
                            marginBottom: 10,
                        }}
                    />
                ))}
            </div>
        );
    }

    if (!user) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                }}
            >
                <p style={{ color: "var(--ruby)" }}>Failed to load data</p>
            </div>
        );
    }

    // ─── Derived values ───
    const expProgress =
        user.levelProgress.needed > user.levelProgress.current
            ? ((user.exp - user.levelProgress.current) /
                  (user.levelProgress.needed - user.levelProgress.current)) *
              100
            : 100;

    const stats = user.stats ?? {
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
    const daysSinceStart = user.createdAt
        ? Math.floor(
              (Date.now() - new Date(user.createdAt).getTime()) / 86400000,
          ) + 1
        : 1;

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

            <HeroCard
                user={user}
                expProgress={expProgress}
                daysSinceStart={daysSinceStart}
            />

            <StreakCheckin
                user={user}
                checkedInToday={checkedInToday}
                checkingIn={checkingIn}
                checkInBtnRef={checkInBtnRef}
                onCheckIn={handleCheckIn}
            />

            <SkillsBlock statItems={statItems} />

            <QuickActions />

            <MoreLinks daysSinceStart={daysSinceStart} totalExp={user.exp} />
        </div>
    );
}
