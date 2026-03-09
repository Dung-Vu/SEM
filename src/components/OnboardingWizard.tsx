"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronRight,
    ChevronLeft,
    Zap,
    BookOpen,
    Mic2,
    Swords,
    Map,
    Target,
    Rocket,
} from "lucide-react";
import { LevelPicker } from "./Onboarding/LevelPicker";
import { WeaknessPicker, type WeaknessKey } from "./Onboarding/WeaknessPicker";

interface OnboardingWizardProps {
    onComplete: () => void;
}

const STEPS = [
    {
        title: "SEM",
        subtitle: "BEGIN YOUR JOURNEY",
        icon: Zap,
        content: "Chào mừng đến với SEM — Self English Mastery.",
        detail: "Mọi hoạt động đều tích EXP, lên level, và mở khóa thành tựu huyền thoại.",
        accentColor: "var(--gold)",
        gradient:
            "radial-gradient(ellipse at 50% 60%, rgba(245,166,35,0.15) 0%, transparent 70%)",
        type: "info" as const,
    },
    {
        title: "Your Level",
        subtitle: "CHỌN TRÌNH ĐỘ",
        icon: Target,
        content: "Bạn đang ở trình độ nào?",
        detail: "Chúng tôi sẽ điều chỉnh nội dung phù hợp với bạn.",
        accentColor: "var(--cyan)",
        gradient:
            "radial-gradient(ellipse at 50% 60%, rgba(0,212,255,0.12) 0%, transparent 70%)",
        type: "level" as const,
    },
    {
        title: "Daily Anki",
        subtitle: "SPACED REPETITION",
        icon: BookOpen,
        content: "Học từ vựng theo phương pháp SRS — nhớ mãi mãi.",
        detail: "Thêm từ → hệ thống tự lên lịch ôn tập. Mỗi card đúng +5 EXP.",
        accentColor: "var(--cyan)",
        gradient:
            "radial-gradient(ellipse at 50% 60%, rgba(0,212,255,0.12) 0%, transparent 70%)",
        type: "info" as const,
    },
    {
        title: "AI Conversation",
        subtitle: "LUYỆN NÓI MƯỢT",
        icon: Mic2,
        content: "Trò chuyện với AI ở 10 tình huống thực tế khác nhau.",
        detail: "AI sửa lỗi real-time. Coffee shop, văn phòng, sân bay... tất cả có ở đây.",
        accentColor: "var(--violet)",
        gradient:
            "radial-gradient(ellipse at 50% 60%, rgba(124,58,237,0.12) 0%, transparent 70%)",
        type: "info" as const,
    },
    {
        title: "Quests & Loot",
        subtitle: "GAMIFICATION",
        icon: Swords,
        content: "Hoàn thành nhiệm vụ mỗi ngày để leo bảng xếp hạng.",
        detail: "Main quests, side quests, weekly challenges — mỗi quest đều có EXP.",
        accentColor: "var(--gold)",
        gradient:
            "radial-gradient(ellipse at 50% 60%, rgba(245,166,35,0.15) 0%, transparent 70%)",
        type: "info" as const,
    },
    {
        title: "Kingdom Map",
        subtitle: "LEO LEVEL",
        icon: Map,
        content:
            "Từ Beginner Village → Grammar Forest → Fluency Castle → Legend Realm.",
        detail: "Mỗi kingdom mới là một cột mốc. Streak cao → huy hiệu đặc biệt!",
        accentColor: "var(--emerald)",
        gradient:
            "radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.12) 0%, transparent 70%)",
        type: "info" as const,
    },
    {
        title: "Weakness",
        subtitle: "ĐIỂM YẾU",
        icon: Target,
        content: "Bạn muốn cải thiện kỹ năng nào nhất?",
        detail: "SEM sẽ ưu tiên tính năng phù hợp cho bạn.",
        accentColor: "var(--ruby)",
        gradient:
            "radial-gradient(ellipse at 50% 60%, rgba(239,68,68,0.12) 0%, transparent 70%)",
        type: "weakness" as const,
    },
    {
        title: "Ready?",
        subtitle: "KHỞI ĐẦU",
        icon: Rocket,
        content: "Hành trình của bạn bắt đầu ngay bây giờ.",
        detail: "Check in ngày đầu tiên → nhận ngay +50 EXP khởi động!",
        accentColor: "var(--gold)",
        gradient:
            "radial-gradient(ellipse at 50% 70%, rgba(245,166,35,0.2) 0%, transparent 70%)",
        type: "info" as const,
    },
];

