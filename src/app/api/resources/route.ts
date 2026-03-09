import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/exp";

// GET — List all resources
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const resources = await prisma.resource.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const byCategory: Record<string, typeof resources> = {};
    for (const r of resources) {
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push(r);
    }

    const stats = {
      total: resources.length,
      done: resources.filter((r) => r.status === "done").length,
      inProgress: resources.filter((r) => r.status === "in_progress").length,
      want: resources.filter((r) => r.status === "want").length,
    };

    return NextResponse.json({ resources, byCategory, stats });
  } catch (error) {
    console.error("GET /api/resources error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Add resource or update status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, link, category, level, notes, status, action } = body as {
      id?: string;
      name?: string;
      link?: string;
      category?: string;
      level?: string;
      notes?: string;
      status?: string;
      action?: string;
    };

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Update status of existing resource
    if (action === "update_status" && id && status) {
      const resource = await prisma.resource.findUnique({ where: { id } });
      if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

      // Award EXP when marking as done
      if (status === "done" && resource.status !== "done") {
        const newExp = user.exp + resource.expReward;
        const newLevel = getLevelFromExp(newExp);

        const updated = await prisma.$transaction([
          prisma.resource.update({
            where: { id },
            data: { status },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { exp: newExp, level: newLevel },
          }),
          prisma.activityLog.create({
            data: { userId: user.id, source: "resource", amount: resource.expReward, description: `📖 ${resource.name}` },
          }),
        ]);

        return NextResponse.json({ success: true, resource: updated[0], expGain: resource.expReward });
      }

      const updated = await prisma.resource.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ success: true, resource: updated });
    }

    // Add new resource
    if (!name || !category) {
      return NextResponse.json({ error: "name and category are required" }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: { userId: user.id, name, link: link ?? "", category, level: level ?? "B1", notes: notes ?? "", status: status ?? "want" },
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error("POST /api/resources error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
