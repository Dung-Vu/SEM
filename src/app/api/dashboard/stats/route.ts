import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 17.5 — Dashboard Stats endpoint
 * Returns only skill stats — heavier query, loads after hero+streak.
 * Designed to respond in ~50ms.
 */
export async function GET() {
    try {
        const user = await prisma.user.findFirst({
            select: { stats: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const stats = user.stats;

        return NextResponse.json(
            {
                stats: stats
                    ? {
                          vocab: stats.vocab,
                          grammar: stats.grammar,
                          listening: stats.listening,
                          speaking: stats.speaking,
                          writing: stats.writing,
                      }
                    : null,
            },
            {
                headers: {
                    // Stats change slowly — can be stale for 10 min
                    "Cache-Control": "private, max-age=60, stale-while-revalidate=600",
                },
            },
        );
    } catch (error) {
        console.error("GET /api/dashboard/stats error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
