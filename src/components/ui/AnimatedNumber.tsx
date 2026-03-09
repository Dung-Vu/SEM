"use client";

import { useEffect, useState, useRef } from "react";

/**
 * AnimatedNumber — smoothly count from old value to new value.
 * Uses requestAnimationFrame with easeOutCubic for satisfying deceleration.
 * Use for: EXP counters, scores, streak counts, percentages.
 */
export function AnimatedNumber({
    value,
    duration = 600,
    style,
    className,
    format,
}: {
    value: number;
    duration?: number;
    style?: React.CSSProperties;
    className?: string;
    format?: (n: number) => string;
}) {
    const [display, setDisplay] = useState(value);
    const prevRef = useRef(value);

    useEffect(() => {
        const start = prevRef.current;
        const end = value;
        prevRef.current = value;

        if (start === end) return;

        const startTime = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutCubic — fast start, smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }, [value, duration]);

    return (
        <span style={style} className={className}>
            {format ? format(display) : display.toLocaleString()}
        </span>
    );
}
