import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp, getExpForNextLevel, getKingdomInfo } from "@/lib/exp";

/**
 * 17.5 — Dashboard Hero endpoint
 * Returns only the critical above-the-fold data: name, level, EXP.
 * Designed to respond in ~30ms vs ~150ms for the full /api/user.
 */
export async function GET() {
    try {
        const user = await prisma.user.findFirst({
            select: {
                username: true,
                exp: true,
                level: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const level = getLevelFromExp(user.exp);
        const levelProgress = getExpForNextLevel(level);
        const kingdom = getKingdomInfo(level);

        const daysSinceStart = Math.max(
            1,
            Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000),
        );

        return NextResponse.json(
            {
                username: user.username,
                level,
                exp: user.exp,
                levelProgress,
                kingdom,
                daysSinceStart,
                createdAt: user.createdAt.toISOString(),
            },
            {
                headers: {
                    // CDN-friendly: stale-while-revalidate 30s
                    "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
                },
            },
        );
    } catch (error) {
        console.error("GET /api/dashboard/hero error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
