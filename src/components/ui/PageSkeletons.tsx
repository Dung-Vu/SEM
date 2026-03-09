"use client";

import { Skeleton, SkeletonRow } from "./Skeleton";

// ─── Dashboard ──────────────────────────────────────────────────────────
// Already inlined in page.tsx — this is the extracted version

export function DashboardSkeleton() {
    return (
        <div style={{ paddingTop: 8 }}>
            {/* Hero header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                }}
            >
                <div>
                    <Skeleton
                        width={160}
                        height={28}
                        style={{ marginBottom: 8 }}
                    />
                    <Skeleton width={100} height={16} />
                </div>
                <Skeleton width={48} height={48} borderRadius={14} />
            </div>
            {/* Hero card */}
            <Skeleton
                width="100%"
                height={140}
                borderRadius={20}
                style={{ marginBottom: 12 }}
            />
            {/* Streak */}
            <Skeleton
                width="100%"
                height={80}
                borderRadius={16}
                style={{ marginBottom: 12 }}
            />
            {/* Skills */}
            <Skeleton width={80} height={14} style={{ marginBottom: 10 }} />
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 8,
                    }}
                >
                    <Skeleton width={14} height={14} borderRadius="50%" />
                    <Skeleton height={8} borderRadius={4} style={{ flex: 1 }} />
                    <Skeleton width={32} height={12} />
                </div>
            ))}
            {/* Quick actions */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 16,
                }}
            >
                <Skeleton height={90} borderRadius={16} />
                <Skeleton height={90} borderRadius={16} />
            </div>
        </div>
    );
}

// ─── Anki ────────────────────────────────────────────────────────────────

export function AnkiSkeleton() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 20,
                gap: 16,
            }}
        >
            <Skeleton width="100%" height={240} borderRadius={20} />
            <Skeleton width={120} height={16} />
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 8,
                    width: "100%",
                }}
            >
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} height={52} borderRadius={12} />
                ))}
            </div>
        </div>
    );
}

// ─── Quests ──────────────────────────────────────────────────────────────

export function QuestSkeleton() {
    return (
        <div style={{ paddingTop: 8 }}>
            {/* Header */}
            <Skeleton width={140} height={24} style={{ marginBottom: 6 }} />
            <Skeleton width={200} height={14} style={{ marginBottom: 16 }} />
            {/* Progress card */}
            <Skeleton
                width="100%"
                height={100}
                borderRadius={20}
                style={{ marginBottom: 16 }}
            />
            {/* Quest list */}
            <Skeleton width={90} height={12} style={{ marginBottom: 12 }} />
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 12,
                    }}
                >
                    <Skeleton width={40} height={40} borderRadius="50%" />
                    <div style={{ flex: 1 }}>
                        <Skeleton
                            width="70%"
                            height={14}
                            style={{ marginBottom: 6 }}
                        />
                        <Skeleton width="50%" height={10} />
                    </div>
                    <Skeleton width={56} height={28} borderRadius={8} />
                </div>
            ))}
        </div>
    );
}

// ─── Speak ───────────────────────────────────────────────────────────────

export function SpeakSkeleton() {
    return (
        <div style={{ paddingTop: 8 }}>
            <Skeleton width={160} height={24} style={{ marginBottom: 6 }} />
            <Skeleton width={220} height={14} style={{ marginBottom: 20 }} />
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                }}
            >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} height={110} borderRadius={16} />
                ))}
            </div>
        </div>
    );
}

// ─── Analytics ───────────────────────────────────────────────────────────

export function AnalyticsSkeleton() {
    return (
        <div style={{ paddingTop: 8 }}>
            <Skeleton width={140} height={24} style={{ marginBottom: 16 }} />
            {/* Insight banner */}
            <Skeleton
                width="100%"
                height={72}
                borderRadius={16}
                style={{ marginBottom: 12 }}
            />
            {/* Chart */}
            <Skeleton
                width="100%"
                height={220}
                borderRadius={16}
                style={{ marginBottom: 12 }}
            />
            {/* Stats grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                }}
            >
                <Skeleton height={80} borderRadius={12} />
                <Skeleton height={80} borderRadius={12} />
            </div>
            {/* Additional cards */}
            {[1, 2].map((i) => (
                <Skeleton
                    key={i}
                    width="100%"
                    height={100}
                    borderRadius={16}
                    style={{ marginTop: 12 }}
                />
            ))}
        </div>
    );
}

