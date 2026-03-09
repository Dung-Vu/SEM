"use client";

interface Props {
    celebration: { type: string; message: string } | null;
    onDismiss: () => void;
}

export function CelebrationOverlay({ celebration, onDismiss }: Props) {
    if (!celebration) return null;

    return (
        <div
            className="animate-fade-in"
            onClick={onDismiss}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    celebration.type === "levelup"
                        ? "radial-gradient(ellipse at 50% 40%, rgba(245,166,35,0.18) 0%, rgba(0,0,0,0.82) 60%)"
                        : "rgba(0,0,0,0.8)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
            }}
        >
            <div
                style={{
                    padding: "44px 32px",
                    textAlign: "center",
                    maxWidth: "340px",
                    width: "calc(100% - 40px)",
                }}
            >
                {celebration.type === "levelup" ? (
                    <>
                        {/* Animated gold ring */}
                        <div
                            style={{
                                width: 120,
                                height: 120,
                                borderRadius: "50%",
                                border: "3px solid rgba(245,200,66,0.4)",
                                boxShadow:
                                    "0 0 40px rgba(245,166,35,0.35), inset 0 0 30px rgba(245,166,35,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 24px",
                                animation:
                                    "levelBounce 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "42px",
                                    fontWeight: 800,
                                    color: "var(--gold)",
                                    animation:
                                        "levelGlow 2s ease-in-out 0.7s infinite",
                                    textShadow: "0 0 20px rgba(245,200,66,0.8)",
                                }}
                            >
                                {celebration.message.match(
                                    /Level (\d+)/,
                                )?.[1] ?? "↑"}
                            </span>
                        </div>

                        <p
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "13px",
                                fontWeight: 700,
                                letterSpacing: "0.28em",
                                textTransform: "uppercase",
                                color: "var(--gold)",
                                margin: "0 0 12px",
                                opacity: 0.85,
                            }}
                        >
                            Level Up
                        </p>

                        <p
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "26px",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                margin: "0 0 8px",
                                lineHeight: 1.2,
                            }}
                        >
                            {celebration.message}
                        </p>

                        <p
                            style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "13px",
                                color: "var(--text-muted)",
                                margin: "0 0 28px",
                            }}
                        >
                            Keep the streak alive. The kingdom grows!
                        </p>

                        <p
                            style={{
                                fontSize: "11px",
                                color: "rgba(255,255,255,0.25)",
                                letterSpacing: "0.08em",
                            }}
                        >
                            TAP TO DISMISS
                        </p>
                    </>
                ) : (
                    // Streak Celebration
                    <>
                        <div
                            style={{
                                fontSize: "64px",
                                marginBottom: "20px",
                                display: "inline-block",
                                animation:
                                    "levelBounce 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
                            }}
                        >
                            {celebration.message.split(" ")[0]}
                        </div>
                        <p
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "22px",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                lineHeight: 1.3,
                                margin: "0 0 24px",
                            }}
                        >
                            {celebration.message.substring(
                                celebration.message.indexOf(" ") + 1,
                            )}
                        </p>
                        <p
                            style={{
                                fontSize: "11px",
                                color: "rgba(255,255,255,0.25)",
                                letterSpacing: "0.08em",
                            }}
                        >
                            TAP TO DISMISS
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
