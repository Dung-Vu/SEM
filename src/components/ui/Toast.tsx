"use client";

import { useState, useCallback, createContext, useContext } from "react";

/**
 * Global Toast system — replaces ad-hoc toast patterns across the app.
 * Auto-dismiss, stacks max 3, animated slide-in from top.
 */

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
    showToast: () => {},
});

export function useToast() {
    return useContext(ToastContext);
}

const TOAST_ICONS: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
};

const TOAST_COLORS: Record<ToastType, string> = {
    success: "var(--emerald)",
    error: "var(--ruby)",
    info: "var(--cyan)",
    warning: "var(--amber)",
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback(
        (message: string, type: ToastType = "success") => {
            const id = ++nextId;
            setToasts((prev) => [...prev.slice(-2), { id, type, message }]); // max 3
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3500);
        },
        [],
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div
                style={{
                    position: "fixed",
                    top: "calc(env(safe-area-inset-top, 0px) + 12px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    pointerEvents: "none",
                    width: "calc(100% - 48px)",
                    maxWidth: 380,
                }}
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 14px",
                            borderRadius: 12,
                            background: "var(--bg-overlay)",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            border: `1px solid ${TOAST_COLORS[t.type]}30`,
                            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                            animation: "toast-slide-in 0.25s ease-out",
                            pointerEvents: "auto",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: TOAST_COLORS[t.type],
                                flexShrink: 0,
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: `${TOAST_COLORS[t.type]}20`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                lineHeight: 1,
                            }}
                        >
                            {TOAST_ICONS[t.type]}
                        </span>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--text-primary)",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            {t.message}
                        </span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
