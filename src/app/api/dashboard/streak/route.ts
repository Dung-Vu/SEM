import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateStreak } from "@/lib/streak";
import { getStreakBonus } from "@/lib/exp";

/**
 * 17.5 — Dashboard Streak endpoint
 * Returns only streak data needed for the check-in widget.
 * Designed to respond in ~20ms.
 */
export async function GET() {
    try {
        const user = await prisma.user.findFirst({
            select: {
                lastCheckIn: true,
                streak: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const streak = calculateStreak(user.lastCheckIn, user.streak);
        const streakBonus = getStreakBonus(streak);

        // Determine if checked in today (UTC+7)
        const nowVN = new Date(Date.now() + 7 * 3600_000);
        const todayStr = nowVN.toISOString().slice(0, 10);
        let checkedInToday = false;
        if (user.lastCheckIn) {
            const lastVN = new Date(user.lastCheckIn.getTime() + 7 * 3600_000);
            checkedInToday = lastVN.toISOString().slice(0, 10) === todayStr;
        }

        return NextResponse.json(
            {
                streak,
                lastCheckIn: user.lastCheckIn?.toISOString() ?? null,
                streakBonus,
                checkedInToday,
            },
            {
                headers: {
                    "Cache-Control": "private, max-age=10, stale-while-revalidate=60",
                },
            },
        );
    } catch (error) {
        console.error("GET /api/dashboard/streak error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
