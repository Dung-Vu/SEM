"use client";

import { Flame } from "lucide-react";
import { RefObject } from "react";

interface UserData {
    streak: number;
    streakBonus: number;
}

interface Props {
    user: UserData;
    checkedInToday: boolean;
    checkingIn: boolean;
    checkInBtnRef: RefObject<HTMLButtonElement | null>;
    onCheckIn: () => void;
}

export function StreakCheckin({
    user,
    checkedInToday,
    checkingIn,
    checkInBtnRef,
    onCheckIn,
}: Props) {
    const streakIsHot = user.streak >= 7;

    return (
        <div
            className="dark-card animate-fade-in-up stagger-1"
            style={{ padding: "18px", marginBottom: "12px" }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Streak number */}
                <div
                    style={{
                        textAlign: "center",
                        minWidth: "80px",
                        padding: "12px 8px",
                        borderRadius: "14px",
                        background: streakIsHot
                            ? "var(--gold-dim)"
                            : "var(--bg-raised)",
                        border: `1px solid ${streakIsHot ? "rgba(245,166,35,0.3)" : "var(--border-subtle)"}`,
                    }}
                >
                    <div
                        style={{
                            fontSize: "28px",
                            marginBottom: "2px",
                            filter:
                                user.streak === 0 ? "grayscale(0.8)" : "none",
                            animation: checkedInToday
                                ? "pulseSlow 2s infinite"
                                : "none",
                        }}
                    >
                        <Flame
                            size={24}
                            color={streakIsHot ? "var(--gold)" : "var(--ruby)"}
                            fill={streakIsHot ? "var(--gold)" : "var(--ruby)"}
                            strokeWidth={1.5}
                        />
                    </div>
                    <p
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "30px",
                            fontWeight: 700,
                            color: streakIsHot ? "var(--gold)" : "var(--ruby)",
                            margin: 0,
                            lineHeight: 1,
                        }}
                    >
                        {user.streak}
                    </p>
                    <p
                        style={{
                            fontSize: "9px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-display)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            marginTop: "4px",
                        }}
                    >
                        {user.streak === 0 ? "start" : "streak"}
                    </p>
                </div>

                {/* Check-in button */}
                <div style={{ flex: 1 }}>
                    <button
                        ref={checkInBtnRef}
                        onClick={onCheckIn}
                        disabled={checkedInToday || checkingIn}
                        className={
                            checkedInToday
                                ? "btn-secondary"
                                : "btn-primary glow-pulse"
                        }
                        style={
                            checkedInToday
                                ? {
                                      borderColor: "rgba(16,185,129,0.3)",
                                      color: "var(--emerald)",
                                  }
                                : { fontSize: "15px" }
                        }
                    >
                        {checkingIn
                            ? "Checking In..."
                            : checkedInToday
                              ? "✓ Checked In"
                              : "Check In Today"}
                    </button>
                    {user.streakBonus > 1 && (
                        <p
                            style={{
                                fontSize: "12px",
                                color: "var(--gold)",
                                fontWeight: 600,
                                textAlign: "center",
                                marginTop: "8px",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            ×{user.streakBonus} EXP Bonus
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
