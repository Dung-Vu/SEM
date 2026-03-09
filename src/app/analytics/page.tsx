"use client";

import { useEffect, useState, useCallback } from "react";
import { Brain, Loader2 } from "lucide-react";
import { BookOpen, Mic2, PenLine, Headphones } from "lucide-react";
import {
    OverallScoreBanner,
    SkillRadarConsistency,
    ActivityHeatmap,
    SkillVelocityList,
    PredictionCard,
    ActivityBarChart,
    WeaknessPanel,
    LevelPredictionCard,
    VelocityLineChart,
    AIInsightList,
    ActivityStream,
    WeeklyReportLink,
} from "@/components/Analytics";
import type {
    AnalyticsData,
    Insight,
    StreamEvent,
} from "@/components/Analytics";

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [recalculating, setRecalculating] = useState(false);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [generatingInsights, setGeneratingInsights] = useState(false);
    const [stream, setStream] = useState<StreamEvent[]>([]);
    const [hasUnreadReport, setHasUnreadReport] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [profileRes, insightsRes, streamRes, reportRes] =
                await Promise.all([
                    fetch("/api/analytics/profile"),
                    fetch("/api/analytics/insights"),
                    fetch("/api/analytics/activity-stream"),
                    fetch("/api/analytics/weekly-report"),
                ]);
            const profileJson = await profileRes.json();
            const insightsJson = await insightsRes.json();
            const streamJson = await streamRes.json();
            const reportJson = await reportRes.json();
            if (!profileJson.error) setData(profileJson);
            if (insightsJson.insights) setInsights(insightsJson.insights);
            if (streamJson.stream) setStream(streamJson.stream);
            if (reportJson.report && !reportJson.report.isRead)
                setHasUnreadReport(true);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRecalculate = async () => {
        setRecalculating(true);
        try {
            await fetch("/api/analytics/recalculate", { method: "POST" });
            await fetchData();
        } finally {
            setRecalculating(false);
        }
    };

    const handleRefreshInsights = async () => {
        setGeneratingInsights(true);
        try {
            const res = await fetch("/api/analytics/insights", {
                method: "POST",
            });
            const json = await res.json();
            if (json.insights) setInsights(json.insights);
        } finally {
            setGeneratingInsights(false);
        }
    };

    // ─── Loading ───
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
                <Loader2
                    size={28}
                    style={{
                        color: "var(--gold)",
                        animation: "spin 1s linear infinite",
                    }}
                />
            </div>
        );
    }

    // ─── Empty state ───
    if (!data) {
        return (
            <div
                style={{
                    minHeight: "100dvh",
                    background: "var(--bg-void)",
                    padding: "calc(env(safe-area-inset-top) + 24px) 20px 120px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    textAlign: "center",
                }}
            >
                <Brain
                    size={48}
                    style={{ color: "var(--text-muted)", marginBottom: 4 }}
                />
                <h2
                    style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-display)",
                        margin: 0,
                    }}
                >
                    Chưa đủ data để phân tích
                </h2>
                <p
                    style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        lineHeight: 1.7,
                        maxWidth: 300,
                        margin: 0,
                    }}
                >
                    ORACLE cần ít nhất 7 ngày data để velocity và insight có
                    nghĩa. Hãy học đều mỗi ngày:
                </p>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        width: "100%",
                        maxWidth: 280,
                        textAlign: "left",
                    }}
                >
                    {[
                        { icon: BookOpen, text: "Review Anki cards" },
                        { icon: Mic2, text: "Tập Speak với AI" },
                        { icon: PenLine, text: "Viết Journal" },
                        { icon: Headphones, text: "Shadow 15 phút" },
                    ].map(({ icon: Icon, text }) => (
                        <div
                            key={text}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 12px",
                                background: "var(--bg-raised)",
                                borderRadius: 10,
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <Icon
                                size={16}
                                style={{ color: "var(--gold)", flexShrink: 0 }}
                            />
                            <span
                                style={{
                                    fontSize: 13,
                                    color: "var(--text-secondary)",
                                }}
                            >
                                {text}
                            </span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleRecalculate}
                    disabled={recalculating}
                    style={{
                        marginTop: 8,
                        background: "var(--gold)",
                        color: "var(--bg-void)",
                        padding: "12px 24px",
                        borderRadius: 12,
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 14,
                        fontFamily: "var(--font-display)",
                    }}
                >
                    {recalculating ? "Đang tính..." : "Tính toán ngay"}
                </button>
            </div>
        );
    }

    // ─── Derived data ───
    const {
        profile,
        weaknesses,
        prediction,
        heatmap,
        weeklyActivity,
        velocityHistory,
        weeklyExp,
    } = data;

    const radarData = [
        { skill: "Vocab", value: profile.vocabScore, fullMark: 100 },
        { skill: "Speaking", value: profile.speakingScore, fullMark: 100 },
        { skill: "Listening", value: profile.listeningScore, fullMark: 100 },
        { skill: "Writing", value: profile.writingScore, fullMark: 100 },
        { skill: "Grammar", value: profile.grammarScore, fullMark: 100 },
    ];

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const barData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        return {
            day: weekDays[d.getDay()],
            min: weeklyActivity[key]?.totalMin ?? 0,
        };
    });

    const heatmapCells: { date: string; min: number }[] = [];
    for (let i = 89; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        heatmapCells.push({ date: key, min: heatmap[key]?.totalMin ?? 0 });
    }
    const heatmapWeeks: { date: string; min: number }[][] = [];
    for (let i = 0; i < heatmapCells.length; i += 7) {
        heatmapWeeks.push(heatmapCells.slice(i, i + 7));
    }

    const velocityCards = [
        { key: "vocab", score: profile.vocabScore, v: profile.vocabVelocity },
        {
            key: "speaking",
            score: profile.speakingScore,
            v: profile.speakingVelocity,
        },
        {
            key: "listening",
            score: profile.listeningScore,
            v: profile.listeningVelocity,
        },
        {
            key: "writing",
            score: profile.writingScore,
            v: profile.writingVelocity,
        },
        {
            key: "grammar",
            score: profile.grammarScore,
            v: profile.grammarVelocity,
        },
    ];

    const overallScore = Math.round(
        (profile.vocabScore +
            profile.speakingScore +
            profile.listeningScore +
            profile.writingScore +
            profile.grammarScore) /
            5,
    );
    const currentCEFR =
        overallScore >= 90
            ? "C2"
            : overallScore >= 80
              ? "C1"
              : overallScore >= 65
                ? "B2"
                : overallScore >= 50
                  ? "B1"
                  : overallScore >= 35
                    ? "A2"
                    : "A1";

    return (
        <div
            style={{
                minHeight: "100dvh",
                background: "var(--bg-void)",
                paddingBottom: 120,
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <p
                            style={{
                                fontSize: 10,
                                letterSpacing: "0.15em",
                                color: "var(--gold)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            ORACLE
                        </p>
                        <h1
                            style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                fontFamily: "var(--font-display)",
                                margin: 0,
                            }}
                        >
                            Analytics
                        </h1>
                    </div>
                    <button
                        onClick={handleRecalculate}
                        disabled={recalculating}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "var(--bg-raised)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 10,
                            padding: "8px 12px",
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            fontSize: 12,
                        }}
                    >
                        {recalculating ? (
                            <Loader2
                                size={14}
                                style={{ animation: "spin 1s linear infinite" }}
                            />
                        ) : (
                            <Brain size={14} />
                        )}
                        Recalculate
                    </button>
                </div>
            </div>

            <div style={{ padding: "16px 16px 0" }}>
                <OverallScoreBanner
                    profile={profile}
                    overallScore={overallScore}
                    currentCEFR={currentCEFR}
                    weeklyExp={weeklyExp}
                />

                <SkillRadarConsistency
                    profile={profile}
                    radarData={radarData}
                />

                <ActivityHeatmap heatmapWeeks={heatmapWeeks} />

                <SkillVelocityList velocityCards={velocityCards} />

                <PredictionCard prediction={prediction} />

                <ActivityBarChart barData={barData} />

                <WeaknessPanel weaknesses={weaknesses} />

                <LevelPredictionCard prediction={prediction} />

                <VelocityLineChart velocityHistory={velocityHistory} />

                <AIInsightList
                    insights={insights}
                    generating={generatingInsights}
                    onRefresh={handleRefreshInsights}
                />

                <ActivityStream stream={stream} />

                <WeeklyReportLink hasUnread={hasUnreadReport} />
            </div>
        </div>
    );
}
