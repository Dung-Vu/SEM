"use client";

import { useState, useCallback } from "react";

// ── EXP Float particle ──────────────────────────────────────────────────────
interface FloatParticle {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
}

let nextId = 0;

// Custom hook — call triggerFloat(amount, element, color?) from any action
export function useExpFloat() {
    const [particles, setParticles] = useState<FloatParticle[]>([]);

    const triggerFloat = useCallback(
        (
            amount: number,
            element?: Element | null,
            color: string = "var(--gold)",
        ) => {
            // Get position: center-top of the triggering element, or viewport center
            const rect = element?.getBoundingClientRect();
            const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
            const y = rect ? rect.top - 4 : window.innerHeight / 2;

            const id = ++nextId;
            const particle: FloatParticle = {
                id,
                text: `+${amount} EXP`,
                x,
                y,
                color,
            };

            setParticles((prev) => [...prev, particle]);
            // Remove after animation completes (1.4s)
            setTimeout(() => {
                setParticles((prev) => prev.filter((p) => p.id !== id));
            }, 1400);
        },
        [],
    );

    return { particles, triggerFloat };
}

// Component — render at root level (inside AppShell)
export function ExpFloatLayer({ particles }: { particles: FloatParticle[] }) {
    return (
        <>
            {particles.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: "fixed",
                        left: p.x,
                        top: p.y,
                        zIndex: 9000,
                        pointerEvents: "none",
                        // floatUpFade uses translateX(-50%) to center on x
                        animation: "floatUpFade 1.3s ease-out forwards",
                        fontFamily: "var(--font-display)",
                        fontSize: "16px",
                        fontWeight: 800,
                        color: p.color,
                        textShadow: `0 0 12px ${p.color}80`,
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                        // center on x
                        transform: "translateX(-50%)",
                    }}
                >
                    {p.text}
                </div>
            ))}
        </>
    );
}
