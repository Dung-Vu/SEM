"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import { haptic } from "@/lib/haptics";
import {
    Home,
    BookOpen,
    Mic2,
    Swords,
    LayoutGrid,
    BarChart3,
    Trophy,
    PenLine,
    PenTool,
    ClipboardCheck,
    BookMarked,
    Headphones,
    Compass,
    Activity,
    Settings2,
    X,
} from "lucide-react";
import { QuickAddWord } from "./QuickAddWord";
import { PageTransition } from "./Motion";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-shell">
            <main className="app-content">
                <PageTransition>{children}</PageTransition>
            </main>
            <QuickAddWord />
            <BottomNav />
        </div>
    );
}

const MAIN_TABS = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/anki", icon: BookOpen, label: "Anki" },
    { href: "/speak", icon: Mic2, label: "Speak" },
    { href: "/quests", icon: Swords, label: "Quests" },
] as const;

interface MoreItem {
    href: string;
    icon: React.ComponentType<{
        size?: number;
        color?: string;
        strokeWidth?: number;
    }>;
    label: string;
    color: string;
}

const MORE_ITEMS: MoreItem[] = [
    {
        href: "/progress",
        icon: BarChart3,
        label: "Progress",
        color: "var(--cyan)",
    },
    {
        href: "/achievements",
        icon: Trophy,
        label: "Awards",
        color: "var(--gold)",
    },
    {
        href: "/journal",
        icon: PenLine,
        label: "Journal",
        color: "var(--violet)",
    },
    {
        href: "/analytics",
        icon: BarChart3,
        label: "Oracle",
        color: "var(--gold)",
    },
    {
        href: "/reading",
        icon: BookMarked,
        label: "Reading",
        color: "var(--violet-bright)",
    },
    {
        href: "/shadow",
        icon: Headphones,
        label: "Shadow",
        color: "var(--emerald)",
    },
    {
        href: "/resources",
        icon: Compass,
        label: "Hub",
        color: "var(--emerald)",
    },
    {
        href: "/writing",
        icon: PenTool,
        label: "Writing",
        color: "var(--cyan)",
    },
    {
        href: "/exam",
        icon: ClipboardCheck,
        label: "Exam",
        color: "var(--amber)",
    },
    { href: "/log", icon: Activity, label: "Activity", color: "var(--amber)" },
    {
        href: "/settings",
        icon: Settings2,
        label: "Settings",
        color: "var(--text-secondary)",
    },
];

function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [showMore, setShowMore] = useState(false);

    const prefetchPage = useCallback(
        (href: string) => {
            router.prefetch(href);
        },
        [router],
    );

    const isMoreActive = MORE_ITEMS.some((item) => item.href === pathname);

    return (
        <>
            {/* More Drawer */}
            {showMore && (
                <>
                    <div
                        className="more-drawer-backdrop"
                        onClick={() => setShowMore(false)}
                        style={{ zIndex: 1000 }}
                    />
                    <div className="more-drawer" style={{ zIndex: 1001 }}>
                        <div className="more-drawer-handle" />
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "20px",
                            }}
                        >
                            <p
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    letterSpacing: "0.12em",
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase",
                                    margin: 0,
                                }}
                            >
                                More Features
                            </p>
                            <button
                                onClick={() => setShowMore(false)}
                                style={{
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: "50%",
                                    width: 28,
                                    height: 28,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "var(--text-muted)",
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: "10px",
                            }}
                        >
                            {MORE_ITEMS.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setShowMore(false)}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "12px 4px 10px",
                                            borderRadius: "16px",
                                            textDecoration: "none",
                                            background: isActive
                                                ? "rgba(245,166,35,0.08)"
                                                : "var(--bg-elevated)",
                                            border: isActive
                                                ? "1px solid var(--border-gold)"
                                                : "1px solid var(--border-subtle)",
                                            transition:
                                                "all 0.15s var(--ease-spring)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: "12px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: isActive
                                                    ? "rgba(245,166,35,0.12)"
                                                    : "var(--bg-raised)",
                                            }}
                                        >
                                            <Icon
                                                size={20}
                                                color={
                                                    isActive
                                                        ? "var(--gold)"
                                                        : item.color
                                                }
                                                strokeWidth={2}
                                            />
                                        </div>
                                        <span
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                color: isActive
                                                    ? "var(--gold)"
                                                    : "var(--text-muted)",
                                                fontFamily: "var(--font-body)",
                                                letterSpacing: "0.01em",
                                            }}
                                        >
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Nav Bar — Floating Pill */}
            <nav className="bottom-nav">
                <div className="bottom-nav-pill">
                    {MAIN_TABS.map((tab) => {
                        const isActive = pathname === tab.href;
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`nav-tab${isActive ? " nav-tab-active" : ""}`}
                                onTouchStart={() => prefetchPage(tab.href)}
                                onMouseEnter={() => prefetchPage(tab.href)}
                                onClick={() => haptic("light")}
                                style={{
                                    color: isActive
                                        ? "var(--gold)"
                                        : "var(--text-muted)",
                                }}
                            >
                                <span className="nav-tab-icon">
                                    <Icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                </span>
                                <span className="nav-tab-label">
                                    {tab.label}
                                </span>
                                <span className="nav-tab-dot" />
                            </Link>
                        );
                    })}

                    {/* More Tab */}
                    <button
                        onClick={() => setShowMore((v) => !v)}
                        className={`nav-tab${isMoreActive || showMore ? " nav-tab-active" : ""}`}
                        style={{
                            color:
                                isMoreActive || showMore
                                    ? "var(--gold)"
                                    : "var(--text-muted)",
                        }}
                    >
                        <span className="nav-tab-icon">
                            <LayoutGrid
                                size={22}
                                strokeWidth={isMoreActive || showMore ? 2.5 : 2}
                            />
                        </span>
                        <span className="nav-tab-label">More</span>
                        <span className="nav-tab-dot" />
                    </button>
                </div>
            </nav>
        </>
    );
}
