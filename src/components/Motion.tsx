"use client";

import { motion, AnimatePresence } from "framer-motion";
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

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={spring}
                style={{
                    willChange: "opacity, transform",
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

/** Pressable — subtle scale on press, spring on release */
export function Pressable({
    children,
    onClick,
    className,
    style,
    as: Tag = "div",
}: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    as?: string;
}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MotionTag = motion[Tag as keyof typeof motion] as any;
    return (
        <MotionTag
            className={className}
            style={style}
            onClick={onClick}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 600, damping: 24 }}
        >
            {children}
        </MotionTag>
    );
}
