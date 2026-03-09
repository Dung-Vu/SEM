import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLearningProfile } from "@/lib/profile-engine";

// POST /api/analytics/recalculate — trigger recalculation for all or current user
export async function POST() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const result = await calculateLearningProfile(user.id);
    return NextResponse.json({ success: true, profile: result });
  } catch (error) {
    console.error("POST /api/analytics/recalculate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
