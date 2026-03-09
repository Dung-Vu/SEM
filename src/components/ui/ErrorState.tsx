"use client";

/**
 * ErrorState — contextual error display with icon + message + retry action.
 * Use instead of plain "Error" text for a friendlier UX.
 */
export function ErrorState({
    type = "server",
    onRetry,
    style,
}: {
    type?: "network" | "ai_timeout" | "empty" | "server";
    onRetry?: () => void;
    style?: React.CSSProperties;
}) {
    const configs = {
        network: {
            emoji: "📡",
            title: "Mất kết nối",
            message: "Kiểm tra internet rồi thử lại nhé",
            action: "Thử lại",
        },
        ai_timeout: {
            emoji: "🤖",
            title: "AI đang bận",
            message: "SENSEI đang xử lý nhiều request, thử lại sau 30 giây",
            action: "Thử lại",
        },
        empty: {
            emoji: "✅",
            title: "Hoàn thành!",
            message: "Không có gì để hiển thị — quay lại sau nhé",
            action: "Quay lại",
        },
        server: {
            emoji: "⚠️",
            title: "Có lỗi xảy ra",
            message: "Hệ thống đang gặp sự cố, thử lại sau vài phút",
            action: "Thử lại",
        },
    };

    const config = configs[type];

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "48px 24px",
                textAlign: "center",
                ...style,
            }}
        >
            <span style={{ fontSize: 40 }}>{config.emoji}</span>
            <h3
                style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                }}
            >
                {config.title}
            </h3>
            <p
                style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    margin: 0,
                    lineHeight: 1.5,
                }}
            >
                {config.message}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        marginTop: 8,
                        padding: "10px 24px",
                        borderRadius: 12,
                        border: "1px solid var(--border-gold)",
                        background: "rgba(245,166,35,0.08)",
                        color: "var(--gold)",
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "var(--font-body)",
                        cursor: "pointer",
                        transition: "all 0.15s var(--ease-spring)",
                    }}
                >
                    {config.action}
                </button>
            )}
        </div>
    );
}
