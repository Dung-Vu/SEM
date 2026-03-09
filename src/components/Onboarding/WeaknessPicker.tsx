"use client";

import { BookOpen, Mic2, Zap, Target } from "lucide-react";

const WEAKNESS_OPTIONS = [
    {
        key: "vocabulary",
        icon: BookOpen,
        label: "Vocabulary",
        desc: "Thiếu từ vựng",
    },
    { key: "speaking", icon: Mic2, label: "Speaking", desc: "Ngại nói" },
    { key: "listening", icon: Zap, label: "Listening", desc: "Nghe chưa tốt" },
    { key: "writing", icon: Target, label: "Writing", desc: "Viết yếu" },
] as const;

export type WeaknessKey = (typeof WEAKNESS_OPTIONS)[number]["key"];

interface Props {
    weakness: WeaknessKey;
    onChange: (key: WeaknessKey) => void;
}

export function WeaknessPicker({ weakness, onChange }: Props) {
    return (
        <div style={{ marginTop: "16px", width: "100%", maxWidth: "340px" }}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                }}
            >
                {WEAKNESS_OPTIONS.map((w) => {
                    const WIcon = w.icon;
                    const isSel = weakness === w.key;
                    return (
                        <button
                            key={w.key}
                            onClick={() => onChange(w.key)}
                            style={{
                                padding: "16px 10px",
                                borderRadius: "16px",
                                cursor: "pointer",
                                textAlign: "center",
                                transition: "all 0.15s var(--ease-spring)",
                                border: `2px solid ${isSel ? "var(--ruby)" : "var(--border-subtle)"}`,
                                background: isSel
                                    ? "rgba(239,68,68,0.08)"
                                    : "var(--bg-elevated)",
                                transform: isSel ? "scale(1.03)" : "scale(1)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <WIcon
                                size={24}
                                color={
                                    isSel ? "var(--ruby)" : "var(--text-muted)"
                                }
                            />
                            <div
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    color: isSel
                                        ? "var(--ruby)"
                                        : "var(--text-primary)",
                                }}
                            >
                                {w.label}
                            </div>
                            <div
                                style={{
                                    fontSize: "10px",
                                    opacity: 0.65,
                                    fontFamily: "var(--font-body)",
                                    color: "var(--text-muted)",
                                }}
                            >
                                {w.desc}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
