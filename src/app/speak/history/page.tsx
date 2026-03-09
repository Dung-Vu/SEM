"use client";

import { useEffect, useState, useCallback } from "react";
import {
    MessageCircle,
    Coffee,
    Briefcase,
    PlaneTakeoff,
    Swords,
    PenLine,
    Mic2,
    Timer,
    MessageSquare,
    Inbox,
} from "lucide-react";

interface ConversationItem {
    id: string;
    mode: string;
    title: string;
    duration: number;
    expGained: number;
    summary: string;
    preview: string;
    createdAt: string;
}

const MODE_ICONS: Record<
    string,
    React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
> = {
    free_talk: MessageCircle,
    coffee_shop: Coffee,
    office_meeting: Briefcase,
    airport: PlaneTakeoff,
    debate: Swords,
    vocab_quiz: PenLine,
};

export default function ConversationHistoryPage() {
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch("/api/ai/conversations");
            const data = await res.json();
            setConversations(data.conversations ?? []);
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

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
                        <MessageCircle
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
                        Loading history...
                    </p>
                </div>
            </div>
        );
    }

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
            <div
                className="animate-fade-in-up"
                style={{ marginBottom: "12px" }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                    }}
                >
                    <a
                        href="/speak"
                        style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            textDecoration: "none",
                            fontWeight: 600,
                            flexShrink: 0,
                        }}
                    >
                        ← Back
                    </a>
                    <h1
                        style={{
                            fontSize: "16px",
                            fontWeight: 800,
                            margin: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        <MessageCircle
                            size={16}
                            color="var(--cyan)"
                            strokeWidth={2}
                            style={{ flexShrink: 0 }}
                        />
                        <span className="gradient-text">History</span>
                    </h1>
                    <a
                        href="/speak"
                        className="btn-primary"
                        style={{
                            textDecoration: "none",
                            fontSize: "12px",
                            padding: "8px 14px",
                            flexShrink: 0,
                            width: "auto",
                            minHeight: "auto",
                        }}
                    >
                        + New
                    </a>
                </div>
            </div>

            {conversations.length === 0 ? (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{ padding: "32px", textAlign: "center" }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "8px",
                        }}
                    >
                        <Inbox
                            size={32}
                            color="var(--text-muted)"
                            strokeWidth={1.5}
                        />
                    </div>
                    <p
                        style={{
                            fontSize: "14px",
                            color: "var(--text-secondary)",
                        }}
                    >
                        No conversations yet. Start one!
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
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    {conversations.map((conv, i) => (
                        <div
                            key={conv.id}
                            className="glass-card animate-fade-in-up"
                            style={{
                                padding: "14px",
                                animationDelay: `${i * 0.03}s`,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    marginBottom: "6px",
                                }}
                            >
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    {(() => {
                                        const Icon =
                                            MODE_ICONS[conv.mode] ||
                                            MessageCircle;
                                        return (
                                            <Icon
                                                size={20}
                                                color="var(--cyan)"
                                                strokeWidth={2}
                                            />
                                        );
                                    })()}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <p
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            margin: 0,
                                        }}
                                    >
                                        {conv.title ||
                                            conv.mode.replace(/_/g, " ")}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "11px",
                                            color: "var(--text-muted)",
                                            margin: 0,
                                        }}
                                    >
                                        {new Date(
                                            conv.createdAt,
                                        ).toLocaleDateString("vi-VN", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    {conv.duration > 0 && (
                                        <p
                                            style={{
                                                fontSize: "11px",
                                                color: "var(--text-muted)",
                                                margin: 0,
                                            }}
                                        >
                                            {formatDuration(conv.duration)}
                                        </p>
                                    )}
                                    {conv.expGained > 0 && (
                                        <p
                                            style={{
                                                fontSize: "11px",
                                                color: "var(--emerald)",
                                                fontWeight: 600,
                                                margin: 0,
                                            }}
                                        >
                                            +{conv.expGained} EXP
                                        </p>
                                    )}
                                </div>
                            </div>
                            {conv.preview && (
                                <p
                                    style={{
                                        fontSize: "12px",
                                        color: "var(--text-secondary)",
                                        margin: 0,
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical" as const,
                                    }}
                                >
                                    {conv.preview}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Stats */}
            {conversations.length > 0 && (
                <div
                    className="glass-card animate-fade-in-up"
                    style={{ padding: "14px", marginTop: "12px" }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-around",
                            textAlign: "center",
                        }}
                    >
                        <div>
                            <p
                                style={{
                                    fontSize: "20px",
                                    fontWeight: 800,
                                    color: "var(--cyan)",
                                    margin: 0,
                                }}
                            >
                                {conversations.length}
                            </p>
                            <p
                                style={{
                                    fontSize: "10px",
                                    color: "var(--text-muted)",
                                    margin: 0,
                                }}
                            >
                                Sessions
                            </p>
                        </div>
                        <div>
                            <p
                                style={{
                                    fontSize: "20px",
                                    fontWeight: 800,
                                    color: "var(--emerald)",
                                    margin: 0,
                                }}
                            >
                                {conversations.reduce(
                                    (sum, c) => sum + c.expGained,
                                    0,
                                )}
                            </p>
                            <p
                                style={{
                                    fontSize: "10px",
                                    color: "var(--text-muted)",
                                    margin: 0,
                                }}
                            >
                                Total EXP
                            </p>
                        </div>
                        <div>
                            <p
                                style={{
                                    fontSize: "20px",
                                    fontWeight: 800,
                                    color: "var(--amber)",
                                    margin: 0,
                                }}
                            >
                                {Math.round(
                                    conversations.reduce(
                                        (sum, c) => sum + c.duration,
                                        0,
                                    ) / 60,
                                )}
                            </p>
                            <p
                                style={{
                                    fontSize: "10px",
                                    color: "var(--text-muted)",
                                    margin: 0,
                                }}
                            >
                                Minutes
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
