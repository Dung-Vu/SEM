import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Auto-create PushSubscription table if not exists
async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PushSubscription" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "endpoint" TEXT NOT NULL,
      "p256dh" TEXT NOT NULL,
      "auth" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "PushSubscription_endpoint_key" UNIQUE ("endpoint")
    )
  `);
}

// POST /api/push/subscribe — save user's push subscription
export async function POST(req: NextRequest) {
  try {
    const { endpoint, p256dh, auth } = await req.json();

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 });
    }

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await ensureTable();

    // Upsert subscription by endpoint
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PushSubscription" ("id", "userId", "endpoint", "p256dh", "auth", "createdAt")
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())
      ON CONFLICT ("endpoint") DO UPDATE SET
        "userId" = EXCLUDED."userId",
        "p256dh" = EXCLUDED."p256dh",
        "auth" = EXCLUDED."auth"
    `, user.id, endpoint, p256dh, auth);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/push/subscribe:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

// DELETE /api/push/subscribe — unsubscribe
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: "No endpoint" }, { status: 400 });

    await prisma.$executeRawUnsafe(
      `DELETE FROM "PushSubscription" WHERE "endpoint" = $1`,
      endpoint
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/push/subscribe:", error);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
