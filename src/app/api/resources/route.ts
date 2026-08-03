import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { awardExp } from "@/lib/exp";
import type { Prisma } from "@prisma/client";

const RESOURCE_STATUSES = new Set(["want", "in_progress", "done"]);

// GET — List all resources
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Update status of existing resource
    if (action === "update_status" && id && status) {
      if (!RESOURCE_STATUSES.has(status)) {
        return NextResponse.json({ error: "Invalid resource status" }, { status: 400 });
      }

      const resource = await prisma.resource.findUnique({ where: { id } });
      if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
      if (resource.userId !== user.id) {
        return NextResponse.json({ error: "Resource not found" }, { status: 404 });
      }

      // Award EXP when marking as done
      if (status === "done" && resource.status !== "done") {
        const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const [resourceUpdated] = await Promise.all([
            tx.resource.update({
            where: { id },
            data: { status },
            }),
            awardExp(tx, user.id, resource.expReward),
            tx.activityLog.create({
            data: { userId: user.id, source: "resource", amount: resource.expReward, description: `📖 ${resource.name}` },
            }),
          ]);
          return resourceUpdated;
        });

        return NextResponse.json({ success: true, resource: updated, expGain: resource.expReward });
      }

      const updated = await prisma.resource.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ success: true, resource: updated });
    }

    // Add new resource
    if (status !== undefined && !RESOURCE_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid resource status" }, { status: 400 });
    }

    if (typeof name !== "string" || typeof category !== "string" || !name.trim() || !category.trim()) {
      return NextResponse.json({ error: "name and category are required" }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        userId: user.id,
        name: name.trim().slice(0, 200),
        link: typeof link === "string" ? link.trim().slice(0, 500) : "",
        category: category.trim().slice(0, 80),
        level: typeof level === "string" && level.trim() ? level.trim().slice(0, 20) : "B1",
        notes: typeof notes === "string" ? notes.trim().slice(0, 1000) : "",
        status: status ?? "want",
      },
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error("POST /api/resources error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
