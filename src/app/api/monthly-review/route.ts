import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/exp";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const reviews = await prisma.monthlyReview.findMany({
      where: { userId: user.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
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
    const { lookback, obstacles, focus } = body as { lookback: string; obstacles: string; focus: string };

    if (!lookback && !obstacles && !focus) {
      return NextResponse.json({ error: "At least one field required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Award EXP for monthly review with transaction
    const expGain = 100;
    const newExp = user.exp + expGain;
    const newLevel = getLevelFromExp(newExp);

    const [review] = await prisma.$transaction([
      prisma.monthlyReview.upsert({
        where: { userId_month_year: { userId: user.id, month, year } },
        update: { lookback, obstacles, focus, totalExp: newExp },
        create: { userId: user.id, month, year, lookback, obstacles, focus, totalExp: newExp },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { exp: newExp, level: newLevel },
      }),
      prisma.activityLog.create({
        data: { userId: user.id, source: "monthly_review", amount: expGain, description: `📅 Monthly Review (${month}/${year})` },
      }),
    ]);

    return NextResponse.json({ success: true, review, expGain });
  } catch (error) {
    console.error("POST /api/monthly-review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
