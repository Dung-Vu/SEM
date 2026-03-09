"use client";

/**
 * Reusable Skeleton component — uses .skeleton CSS class (shimmer animation).
 * Use this instead of Loader2 spinners for loading states.
 */
export function Skeleton({
    width,
    height,
    borderRadius = 8,
    style,
    className,
}: {
    width?: number | string;
    height?: number | string;
    borderRadius?: number | string;
    style?: React.CSSProperties;
    className?: string;
}) {
    return (
        <div
            className={`skeleton ${className ?? ""}`}
            style={{
                width,
                height,
                borderRadius,
                ...style,
            }}
        />
    );
}

/** Row skeleton — icon + two text lines */
export function SkeletonRow({ iconSize = 40 }: { iconSize?: number }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Skeleton width={iconSize} height={iconSize} borderRadius="50%" />
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                }}
            >
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={10} />
            </div>
        </div>
    );
}
