import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { awardExp } from "@/lib/exp";
import { getLocalMonthInfo } from "@/lib/streak";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const reviews = await prisma.monthlyReview.findMany({
      where: { userId: user.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const { month: currentMonth, year: currentYear } = getLocalMonthInfo();
    const hasThisMonth = reviews.some((r) => r.month === currentMonth && r.year === currentYear);

    return NextResponse.json({
      reviews: reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      hasThisMonth,
      currentMonth,
      currentYear,
    });
  } catch (error) {
    console.error("GET /api/monthly-review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lookback = sanitizeReviewText(body?.lookback);
    const obstacles = sanitizeReviewText(body?.obstacles);
    const focus = sanitizeReviewText(body?.focus);

    if (!lookback && !obstacles && !focus) {
      return NextResponse.json({ error: "At least one field required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { month, year } = getLocalMonthInfo();

    const expGain = 100;
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.monthlyReview.findUnique({
        where: { userId_month_year: { userId: user.id, month, year } },
      });
      if (existing) {
        const review = await tx.monthlyReview.update({
          where: { userId_month_year: { userId: user.id, month, year } },
          data: { lookback, obstacles, focus },
        });
        return { review, expGain: 0 };
      }

      const awarded = await awardExp(tx, user.id, expGain);
      const review = await tx.monthlyReview.create({
        data: { userId: user.id, month, year, lookback, obstacles, focus, totalExp: awarded.exp },
      });
      await tx.activityLog.create({
        data: { userId: user.id, source: "monthly_review", amount: expGain, description: `Monthly Review (${month}/${year})` },
      });
      return { review, expGain };
    });

    return NextResponse.json({ success: true, review: result.review, expGain: result.expGain });
  } catch (error) {
    console.error("POST /api/monthly-review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function sanitizeReviewText(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 3000) : "";
}
