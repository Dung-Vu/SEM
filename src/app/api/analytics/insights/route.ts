import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLearningProfile } from "@/lib/profile-engine";
import { generateAndCacheInsights, getInsights } from "@/lib/insight-generator";

// GET /api/analytics/insights — get cached insights
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const insights = await getInsights(user.id);
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("GET /api/analytics/insights error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/analytics/insights — recalculate profile and generate fresh insights
export async function POST(_req: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Recalculate profile first so insights are based on fresh data
    await calculateLearningProfile(user.id);
    await generateAndCacheInsights(user.id);

    const insights = await getInsights(user.id);
    return NextResponse.json({ success: true, insights });
  } catch (error) {
    console.error("POST /api/analytics/insights error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
