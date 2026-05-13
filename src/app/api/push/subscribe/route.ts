import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// POST /api/push/subscribe - save user's push subscription
export async function POST(req: NextRequest) {
  try {
    const { endpoint, p256dh, auth } = await req.json();

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: user.id, p256dh, auth },
      create: { userId: user.id, endpoint, p256dh, auth },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/push/subscribe:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

// DELETE /api/push/subscribe - unsubscribe
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: "No endpoint" }, { status: 400 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/push/subscribe:", error);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
