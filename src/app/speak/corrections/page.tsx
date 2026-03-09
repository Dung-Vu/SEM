"use client";

import { useEffect, useState, useCallback } from "react";
import {
    PenLine,
    Sparkles,
    Mic2,
    XCircle,
    CheckCircle2,
    Lightbulb,
} from "lucide-react";

interface Correction {
    id: string;
    conversationId: string;
    mode: string;
    original: string;
    corrected: string;
    explanation: string;
    createdAt: string;
}

export default function CorrectionsPage() {
    const [corrections, setCorrections] = useState<Correction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCorrections = useCallback(async () => {
        try {
            const res = await fetch("/api/ai/conversations");
            const data = await res.json();
            const allCorrections: Correction[] = [];

            // Parse corrections from conversation messages
            for (const conv of data.conversations ?? []) {
                // Fetch full conversation to get all messages
                const detailRes = await fetch(
                    `/api/ai/conversations/${conv.id}`,
                );
                if (!detailRes.ok) continue;
                const detail = await detailRes.json();

                for (const msg of detail.messages ?? []) {
                    if (msg.role !== "assistant") continue;
                    // Find correction patterns: ❌ ... → ✅ ... · ...
                    const correctionRegex =
                        /❌\s*(.+?)\s*→\s*✅\s*(.+?)\s*·\s*(.+?)(?=\n|$)/g;
                    let match;
                    while (
                        (match = correctionRegex.exec(msg.content)) !== null
                    ) {
                        allCorrections.push({
                            id: `${conv.id}-${allCorrections.length}`,
                            conversationId: conv.id,
                            mode: conv.mode,
                            original: match[1].trim(),
                            corrected: match[2].trim(),
                            explanation: match[3].trim(),
                            createdAt: conv.createdAt,
                        });
                    }
                }
            }

            setCorrections(allCorrections);
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCorrections();
    }, [fetchCorrections]);

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
                        <PenLine
                            size={40}
                            color="var(--cyan)"
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
                        Analyzing conversations...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
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
                    <PenLine
                        size={20}
                        color="var(--cyan)"
                        strokeWidth={2}
                        style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: "6px",
                        }}
                    />
                    <span className="gradient-text">My Corrections</span>
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        marginTop: "4px",
                    }}
                >
                    AI đã sửa lỗi cho bạn trong các cuộc hội thoại
                </p>
            </div>

            {corrections.length === 0 ? (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{ padding: "32px", textAlign: "center" }}
                >
                    <p
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "8px",
                        }}
                    >
                        <Sparkles
                            size={32}
                            color="var(--gold)"
                            strokeWidth={1.5}
                        />
                    </p>
                    <p
                        style={{
                            fontSize: "14px",
                            color: "var(--text-secondary)",
                            marginBottom: "4px",
                        }}
                    >
                        Chưa có corrections nào
                    </p>
                    <p
                        style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                        }}
                    >
                        Hãy nói chuyện với AI để nhận feedback!
                    </p>
                    <a
                        href="/speak"
                        className="btn-primary"
                        style={{
                            display: "inline-block",
                            marginTop: "12px",
                            textDecoration: "none",
                        }}
                    >
                        Start Conversation
                    </a>
                </div>
            ) : (
                <>
                    <div
                        className="glass-card animate-fade-in-up"
                        style={{ padding: "14px", marginBottom: "10px" }}
                    >
                        <p style={{ fontSize: "13px", textAlign: "center" }}>
                            <span
                                style={{
                                    fontWeight: 800,
                                    color: "var(--cyan)",
                                    fontSize: "18px",
                                }}
                            >
                                {corrections.length}
                            </span>{" "}
                            <span
                                style={{
                                    color: "var(--text-muted)",
                                    fontSize: "12px",
                                }}
                            >
                                corrections found
                            </span>
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                        }}
                    >
                        {corrections.map((c, i) => (
                            <div
                                key={c.id}
                                className="glass-card animate-fade-in-up"
                                style={{
                                    padding: "14px",
                                    animationDelay: `${i * 0.03}s`,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "6px",
                                    }}
                                >
                                    <XCircle
                                        size={14}
                                        style={{
                                            color: "var(--ruby)",
                                            marginTop: "1px",
                                            flexShrink: 0,
                                        }}
                                        strokeWidth={2}
                                    />
                                    <span
                                        style={{
                                            textDecoration: "line-through",
                                        }}
                                    >
                                        {c.original}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "6px",
                                        marginBottom: "6px",
                                    }}
                                >
                                    <CheckCircle2
                                        size={14}
                                        style={{
                                            color: "var(--emerald)",
                                            marginTop: "1px",
                                            flexShrink: 0,
                                        }}
                                        strokeWidth={2}
                                    />
                                    <span
                                        style={{
                                            fontSize: "13px",
                                            color: "var(--emerald-bright)",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {c.corrected}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "6px",
                                    }}
                                >
                                    <Lightbulb
                                        size={13}
                                        color="var(--gold)"
                                        strokeWidth={2}
                                        style={{
                                            marginTop: "1px",
                                            flexShrink: 0,
                                        }}
                                    />
                                    <p
                                        style={{
                                            fontSize: "12px",
                                            color: "var(--text-muted)",
                                            margin: 0,
                                        }}
                                    >
                                        {c.explanation}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div style={{ textAlign: "center", marginTop: "12px" }}>
                <a
                    href="/speak/history"
                    style={{
                        fontSize: "12px",
                        color: "var(--cyan)",
                        textDecoration: "none",
                    }}
                >
                    ← Conversation history
                </a>
            </div>
        </div>
    );
}