// ─── Writing ─────────────────────────────────────────────────────────────

export function WritingSkeleton() {
    return (
        <div style={{ paddingTop: 8 }}>
            <Skeleton width={140} height={24} style={{ marginBottom: 6 }} />
            <Skeleton width={200} height={14} style={{ marginBottom: 16 }} />
            {/* Stats row */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                    marginBottom: 16,
                }}
            >
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={60} borderRadius={12} />
                ))}
            </div>
            {/* Prompt cards */}
            {[1, 2, 3].map((i) => (
                <Skeleton
                    key={i}
                    width="100%"
                    height={80}
                    borderRadius={14}
                    style={{ marginBottom: 10 }}
                />
            ))}
        </div>
    );
}

// ─── Writing Result ──────────────────────────────────────────────────────

export function WritingResultSkeleton() {
    return (
        <div style={{ paddingTop: 8 }}>
            <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />
            {/* Score card */}
            <Skeleton
                width="100%"
                height={160}
                borderRadius={20}
                style={{ marginBottom: 12 }}
            />
            {/* Breakdown */}
            <Skeleton
                width="100%"
                height={120}
                borderRadius={16}
                style={{ marginBottom: 12 }}
            />
            {/* Feedback */}
            <Skeleton
                width="100%"
                height={200}
                borderRadius={16}
                style={{ marginBottom: 12 }}
            />
        </div>
    );
}

// ─── Exam Start ──────────────────────────────────────────────────────────

export function ExamStartSkeleton() {
    return (
        <div style={{ paddingTop: 8 }}>
            <Skeleton width={160} height={28} style={{ marginBottom: 6 }} />
            <Skeleton width={240} height={14} style={{ marginBottom: 20 }} />
            {/* Level picker */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[1, 2, 3].map((i) => (
                    <Skeleton
                        key={i}
                        width={64}
                        height={36}
                        borderRadius={10}
                    />
                ))}
            </div>
            {/* Mode cards */}
            {[1, 2, 3].map((i) => (
                <Skeleton
                    key={i}
                    width="100%"
                    height={90}
                    borderRadius={16}
                    style={{ marginBottom: 10 }}
                />
            ))}
        </div>
    );
}

// ─── Exam Result ─────────────────────────────────────────────────────────

export function ExamResultSkeleton() {
    return (
        <div style={{ paddingTop: 8 }}>
            <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />
            {/* Score circle */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
                <Skeleton
                    width={100}
                    height={100}
                    borderRadius="50%"
                    style={{ margin: "0 auto" }}
                />
            </div>
            {/* Section bars */}
            <Skeleton
                width="100%"
                height={120}
                borderRadius={16}
                style={{ marginBottom: 12 }}
            />
            {/* Stats */}
            <Skeleton
                width="100%"
                height={80}
                borderRadius={16}
                style={{ marginBottom: 12 }}
            />
        </div>
    );
}

// ─── Exam History ────────────────────────────────────────────────────────

export function ExamHistorySkeleton() {
    return (
        <div style={{ paddingTop: 8 }}>
            <Skeleton width={140} height={24} style={{ marginBottom: 16 }} />
            {/* Stats row */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                    marginBottom: 16,
                }}
            >
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={64} borderRadius={12} />
                ))}
            </div>
            {/* History items */}
            {[1, 2, 3, 4].map((i) => (
                <Skeleton
                    key={i}
                    width="100%"
                    height={60}
                    borderRadius={12}
                    style={{ marginBottom: 8 }}
                />
            ))}
        </div>
    );
}

// ─── Speak Memory ────────────────────────────────────────────────────────

export function SpeakMemorySkeleton() {
    return (
        <div style={{ paddingTop: 8 }}>
            <Skeleton width={160} height={24} style={{ marginBottom: 16 }} />
            {/* Memory cards */}
            {[1, 2, 3].map((i) => (
                <Skeleton
                    key={i}
                    width="100%"
                    height={80}
                    borderRadius={14}
                    style={{ marginBottom: 10 }}
                />
            ))}
        </div>
    );
}

// ─── Generic ─────────────────────────────────────────────────────────────

export function GenericPageSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div style={{ paddingTop: 8 }}>
            <Skeleton width={160} height={24} style={{ marginBottom: 16 }} />
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} />
            ))}
        </div>
    );
}
