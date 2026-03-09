"use client";

import { useEffect, useState } from "react";

/**
 * AI Loading Indicator — context-aware messages with thinking dots.
 * Shows personality-driven loading messages that cycle automatically.
 */

const CONTEXT_MESSAGES: Record<string, string[]> = {
    grading: [
        "SENSEI đang đọc bài...",
        "Đang phân tích ngữ pháp...",
        "Đang chấm điểm...",
    ],
    insight: [
        "ORACLE đang phân tích data...",
        "Đang tìm pattern...",
        "Đang tổng hợp kết quả...",
    ],
    speak: ["Đang suy nghĩ...", "Chuẩn bị phản hồi..."],
    exam: ["Đang tạo câu hỏi...", "AI đang soạn đề thi...", "Sắp xong rồi..."],
    debrief: ["SENSEI đang tổng kết buổi học..."],
    default: ["Đang xử lý...", "Chờ chút nhé..."],
};

function ThinkingDots() {
    return (
        <span style={{ display: "inline-flex", gap: 3 }}>
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--gold)",
                        animation: `thinking-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }}
                />
            ))}
        </span>
    );
}

export function AILoadingIndicator({
    context = "default",
    style,
}: {
    context?: string;
    style?: React.CSSProperties;
}) {
    const [msgIdx, setMsgIdx] = useState(0);
    const msgs = CONTEXT_MESSAGES[context] ?? CONTEXT_MESSAGES.default;

    useEffect(() => {
        if (msgs.length <= 1) return;
        const interval = setInterval(() => {
            setMsgIdx((i) => (i + 1) % msgs.length);
        }, 1800);
        return () => clearInterval(interval);
    }, [msgs]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                ...style,
            }}
        >
            <ThinkingDots />
            <p
                key={msgIdx}
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-display)",
                    margin: 0,
                    animation: "fadeIn 0.3s ease-out",
                }}
            >
                {msgs[msgIdx]}
            </p>
        </div>
    );
}

/**
 * AI Progress Bar — fake progress that fills quickly at start, slows near end.
 * Completes to 100% when `done` prop becomes true.
 */
export function AIProgressBar({
    done = false,
    style,
}: {
    done?: boolean;
    style?: React.CSSProperties;
}) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (done) {
            setProgress(100);
            return;
        }
        // Schedule: fast at start, decelerating
        const schedule = [
            { target: 30, delay: 500 },
            { target: 55, delay: 1300 },
            { target: 72, delay: 2500 },
            { target: 82, delay: 4000 },
            { target: 88, delay: 6000 },
            { target: 92, delay: 9000 },
        ];

        const timers: ReturnType<typeof setTimeout>[] = [];
        for (const step of schedule) {
            timers.push(setTimeout(() => setProgress(step.target), step.delay));
        }
        return () => timers.forEach(clearTimeout);
    }, [done]);

    return (
        <div
            style={{
                height: 3,
                borderRadius: 2,
                background: "var(--bg-elevated)",
                overflow: "hidden",
                ...style,
            }}
        >
            <div
                style={{
                    height: "100%",
                    width: `${progress}%`,
                    borderRadius: 2,
                    background: "var(--gold)",
                    transition: done
                        ? "width 0.3s ease-out"
                        : "width 0.8s ease-out",
                }}
            />
        </div>
    );
}
