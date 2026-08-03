"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { ElementType } from "react";
import { usePathname } from "next/navigation";

const variants = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

const spring = {
    type: "spring" as const,
    stiffness: 380,
    damping: 32,
    mass: 0.7,
};

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const prefersReduced = useReducedMotion();

    return (
        <AnimatePresence mode="wait" initial={!prefersReduced}>
            <motion.div
                key={pathname}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={prefersReduced ? { duration: 0 } : spring}
                style={{
                    willChange: prefersReduced ? undefined : "opacity, transform",
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

/** Staggered children container */
export function StaggerList({
    children,
    className,
    style,
    staggerDelay = 0.06,
}: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    staggerDelay?: number;
}) {
    return (
        <motion.div
            className={className}
            style={style}
            initial="hidden"
            animate="visible"
            variants={{
                visible: {
                    transition: { staggerChildren: staggerDelay },
                },
            }}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({
    children,
    style,
    className,
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}) {
    return (
        <motion.div
            className={className}
            style={style}
            variants={{
                hidden: { opacity: 0, y: 16 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 400, damping: 30 },
                },
            }}
        >
            {children}
        </motion.div>
    );
}

// Pre-bound motion components — avoids creating components during render
// (which would also reset state on every render and fail the
// react/no-unstable-nested-components / no-static-component-rules lint).
const motionComponents = {
    div: motion.div,
    button: motion.button,
    a: motion.a,
    span: motion.span,
    li: motion.li,
    section: motion.section,
    article: motion.article,
} as const;

type SupportedAs = keyof typeof motionComponents;

/** Pressable — subtle scale on press, spring on release */
export function Pressable({
    children,
    onClick,
    className,
    style,
    as,
    href,
    type,
    disabled,
    ariaLabel,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
    as?: ElementType;
    href?: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    ariaLabel?: string;
}) {
    const requested = (as ?? "div") as string;
    const key: SupportedAs = (Object.prototype.hasOwnProperty.call(motionComponents, requested)
        ? requested
        : "div") as SupportedAs;
    const MotionTag = motionComponents[key];
    const prefersReduced = useReducedMotion();

    // Pass through only the relevant props per element type.
    const passthrough: Record<string, unknown> = {
        className,
        style,
        onClick,
        onTap: onClick,
    };
    if (!prefersReduced) {
        passthrough.whileTap = { scale: 0.94 };
        passthrough.transition = { type: "spring", stiffness: 600, damping: 24 };
    }
    if (key === "a") passthrough.href = href;
    if (key === "button") {
        passthrough.type = type ?? "button";
        passthrough.disabled = disabled;
    }
    if (ariaLabel) passthrough["aria-label"] = ariaLabel;

    // The passthrough object is built dynamically (one branch per element
    // type), so the runtime is correct but TypeScript cannot narrow
    // MotionTag's element-specific props from a Record<string, unknown>.
    // We pin the component type to a generic ElementType first so the spread
    // is type-safe without `any`.
    const Tag = MotionTag as ElementType;
    return <Tag {...passthrough}>{children}</Tag>;
}

