"use client";

import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props {
    hasUnread: boolean;
}

export function WeeklyReportLink({ hasUnread }: Props) {
    return (
        <Link href="/analytics/weekly" style={{ textDecoration: "none" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "var(--bg-raised)",
                    border: `1px solid ${hasUnread ? "rgba(245,200,66,0.5)" : "rgba(245,200,66,0.25)"}`,
                    borderRadius: 14,
                    marginBottom: 12,
                    cursor: "pointer",
                    position: "relative",
                }}
            >
                {/* Unread dot */}
                {hasUnread && (
                    <div
                        style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "var(--ruby)",
                            border: "2px solid var(--bg-base)",
                        }}
                    />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CalendarDays size={18} style={{ color: "var(--gold)" }} />
                    <div>
                        <p
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                margin: 0,
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            Weekly Report
                        </p>
                        <p
                            style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                                margin: 0,
                            }}
                        >
                            AI tóm tắt 7 ngày học tập
                        </p>
                    </div>
                </div>
                <ChevronRight
                    size={16}
                    style={{ color: "var(--text-muted)" }}
                />
            </div>
        </Link>
    );
}
