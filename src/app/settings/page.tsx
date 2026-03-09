"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePushNotifications } from "@/app/hooks/usePushNotifications";
import {
    BarChart3,
    Trophy,
    ScrollText,
    TrendingUp,
    Plus,
    Download,
    BookMarked,
    Headphones,
    CalendarDays,
    Library,
    Settings2,
    Home,
    TreePine,
    Castle,
    Swords,
    Crown,
    Sun,
    Moon,
} from "lucide-react";

interface Settings {
    ankiNewCardsPerDay: number;
    ankiReviewLimit: number;
    reminderTime: string;
    notificationsEnabled: boolean;
}

const KT = [
    {
        level: "1-5",
        name: "Beginner Village",
        tier: "A1-A2",
        exp: "0 – 555",
        icon: Home,
        color: "var(--cyan)",
    },
    {
        level: "6-10",
        name: "Grammar Forest",
        tier: "A2-B1",
        exp: "555 – 5,000",
        icon: TreePine,
        color: "var(--emerald)",
    },
    {
        level: "11-15",
        name: "Fluency Castle",
        tier: "B1-B2",
        exp: "5k – 20k",
        icon: Castle,
        color: "var(--gold)",
    },
    {
        level: "16-20",
        name: "IELTS Arena",
        tier: "B2-C1",
        exp: "20k – 120k",
        icon: Swords,
        color: "var(--ruby)",
    },
    {
        level: "21+",
        name: "Legend Realm",
        tier: "C1-C2",
        exp: "120k+ EXP",
        icon: Crown,
        color: "var(--violet)",
    },
];

const QUICK_LINKS = [
    {
        href: "/progress",
        icon: BarChart3,
        label: "Progress",
        color: "var(--cyan)",
    },
    {
        href: "/achievements",
        icon: Trophy,
        label: "Achievements",
        color: "var(--gold)",
    },
    {
        href: "/log",
        icon: ScrollText,
        label: "Activity Log",
        color: "var(--text-muted)",
    },
    {
        href: "/stats/weekly",
        icon: TrendingUp,
        label: "Weekly Stats",
        color: "var(--emerald)",
    },
    { href: "/anki/add", icon: Plus, label: "Add Words", color: "var(--cyan)" },
    {
        href: "/anki/import",
        icon: Download,
        label: "Bulk Import",
        color: "var(--violet)",
    },
    {
        href: "/reading",
        icon: BookMarked,
        label: "Reading",
        color: "var(--gold)",
    },
    {
        href: "/shadow",
        icon: Headphones,
        label: "Shadowing",
        color: "var(--ruby)",
    },
    {
        href: "/review/monthly",
        icon: CalendarDays,
        label: "Monthly",
        color: "var(--amber)",
    },
    {
        href: "/resources",
        icon: Library,
        label: "Resources",
        color: "var(--emerald)",
    },
];

function SectionHeader({ color, title }: { color: string; title: string }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
            }}
        >
            <div
                style={{
                    width: 3,
                    height: 14,
                    borderRadius: 99,
                    background: color,
                    flexShrink: 0,
                }}
            />
            <h3
                style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                }}
            >
                {title}
            </h3>
        </div>
    );
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            style={{
                width: 48,
                height: 26,
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                background: on
                    ? "linear-gradient(to right, var(--gold-muted), var(--gold))"
                    : "var(--bg-raised)",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
                boxShadow: on ? "0 0 8px rgba(245,200,66,0.3)" : "none",
            }}
        >
            <div
                style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--bg-surface)",

                    position: "absolute",
                    top: 3,
                    left: on ? 25 : 3,
                    transition: "left 0.2s",
                }}
            />
        </button>
    );
}

