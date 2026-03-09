"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ClipboardCheck,
    Zap,
    BookOpen,
    ArrowLeft,
    History,
} from "lucide-react";
import Link from "next/link";
import {
    AILoadingIndicator,
    AIProgressBar,
} from "@/components/ui/AILoadingIndicator";

const LEVELS = ["B1", "B2", "C1"] as const;
const SECTIONS = [
    { key: "grammar", label: "Grammar", icon: "📝" },
    { key: "vocabulary", label: "Vocabulary", icon: "📖" },
    { key: "reading", label: "Reading", icon: "📰" },
    { key: "listening", label: "Listening", icon: "🎧" },
];

export default function ExamStartPage() {
    const router = useRouter();
    const [level, setLevel] = useState<string>("B2");
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startExam = async (mode: string, section?: string) => {
        setStarting(true);
        setError(null);
        try {
            const res = await fetch("/api/exam/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ level, mode, section }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to start exam");

            // Store exam data in sessionStorage for the exam page
            sessionStorage.setItem(`exam_${data.examId}`, JSON.stringify(data));
            router.push(`/exam/${data.examId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lỗi khi tạo đề thi");
            setStarting(false);
        }
    };

    const card = (children: React.ReactNode) => (
        <div
            style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
            }}
        >
            {children}
        </div>
    );

    if (starting) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                    gap: 16,
                }}
            >
                <AILoadingIndicator context="exam" />
                <AIProgressBar style={{ width: "60%", marginTop: 8 }} />
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    AI đang soạn câu hỏi theo level {level}
                </p>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: 8, paddingBottom: 16 }}>
            <div className="animate-fade-in-up" style={{ marginBottom: 20 }}>
                <h1
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 22,
                        fontWeight: 800,
                        margin: "0 0 4px",
                    }}
                >
                    <ClipboardCheck
                        size={20}
                        color="var(--gold)"
                        strokeWidth={2}
                        style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: 6,
                        }}
                    />
                    Exam Mode
                </h1>
                <p
                    style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                    }}
                >
                    Thi thử TOEIC/IELTS format — AI generate đề, chấm tức thì
                </p>
            </div>

            {error && (
                <div
                    style={{
                        background: "rgba(248,113,113,0.1)",
                        border: "1px solid rgba(248,113,113,0.3)",
                        borderRadius: 12,
                        padding: "10px 14px",
                        marginBottom: 12,
                        fontSize: 12,
                        color: "var(--ruby)",
                    }}
                >
                    {error}
                </div>
            )}

            {/* Level Selector */}
            {card(
                <>
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            margin: "0 0 10px",
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        Chọn Level
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                        {LEVELS.map((l) => (
                            <button
                                key={l}
                                onClick={() => setLevel(l)}
                                style={{
                                    flex: 1,
                                    padding: "10px 0",
                                    borderRadius: 10,
                                    border:
                                        level === l
                                            ? "2px solid var(--gold)"
                                            : "1px solid var(--border-subtle)",
                                    background:
                                        level === l
                                            ? "rgba(245,200,66,0.1)"
                                            : "var(--bg-raised)",
                                    color:
                                        level === l
                                            ? "var(--gold)"
                                            : "var(--text-secondary)",
                                    fontFamily: "var(--font-display)",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </>,
            )}

            {/* Mode Cards */}
            {card(
                <>
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            margin: "0 0 10px",
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        Chọn Mode
                    </p>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 10,
                        }}
                    >
                        <button
                            onClick={() => startExam("full")}
                            className="speak-mode-card"
                            style={{
                                padding: 16,
                                borderRadius: 14,
                                border: "1px solid var(--border-subtle)",
                                background: "var(--bg-raised)",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <ClipboardCheck
                                size={24}
                                color="var(--gold)"
                                strokeWidth={2}
                                style={{ marginBottom: 8 }}
                            />
                            <p
                                style={{
                                    margin: 0,
                                    fontFamily: "var(--font-display)",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                }}
                            >
                                Full Exam
                            </p>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                }}
                            >
                                40 câu · 60 phút
                            </p>
                        </button>
                        <button
                            onClick={() => startExam("quick")}
                            className="speak-mode-card"
                            style={{
                                padding: 16,
                                borderRadius: 14,
                                border: "1px solid var(--border-subtle)",
                                background: "var(--bg-raised)",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <Zap
                                size={24}
                                color="var(--cyan)"
                                strokeWidth={2}
                                style={{ marginBottom: 8 }}
                            />
                            <p
                                style={{
                                    margin: 0,
                                    fontFamily: "var(--font-display)",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                }}
                            >
                                Quick
                            </p>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                }}
                            >
                                20 câu · 30 phút
                            </p>
                        </button>
                    </div>
                </>,
            )}

            {/* Section Mode */}
            {card(
                <>
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            margin: "0 0 10px",
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        Section Only — 10 câu · 15 phút
                    </p>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                        }}
                    >
                        {SECTIONS.map((s) => (
                            <button
                                key={s.key}
                                onClick={() => startExam("section", s.key)}
                                className="speak-mode-card"
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: 10,
                                    border: "1px solid var(--border-subtle)",
                                    background: "var(--bg-raised)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <span style={{ fontSize: 18 }}>{s.icon}</span>
                                <span
                                    style={{
                                        fontFamily: "var(--font-display)",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </>,
            )}

            {/* History Link */}
            <Link href="/exam/history" style={{ textDecoration: "none" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: 12,
                        marginTop: 4,
                    }}
                >
                    <History size={14} color="var(--violet)" strokeWidth={2} />
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--violet)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        Lịch sử thi
                    </span>
                </div>
            </Link>
        </div>
    );
}
