import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// Allowlist of known Web Push providers. Anything else is rejected to
// prevent a malicious client from registering an attacker-controlled URL
// and later exfiltrating the user's notifications (see H9/H5 in audit).
const PUSH_ENDPOINT_ALLOWLIST = [
  /^https:\/\/fcm\.googleapis\.com\//,
  /^https:\/\/.*\.push\.apple\.com\//,
  /^https:\/\/updates\.push\.services\.mozilla\.com\//,
  /^https:\/\/.*\.windows\.net\//,
  /^https:\/\/.*\.push\.notix\.pw\//,
  /^https:\/\/ntfy\.sh\//,
];

function isValidPushEndpoint(endpoint: string): boolean {
  if (typeof endpoint !== "string") return false;
  if (endpoint.length > 2048) return false;
  return PUSH_ENDPOINT_ALLOWLIST.some((re) => re.test(endpoint));
}

const MAX_FIELD_LENGTH = 512;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, p256dh, auth } = body as {
      endpoint?: unknown;
      p256dh?: unknown;
      auth?: unknown;
    };

    if (
      typeof endpoint !== "string" ||
      typeof p256dh !== "string" ||
      typeof auth !== "string"
    ) {
      return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 });
    }

    if (
      endpoint.length === 0 ||
      p256dh.length === 0 ||
      auth.length === 0 ||
      endpoint.length > MAX_FIELD_LENGTH ||
      p256dh.length > MAX_FIELD_LENGTH ||
      auth.length > MAX_FIELD_LENGTH
    ) {
      return NextResponse.json({ error: "Invalid subscription fields" }, { status: 400 });
    }

    if (!isValidPushEndpoint(endpoint)) {
      return NextResponse.json(
        { error: "Endpoint is not a recognized push provider" },
        { status: 400 }
      );
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