const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export default function OnboardingWizard({
    onComplete,
}: OnboardingWizardProps) {
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [selectedLevel, setSelectedLevel] = useState("A2");
    const [studyTime, setStudyTime] = useState(30);
    const [weakness, setWeakness] = useState<WeaknessKey>("vocabulary");

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;
    const Icon = current.icon;
    const progressPct = ((step + 1) / STEPS.length) * 100;

    const handleComplete = () => {
        const newCardsPerDay: Record<string, number> = {
            A1: 10,
            A2: 15,
            B1: 20,
            B2: 25,
            C1: 25,
            C2: 25,
        };
        const ankiCards = newCardsPerDay[selectedLevel] ?? 15;
        localStorage.setItem("eq-onboarded", "true");
        localStorage.setItem("eq-level", selectedLevel);
        localStorage.setItem("eq-study-time", String(studyTime));
        const existingSettings = JSON.parse(
            localStorage.getItem("eq-settings") || "{}",
        );
        localStorage.setItem(
            "eq-settings",
            JSON.stringify({
                ...existingSettings,
                ankiNewPerDay: ankiCards,
                ankiMaxReview: ankiCards * 5,
                personalizedLevel: selectedLevel,
                dailyStudyTime: studyTime,
                weakness,
                suggestedFeatures:
                    studyTime >= 60
                        ? ["anki", "speak", "quests", "journal", "shadow"]
                        : studyTime >= 30
                          ? ["anki", "speak", "quests"]
                          : ["anki"],
            }),
        );
        onComplete();
    };

    const goNext = () => {
        if (isLast) {
            handleComplete();
            return;
        }
        setDirection(1);
        setStep((s) => s + 1);
    };
    const goBack = () => {
        setDirection(-1);
        setStep((s) => s - 1);
    };

    return createPortal(
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                background: "#0a0a0f",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                height: "100dvh",
            }}
        >
            {/* Ambient gradient bg */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: current.gradient,
                    transition: "background 0.5s ease",
                    pointerEvents: "none",
                }}
            />

            {/* Progress bar — compact top */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "calc(env(safe-area-inset-top, 8px) + 8px) 20px 0",
                    flexShrink: 0,
                }}
            >
                {/* Top row: back + skip */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                    }}
                >
                    {step > 0 ? (
                        <button
                            onClick={goBack}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontFamily: "var(--font-body)",
                                fontSize: "13px",
                                padding: "4px 0",
                            }}
                        >
                            <ChevronLeft size={16} />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}
                    {!isLast && (
                        <button
                            onClick={handleComplete}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                                fontSize: "12px",
                                cursor: "pointer",
                                padding: "4px 0",
                            }}
                        >
                            Skip →
                        </button>
                    )}
                </div>

                {/* Thin progress bar */}
                <div
                    style={{
                        height: "3px",
                        background: "var(--border-subtle)",
                        borderRadius: "99px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${progressPct}%`,
                            background: current.accentColor,
                            borderRadius: "99px",
                            transition: "width 0.4s var(--ease-spring)",
                        }}
                    />
                </div>

                {/* Step counter */}
                <p
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        marginTop: "6px",
                        marginBottom: 0,
                        textAlign: "center",
                        letterSpacing: "0.08em",
                    }}
                >
                    {step + 1} / {STEPS.length}
                </p>
            </div>

            {/* Slide content area — fills remaining space */}
            <div
                style={{
                    flex: 1,
                    position: "relative",
                    overflow: "hidden",
                    minHeight: 0,
                }}
            >
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            type: "spring" as const,
                            stiffness: 340,
                            damping: 30,
                            mass: 0.8,
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 24px 16px",
                            paddingTop: "8%",
                            textAlign: "center",
                            overflowY: "auto",
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        {/* Icon — compact */}
                        <div
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: "18px",
                                background: `${current.accentColor}18`,
                                border: `1.5px solid ${current.accentColor}40`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "16px",
                                boxShadow: `0 0 24px ${current.accentColor}20`,
                                flexShrink: 0,
                            }}
                        >
                            <Icon
                                size={28}
                                color={current.accentColor}
                                strokeWidth={1.5}
                            />
                        </div>

                        {/* Subtitle */}
                        <p
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "9px",
                                fontWeight: 700,
                                letterSpacing: "0.22em",
                                color: current.accentColor,
                                textTransform: "uppercase",
                                margin: "0 0 6px",
                                opacity: 0.85,
                            }}
                        >
                            {current.subtitle}
                        </p>

                        {/* Title */}
                        <h2
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "24px",
                                fontWeight: 800,
                                margin: "0 0 10px",
                                color: "var(--text-primary)",
                                lineHeight: 1.2,
                            }}
                        >
                            {current.title}
                        </h2>

                        {/* Content */}
                        <p
                            style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "14px",
                                color: "var(--text-secondary)",
                                lineHeight: 1.6,
                                margin: "0 0 4px",
                                maxWidth: "300px",
                            }}
                        >
                            {current.content}
                        </p>

                        {/* Level picker */}
                        {current.type === "level" && (
                            <LevelPicker
                                selectedLevel={selectedLevel}
                                studyTime={studyTime}
                                onLevelChange={setSelectedLevel}
                                onStudyTimeChange={setStudyTime}
                            />
                        )}

                        {/* Weakness picker */}
                        {current.type === "weakness" && (
                            <WeaknessPicker
                                weakness={weakness}
                                onChange={setWeakness}
                            />
                        )}

                        {/* Detail text for info steps */}
                        {current.type === "info" && (
                            <p
                                style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "12px",
                                    color: "var(--text-muted)",
                                    lineHeight: 1.65,
                                    marginTop: "8px",
                                    maxWidth: "280px",
                                }}
                            >
                                {current.detail}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom CTA — compact */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    padding:
                        "12px 24px calc(env(safe-area-inset-bottom, 12px) + 12px)",
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={goNext}
                    style={{
                        width: "100%",
                        minHeight: 50,
                        borderRadius: 14,
                        border: "none",
                        background: `linear-gradient(135deg, ${current.accentColor}, ${current.accentColor})`,
                        color: "#000",
                        fontFamily: "var(--font-display)",
                        fontSize: "15px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: `0 4px 20px ${current.accentColor}40`,
                        transition: "all 0.2s var(--ease-spring)",
                    }}
                >
                    {isLast ? (
                        "Bắt đầu hành trình!"
                    ) : (
                        <>
                            {step === 0 ? "Begin Quest" : "Continue"}
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </>
                    )}
                </button>
            </div>
        </div>,
        document.body,
    );
}
