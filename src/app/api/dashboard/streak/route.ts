import { NextResponse } from "next/server";
import { calculateStreak, getLocalDateKey } from "@/lib/streak";
import { getStreakBonus } from "@/lib/exp";
import { getCurrentUser } from "@/lib/current-user";

/**
 * 17.5 — Dashboard Streak endpoint
 * Returns only streak data needed for the check-in widget.
 * Designed to respond in ~20ms.
 */
export async function GET() {
    try {
        const user = await getCurrentUser({
            lastCheckIn: true,
            streak: true,
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const streak = calculateStreak(user.lastCheckIn, user.streak);
        const streakBonus = getStreakBonus(streak);

        const todayStr = getLocalDateKey();
        let checkedInToday = false;
        if (user.lastCheckIn) {
            checkedInToday = getLocalDateKey(user.lastCheckIn) === todayStr;
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
