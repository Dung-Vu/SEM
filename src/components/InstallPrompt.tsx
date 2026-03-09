"use client";

import { useEffect, useState } from "react";
import { Swords } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // SSR guard
        if (typeof window === "undefined") return;

        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            return;
        }

        // Check if user dismissed before
        const dismissed = localStorage.getItem("eq-install-dismissed");
        if (dismissed) {
            const dismissedAt = parseInt(dismissed);
            const daysSinceDismissed =
                (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return; // Don't show again for 7 days
            }
        }

        // Check if iOS
        const iOS =
            /iPad|iPhone|iPod/.test(navigator.userAgent) &&
            !(window as any).MSStream;
        setIsIOS(iOS);

        if (!iOS) {
            const handleBeforeInstallPrompt = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e as BeforeInstallPromptEvent);

                // Show prompt after 2 seconds (let user see the app first)
                setTimeout(() => {
                    setShowPrompt(true);
                }, 2000);
            };

            window.addEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt,
            );

            return () => {
                window.removeEventListener(
                    "beforeinstallprompt",
                    handleBeforeInstallPrompt,
                );
            };
        } else {
            // iOS: show after 3 seconds
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
        }
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            setShowPrompt(false);
            setDeferredPrompt(null);
        } catch (err) {
            console.error("[InstallPrompt] Error:", err);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("eq-install-dismissed", Date.now().toString());
    };

    if (!showPrompt) return null;

    return (
        <div
            className="animate-scale-in"
            style={{
                position: "fixed",
                bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
                left: "16px",
                right: "16px",
                zIndex: 999,
            }}
        >
            <div
                className="glass-card"
                style={{
                    padding: "16px",
                    borderColor: "rgba(245,200,66,0.3)",
                    background: "rgba(13,17,23,0.96)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <Swords size={24} color="var(--gold)" strokeWidth={2} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <p
                            style={{
                                fontSize: "14px",
                                fontFamily: "var(--font-display)",
                                fontWeight: 700,
                                margin: "0 0 4px 0",
                                color: "var(--text-primary)",
                            }}
                        >
                            {isIOS ? "Add to Home Screen" : "Install SEM"}
                        </p>

                        {isIOS ? (
                            <p
                                style={{
                                    fontSize: "12px",
                                    fontFamily: "var(--font-body)",
                                    color: "var(--text-secondary)",
                                    margin: "0 0 8px 0",
                                    lineHeight: 1.4,
                                }}
                            >
                                Tap <strong>Share</strong> →{" "}
                                <strong>Add to Home Screen</strong>
                            </p>
                        ) : (
                            <p
                                style={{
                                    fontSize: "12px",
                                    fontFamily: "var(--font-body)",
                                    color: "var(--text-secondary)",
                                    margin: "0 0 8px 0",
                                }}
                            >
                                Cài app để trải nghiệm tốt hơn!
                            </p>
                        )}

                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                                marginTop: "8px",
                            }}
                        >
                            {!isIOS && (
                                <button
                                    onClick={handleInstall}
                                    className="btn-primary"
                                    style={{
                                        flex: 1,
                                        padding: "8px 12px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                    }}
                                >
                                    Install
                                </button>
                            )}

                            <button
                                onClick={handleDismiss}
                                className="btn-secondary"
                                style={{
                                    flex: isIOS ? 1 : "auto",
                                    padding: "8px 12px",
                                    fontSize: "13px",
                                }}
                            >
                                {isIOS ? "Got it" : "Later"}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleDismiss}
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            fontSize: "18px",
                            cursor: "pointer",
                            padding: "0",
                            lineHeight: 1,
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}