function PushNotificationCard() {
    const { status, loading, subscribe, unsubscribe } = usePushNotifications();

    const statusConfig = {
        unsupported: {
            label: "Not supported",
            color: "var(--text-muted)",
        },
        denied: {
            label: "Blocked by browser",
            color: "var(--ruby)",
        },
        subscribed: { label: "Active", color: "var(--emerald)" },
        granted: {
            label: "Ready to enable",
            color: "var(--gold)",
        },
        default: {
            label: "Not enabled",
            color: "var(--text-muted)",
        },
    };
    const cfg = statusConfig[status];

    return (
        <div
            className="glass-card animate-fade-in-up stagger-1"
            style={{ padding: "16px", marginBottom: "12px" }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                }}
            >
                <div
                    style={{
                        width: 3,
                        height: 14,
                        borderRadius: 99,
                        background: "var(--violet)",
                        flexShrink: 0,
                    }}
                />
                <h3
                    style={{
                        margin: 0,
                        fontFamily: "var(--font-display)",
                        fontSize: "12px",
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                    }}
                >
                    Push Notifications
                </h3>
            </div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontFamily: "var(--font-body)",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                        }}
                    >
                        Study Reminders
                    </p>
                    <p
                        style={{
                            margin: "2px 0 0",
                            fontFamily: "var(--font-body)",
                            fontSize: "12px",
                            color: "var(--text-muted)",
                        }}
                    >
                        {cfg.label}
                    </p>
                </div>
                {status !== "unsupported" && status !== "denied" && (
                    <button
                        onClick={
                            status === "subscribed" ? unsubscribe : subscribe
                        }
                        disabled={loading}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 99,
                            border: `1px solid ${status === "subscribed" ? "var(--ruby-muted)" : "var(--violet-muted)"}`,
                            background:
                                status === "subscribed"
                                    ? "var(--ruby-dim)"
                                    : "var(--violet-dim)",
                            color:
                                status === "subscribed"
                                    ? "var(--ruby)"
                                    : "var(--violet)",
                            fontFamily: "var(--font-body)",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: loading ? "default" : "pointer",
                            opacity: loading ? 0.6 : 1,
                            transition: "all 0.2s",
                            flexShrink: 0,
                        }}
                    >
                        {loading
                            ? "..."
                            : status === "subscribed"
                              ? "Disable"
                              : "Enable"}
                    </button>
                )}
                {status === "denied" && (
                    <span
                        style={{
                            fontSize: "11px",
                            color: "var(--ruby)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        Allow in browser settings
                    </span>
                )}
            </div>
            <p
                style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.5,
                }}
            >
                Receive daily reminders, streak alerts, and Weekly Boss
                notifications. Requires HTTPS.
            </p>
        </div>
    );
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        ankiNewCardsPerDay: 15,
        ankiReviewLimit: 50,
        reminderTime: "08:00",
        notificationsEnabled: false,
    });
    const [aiModel, setAiModel] = useState("qwen3.5-plus");
    const [toast, setToast] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    useEffect(() => {
        const stored = localStorage.getItem("eq-settings");
        if (stored) setSettings(JSON.parse(stored));
        setAiModel(localStorage.getItem("eq-ai-model") ?? "qwen3.5-plus");
        setTheme(
            (localStorage.getItem("eq-theme") ?? "dark") as "dark" | "light",
        );
    }, []);

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("eq-theme", next);
        document.documentElement.setAttribute("data-theme", next);
        setToast(next === "light" ? "Light Mode" : "Dark Mode");
        setTimeout(() => setToast(null), 2000);
    };

    const save = useCallback((newSettings: Settings) => {
        setSettings(newSettings);
        // Merge with existing localStorage to preserve ttsVoice, ttsRate, autoPlayAnki etc.
        const existing = JSON.parse(
            localStorage.getItem("eq-settings") || "{}",
        );
        localStorage.setItem(
            "eq-settings",
            JSON.stringify({ ...existing, ...newSettings }),
        );
        setToast("Settings saved");
        setTimeout(() => setToast(null), 2000);
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try {
            const [userRes, wordsRes, journalRes] = await Promise.all([
                fetch("/api/progress"),
                fetch("/api/anki/words"),
                fetch("/api/journal"),
            ]);
            const exportData = {
                exportedAt: new Date().toISOString(),
                user: (await userRes.json()).user,
                words: (await wordsRes.json()).words,
                journal: (await journalRes.json()).entries,
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `english-quest-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setToast("📦 Data exported!");
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast("Error exporting");
            setTimeout(() => setToast(null), 3000);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div style={{ paddingTop: "8px", paddingBottom: "16px" }}>
            {toast &&
                typeof document !== "undefined" &&
                createPortal(
                    <div className="toast animate-scale-in">
                        <div
                            className="glass-card"
                            style={{
                                padding: "13px 18px",
                                borderColor: "rgba(52,211,153,0.3)",
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
                                {toast}
                            </p>
                        </div>
                    </div>,
                    document.body,
                )}

            {/* Header */}
            <div
                className="animate-fade-in-up"
                style={{ marginBottom: "20px" }}
            >
                <h1
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "22px",
                        fontWeight: 800,
                        margin: "0 0 4px",
                    }}
                >
                    <Settings2
                        size={20}
                        color="var(--text-muted)"
                        strokeWidth={2}
                        style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: "6px",
                        }}
                    />
                    Settings
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        margin: 0,
                    }}
                >
                    Customize your learning experience
                </p>
            </div>

            {/* Appearance */}
            <div
                className="glass-card animate-fade-in-up stagger-1"
                style={{ padding: "16px", marginBottom: "12px" }}
            >
                <SectionHeader color="var(--violet)" title="Appearance" />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: 0,
                                fontFamily: "var(--font-body)",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "var(--text-primary)",
                            }}
                        >
                            {theme === "dark" ? "Dark Mode" : "Light Mode"}
                        </p>
                        <p
                            style={{
                                margin: "2px 0 0",
                                fontFamily: "var(--font-body)",
                                fontSize: "12px",
                                color: "var(--text-muted)",
                            }}
                        >
                            {theme === "dark"
                                ? "Premium dark RPG theme"
                                : "Clean light interface"}
                        </p>
                    </div>
                    <ToggleSwitch
                        on={theme === "light"}
                        onToggle={toggleTheme}
                    />
                </div>
            </div>

            {/* Push Notifications */}
            <PushNotificationCard />

            {/* Anki */}
            <div
                className="glass-card animate-fade-in-up stagger-1"
                style={{ padding: "16px", marginBottom: "12px" }}
            >
                <SectionHeader color="var(--gold)" title="Anki" />

                <label
                    style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        display: "block",
                        marginBottom: "6px",
                    }}
                >
                    New cards per day
                </label>
                <div
                    style={{
                        display: "flex",
                        gap: "6px",
                        marginBottom: "14px",
                    }}
                >
                    {[5, 10, 15, 20, 30].map((n) => (
                        <button
                            key={n}
                            onClick={() =>
                                save({ ...settings, ankiNewCardsPerDay: n })
                            }
                            style={{
                                flex: 1,
                                padding: "9px 4px",
                                borderRadius: "10px",
                                cursor: "pointer",
                                fontFamily: "var(--font-mono)",
                                fontSize: "13px",
                                fontWeight: 600,
                                background:
                                    settings.ankiNewCardsPerDay === n
                                        ? "rgba(107,90,42,0.5)"
                                        : "var(--bg-raised)",
                                color:
                                    settings.ankiNewCardsPerDay === n
                                        ? "var(--gold)"
                                        : "var(--text-muted)",
                                border: `1px solid ${settings.ankiNewCardsPerDay === n ? "rgba(245,200,66,0.3)" : "transparent"}`,
                                transition: "all 0.15s",
                            }}
                        >
                            {n}
                        </button>
                    ))}
                </div>

                <label
                    style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        display: "block",
                        marginBottom: "6px",
                    }}
                >
                    Review limit per session
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                    {[20, 30, 50, 100].map((n) => (
                        <button
                            key={n}
                            onClick={() =>
                                save({ ...settings, ankiReviewLimit: n })
                            }
                            style={{
                                flex: 1,
                                padding: "9px 4px",
                                borderRadius: "10px",
                                cursor: "pointer",
                                fontFamily: "var(--font-mono)",
                                fontSize: "13px",
                                fontWeight: 600,
                                background:
                                    settings.ankiReviewLimit === n
                                        ? "rgba(107,90,42,0.5)"
                                        : "var(--bg-raised)",
                                color:
                                    settings.ankiReviewLimit === n
                                        ? "var(--gold)"
                                        : "var(--text-muted)",
                                border: `1px solid ${settings.ankiReviewLimit === n ? "rgba(245,200,66,0.3)" : "transparent"}`,
                                transition: "all 0.15s",
                            }}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>

            {/* TTS / Audio */}
            <div
                className="glass-card animate-fade-in-up stagger-2"
                style={{ padding: "16px", marginBottom: "12px" }}
            >
                <SectionHeader color="var(--cyan)" title="Audio / TTS" />

                <label
                    style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        display: "block",
                        marginBottom: "6px",
                    }}
                >
                    Voice accent
                </label>
                <div
                    style={{
                        display: "flex",
                        gap: "6px",
                        marginBottom: "14px",
                    }}
                >
                    {(
                        [
                            { value: "en-US", label: "🇺🇸 US" },
                            { value: "en-GB", label: "🇬🇧 UK" },
                            { value: "en-AU", label: "🇦🇺 AU" },
                        ] as const
                    ).map((v) => {
                        const current = (() => {
                            try {
                                return (
                                    JSON.parse(
                                        localStorage.getItem("eq-settings") ||
                                            "{}",
                                    ).ttsVoice ?? "en-US"
                                );
                            } catch {
                                return "en-US";
                            }
                        })();
                        const isSelected = current === v.value;
                        return (
                            <button
                                key={v.value}
                                onClick={() => {
                                    const s = JSON.parse(
                                        localStorage.getItem("eq-settings") ||
                                            "{}",
                                    );
                                    s.ttsVoice = v.value;
                                    localStorage.setItem(
                                        "eq-settings",
                                        JSON.stringify(s),
                                    );
                                    save({ ...settings });
                                }}
                                style={{
                                    flex: 1,
                                    padding: "9px 4px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontFamily: "var(--font-body)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    background: isSelected
                                        ? "rgba(10,48,64,0.5)"
                                        : "var(--bg-raised)",
                                    color: isSelected
                                        ? "var(--cyan)"
                                        : "var(--text-muted)",
                                    border: `1px solid ${isSelected ? "rgba(34,211,238,0.3)" : "transparent"}`,
                                    transition: "all 0.15s",
                                }}
                            >
                                {v.label}
                            </button>
                        );
                    })}
                </div>

                <label
                    style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                        display: "block",
                        marginBottom: "6px",
                    }}
                >
                    Speech speed
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                    {(
                        [
                            { value: 0.7, label: "0.7×", desc: "Slow" },
                            { value: 0.85, label: "0.85×", desc: "Medium" },
                            { value: 1.0, label: "1.0×", desc: "Native" },
                        ] as const
                    ).map((s) => {
                        const curRate = (() => {
                            try {
                                return (
                                    JSON.parse(
                                        localStorage.getItem("eq-settings") ||
                                            "{}",
                                    ).ttsRate ?? 0.9
                                );
                            } catch {
                                return 0.9;
                            }
                        })();
                        const isSelected = Math.abs(curRate - s.value) < 0.05;
                        return (
                            <button
                                key={s.value}
                                onClick={() => {
                                    const st = JSON.parse(
                                        localStorage.getItem("eq-settings") ||
                                            "{}",
                                    );
                                    st.ttsRate = s.value;
                                    localStorage.setItem(
                                        "eq-settings",
                                        JSON.stringify(st),
                                    );
                                    save({ ...settings });
                                }}
                                style={{
                                    flex: 1,
                                    padding: "9px 4px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    textAlign: "center",
                                    background: isSelected
                                        ? "rgba(10,48,64,0.5)"
                                        : "var(--bg-raised)",
                                    color: isSelected
                                        ? "var(--cyan)"
                                        : "var(--text-muted)",
                                    border: `1px solid ${isSelected ? "rgba(34,211,238,0.3)" : "transparent"}`,
                                    transition: "all 0.15s",
                                }}
                            >
                                <div>{s.label}</div>
                                <div
                                    style={{
                                        fontSize: "9px",
                                        marginTop: "2px",
                                        opacity: 0.7,
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    {s.desc}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Auto-play toggle */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "14px",
                        padding: "10px 0 0",
                        borderTop: "1px solid var(--border-subtler)",
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: 600,
                                fontFamily: "var(--font-body)",
                                color: "var(--text-secondary)",
                            }}
                        >
                            Auto-play on Anki reveal
                        </p>
                        <p
                            style={{
                                margin: "2px 0 0",
                                fontSize: "10px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            Speak word pronunciation when answer shows
                        </p>
                    </div>
                    <ToggleSwitch
                        on={(() => {
                            try {
                                return (
                                    JSON.parse(
                                        localStorage.getItem("eq-settings") ||
                                            "{}",
                                    ).autoPlayAnki ?? false
                                );
                            } catch {
                                return false;
                            }
                        })()}
                        onToggle={() => {
                            const s = JSON.parse(
                                localStorage.getItem("eq-settings") || "{}",
                            );
                            s.autoPlayAnki = !s.autoPlayAnki;
                            localStorage.setItem(
                                "eq-settings",
                                JSON.stringify(s),
                            );
                            save({ ...settings });
                        }}
                    />
                </div>
            </div>

            {/* Notifications */}
            <div
                className="glass-card animate-fade-in-up stagger-2"
                style={{ padding: "16px", marginBottom: "12px" }}
            >
                <SectionHeader color="var(--violet)" title="Notifications" />
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: settings.notificationsEnabled
                            ? "14px"
                            : "0",
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: "0 0 2px",
                                fontSize: "13px",
                                fontFamily: "var(--font-body)",
                                color: "var(--text-primary)",
                            }}
                        >
                            Enable reminders
                        </p>
                        <p
                            style={{
                                margin: 0,
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            Daily study reminder
                        </p>
                    </div>
                    <ToggleSwitch
                        on={settings.notificationsEnabled}
                        onToggle={() =>
                            save({
                                ...settings,
                                notificationsEnabled:
                                    !settings.notificationsEnabled,
                            })
                        }
                    />
                </div>
                {settings.notificationsEnabled && (
                    <div>
                        <label
                            style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                display: "block",
                                marginBottom: "6px",
                                fontFamily: "var(--font-body)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                            }}
                        >
                            Reminder time
                        </label>
                        <input
                            type="time"
                            value={settings.reminderTime}
                            onChange={(e) =>
                                save({
                                    ...settings,
                                    reminderTime: e.target.value,
                                })
                            }
                            style={{
                                padding: "10px 12px",
                                background: "var(--bg-raised)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "12px",
                                color: "var(--text-primary)",
                                fontSize: "16px",
                                fontFamily: "var(--font-mono)",
                                outline: "none",
                            }}
                        />
                    </div>
                )}
            </div>

            {/* AI */}
            <div
                className="glass-card animate-fade-in-up stagger-3"
                style={{ padding: "16px", marginBottom: "12px" }}
            >
                <SectionHeader color="var(--violet)" title="AI Model" />
                <div
                    style={{
                        display: "flex",
                        gap: "6px",
                        marginBottom: "10px",
                    }}
                >
                    {["qwen3.5-plus", "qwen3-max", "qwen-turbo"].map(
                        (model) => (
                            <button
                                key={model}
                                onClick={() => {
                                    localStorage.setItem("eq-ai-model", model);
                                    setAiModel(model);
                                    setToast(`Model: ${model}`);
                                    setTimeout(() => setToast(null), 2000);
                                }}
                                style={{
                                    flex: 1,
                                    padding: "9px 4px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    background:
                                        aiModel === model
                                            ? "rgba(30,10,60,0.6)"
                                            : "var(--bg-raised)",
                                    color:
                                        aiModel === model
                                            ? "var(--violet)"
                                            : "var(--text-muted)",
                                    border: `1px solid ${aiModel === model ? "rgba(167,139,250,0.3)" : "transparent"}`,
                                    transition: "all 0.15s",
                                }}
                            >
                                {model
                                    .replace("qwen", "Q")
                                    .replace("-plus", "+")
                                    .replace("-max", "★")
                                    .replace("-turbo", "⚡")}
                            </button>
                        ),
                    )}
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--emerald)",
                            display: "inline-block",
                            boxShadow: "0 0 6px var(--emerald)",
                        }}
                    />
                    <span
                        style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        Bailian API · Connected
                    </span>
                </div>
            </div>

            {/* Quick Links */}
            <div
                className="glass-card animate-fade-in-up stagger-4"
                style={{ padding: "16px", marginBottom: "12px" }}
            >
                <SectionHeader color="var(--cyan)" title="Quick Links" />
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px",
                    }}
                >
                    {QUICK_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 12px",
                                borderRadius: "12px",
                                textDecoration: "none",
                                background: "var(--bg-raised)",
                                border: "1px solid rgba(255,255,255,0.04)",
                                transition: "background 0.15s",
                            }}
                        >
                            <link.icon
                                size={16}
                                color={link.color}
                                strokeWidth={2}
                            />
                            <span
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: link.color,
                                    fontFamily: "var(--font-body)",
                                }}
                            >
                                {link.label}
                            </span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Kingdom Thresholds */}
            <div
                className="glass-card animate-fade-in-up"
                style={{ padding: "16px", marginBottom: "12px" }}
            >
                <SectionHeader color="var(--gold)" title="Kingdom Thresholds" />
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0",
                    }}
                >
                    {KT.map((k, i) => (
                        <div
                            key={k.name}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px 0",
                                borderBottom:
                                    i < KT.length - 1
                                        ? "1px solid rgba(255,255,255,0.04)"
                                        : "none",
                            }}
                        >
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "24px",
                                }}
                            >
                                <k.icon
                                    size={18}
                                    color={k.color}
                                    strokeWidth={2}
                                />
                            </span>
                            <div style={{ flex: 1 }}>
                                <p
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        margin: "0 0 1px",
                                        fontFamily: "var(--font-body)",
                                        color: k.color,
                                    }}
                                >
                                    {k.name}
                                </p>
                                <p
                                    style={{
                                        fontSize: "10px",
                                        color: "var(--text-muted)",
                                        margin: 0,
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    Lv.{k.level} · {k.tier}
                                </p>
                            </div>
                            <span
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "10px",
                                    color: "var(--text-muted)",
                                }}
                            >
                                {k.exp}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Export */}
            <div
                className="glass-card animate-fade-in-up"
                style={{ padding: "16px", marginBottom: "16px" }}
            >
                <SectionHeader color="var(--emerald)" title="Data Export" />
                <p
                    style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                        margin: "0 0 12px",
                    }}
                >
                    Export all your data as JSON backup
                </p>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="btn-primary"
                >
                    {exporting ? "Exporting..." : "📦 Export All Data (JSON)"}
                </button>
            </div>

            <p
                style={{
                    textAlign: "center",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-body)",
                }}
            >
                SEM v1.0 · Built with ❤️
            </p>
        </div>
    );
}
